var chunksize = 65536


function Transport_Host_init(transport, db)
{
    // Filereader support (be able to host files from the filesystem)
    if(typeof FileReader == "undefined")
    {
        console.warn("'Filereader' is not available, can't be able to host files");
        oldBrowser()
        return
    }

    // filelist

    transport._send_files_list = function(filelist)
    {
        // Stupid conversion because JSON.stringify() doesn't parse
        // File objects (use them as plain objects in the best case)
        // Maybe add a File.toString() method would do the trick,
        // but later would not be able to store them on IndexedDB...
        //
        // I miss you Python :-(
        var files_send = []

        for(var i = 0, file; file = filelist[i]; i++)
            files_send.push({"name": file.name, "size": file.size,
                             "type": file.type});

        transport.emit('fileslist.send', files_send);
    }

    transport.addEventListener('fileslist.query', function()
    {
        db.sharepoints_getAll(null, transport._send_files_list)
    })

    // transfer

    transport.addEventListener('transfer.query', function(filename, chunk)
    {
        var reader = new FileReader();
            reader.onerror = function(evt)
            {
                console.error("peer.transfer_query("+filename+", "+chunk+") = '"+evt.target.result+"'")
            }
            reader.onload = function(evt)
            {
                transport.emit('transfer.send', filename, chunk, evt.target.result);
            }

        var start = chunk * chunksize;
        var stop  = start + chunksize;

        db.sharepoints_get(filename, function(file)
        {
            var filesize = parseInt(file.size);
            if(stop > filesize)
                stop = filesize;

            reader.readAsBinaryString(file.slice(start, stop));
        })
    })
}