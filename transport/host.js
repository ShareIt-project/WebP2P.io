var chunksize = 65536


// Filereader support (be able to host files from the filesystem)
if(typeof FileReader == "undefined")
{
    console.warn("'Filereader' is not available, can't be able to host files");
    No_FileReader()
}


/**
 * Addapt a transport layer to be used as a host
 * @param transport
 * @param {IDBdatabase} db WebP2P database
 */
function Transport_Host_init(transport, db)
{
    // Filereader support (be able to host files from the filesystem)
    if(typeof FileReader == "undefined")
        return

    // filelist

    function generateFileObject(fileentry)
    {
        var blob = fileentry.file || fileentry.blob
        var path = ""
        if(fileentry.sharedpoint)
        {
            path += fileentry.sharedpoint.name
            if(fileentry.path != "")
                path += '/'+fileentry.path
        }

        return {'hash': fileentry.hash,
                'path': path,
                'name': blob.name || fileentry.name,
                'size': blob.size,
                'type': blob.type}
    }

    /**
     * Addapt and send to the other peer our list of shared files
     * @param {Array} fileslist Our list of {Fileentry}s
     */
    transport._send_files_list = function(fileslist)
    {
        var files_send = []

        for(var i = 0, fileentry; fileentry = fileslist[i]; i++)
            files_send.push(generateFileObject(fileentry));

        transport.emit('fileslist.send', files_send);
    }

    /**
     * Notify to the other peer that we have added a new file
     * @param {Fileentry} fileentry {Fileentry} of the new added file
     */
    transport._send_file_added = function(fileentry)
    {
        transport.emit('fileslist.added', generateFileObject(fileentry));
    }

    /**
     * Notify to the other peer that we have deleted a new file
     * @param {Fileentry} fileentry {Fileentry} of the deleted file
     */
    transport._send_file_deleted = function(fileentry)
    {
        transport.emit('fileslist.deleted', fileentry.hash);
    }

    /**
     * Catch request for our files list
     */
    transport.addEventListener('fileslist.query', function(event)
    {
        db.files_getAll(null, transport._send_files_list)
    })

    // transfer

    /**
     * Catch request of file data
     */
    transport.addEventListener('transfer.query', function(event)
    {
        var hash = event.data[0]
        var chunk = event.data[1]

        var reader = new FileReader();
            reader.onerror = function(evt)
            {
                console.error("host.transfer_query("+hash+", "+chunk+") = '"+evt.target.result+"'")
            }
            reader.onload = function(evt)
            {
                transport.emit('transfer.send', hash, chunk, evt.target.result);
            }

        var start = chunk * chunksize;
        var stop  = start + chunksize;

        db.files_get(hash, function(fileentry)
        {
            var blob = fileentry.file || fileentry.blob

            var filesize = parseInt(blob.size);
            if(stop > filesize)
                stop = filesize;

            reader.readAsBinaryString(blob.slice(start, stop));
        })
    })
}