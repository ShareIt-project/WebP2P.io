var chunksize = 65536


// Filereader support (be able to host files from the filesystem)
if(typeof FileReader == "undefined")
{
    console.warn("'Filereader' is not available, can't be able to host files");
    No_FileReader()
}


function Transport_Host_init(transport, db)
{
    // Filereader support (be able to host files from the filesystem)
    if(typeof FileReader == "undefined")
        return

    // filelist

        transport._send_files_list = function(fileslist)
        {
            var files_send = []

            for(var i = 0, fileentry; fileentry = fileslist[i]; i++)
            {
                var blob = fileentry.file || fileentry.blob
                var path = fileentry.sharedpoint+'/'+fileentry.path

                files_send.push({'hash': fileentry.hash,
                                 'path': path,
                                 'name': blob.name || fileentry.name,
                                 'size': blob.size,
                                 'type': blob.type});
            }

            transport.emit('fileslist.send', files_send);
        }

    transport._send_file_added = function(fileentry)
    {
        var blob = fileentry.file || fileentry.blob
        var path = fileentry.sharedpoint+'/'+fileentry.path

        transport.emit('fileslist.added', {'hash': fileentry.hash,
                                           'path': path,
                                           'name': blob.name || fileentry.name,
                                           'size': blob.size,
                                           'type': blob.type});
    }

    transport._send_file_deleted = function(fileentry)
    {
        transport.emit('fileslist.deleted', fileentry.hash);
    }

    transport.addEventListener('fileslist.query', function(event)
    {
        db.files_getAll(null, transport._send_files_list)
    })

    // transfer

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