var chunksize = 65536


function Transport_Peer_init(transport, db, host)
{
    // fileslist

    transport.addEventListener('fileslist.send', function(event)
    {
        var socketId = event.data[0]
        var files = event.data[1]

        // Check if we have already any of the files
        // It's stupid to try to download it... and also give errors
        db.sharepoints_getAll(null, function(filelist)
        {
            for(var i=0, file; file = files[i]; i++)
            {
                // We add here ad-hoc the channel of the peer where we got
                // the file since we currently don't have support for hashes
                // nor tracker systems
                file.channel = transport
                file.socketId = socketId

                for(var j=0, file_hosted; file_hosted = filelist[j]; j++)
                    if(file.name == file_hosted.name)
                    {
                        file.bitmap = file_hosted.bitmap
                        file.blob   = file_hosted.blob || file_hosted

                        break;
                    }
            }

            // Notify about fileslist update
            host.dispatchEvent({'type': "fileslist_peer.update",
                                'data': [socketId, files]})
        })
    })

    function _savetodisk(file)
    {
        // Auto-save downloaded file
        var save = document.createElement("A");
            save.href = window.URL.createObjectURL(file.blob)
            save.target = "_blank"      // This can give problems...
            save.download = file.name   // This force to download with a filename instead of navigate

        var evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);

        save.dispatchEvent(evt);

        window.URL.revokeObjectURL(save.href)
    }

    // Get the channel of one of the peers that have the file from its hash.
    // Since the hash and the tracker system are currently not implemented we'll
    // get just the channel of the peer where we got the file that we added
    // ad-hoc before
    function getChannel(file)
    {
        return file.channel
    }

    transport.addEventListener('transfer.send', function(event)
    {
        var socketId = event.data[0]
        var filename = event.data[1]
        var chunk = parseInt(event.data[2])
        var data = event.data[3]

        db.sharepoints_get(filename, function(file)
        {
            remove(file.bitmap, chunk)

            // Update blob
            var start = chunk * chunksize;
            var stop  = start + chunksize;

            var byteArray = new Uint8Array(data.length);
            for(var i = 0; i < data.length; i++)
                byteArray[i] = data.charCodeAt(i) & 0xff;

            var blob = file.blob
            var head = blob.slice(0, start)
            var padding = start-head.size
            if(padding < 0)
                padding = 0;
            file.blob = new Blob([head, new Uint8Array(padding), byteArray,
                                  blob.slice(stop)],
                                 {"type": blob.type})

            var pending_chunks = file.bitmap.length
            if(pending_chunks)
            {
                var chunks = file.size/chunksize;
                if(chunks % 1 != 0)
                    chunks = Math.floor(chunks) + 1;

                // Notify about transfer update
                host.dispatchEvent({type: "transfer.update",
                                     data: [file, 1 - pending_chunks/chunks]})

                // Demand more data from one of the pending chunks
                db.sharepoints_put(file, function()
                {
                    getChannel(file).emit('transfer.query', socketId,
                                          file.name, getRandom(file.bitmap));
                })
            }
            else
            {
                // There are no more chunks, set file as fully downloaded
                delete file.bitmap;

                db.sharepoints_put(file, function()
                {
                    // Auto-save downloaded file
                    _savetodisk(file)

                    host.dispatchEvent({type: "transfer.end", data: [file]})
                    console.log("Transfer of "+file.name+" finished!");
                })
            }
        })
    })

    host._transferbegin = function(file)
    {
        // Calc number of necesary chunks to download
        var chunks = file.size/chunksize;
        if(chunks % 1 != 0)
            chunks = Math.floor(chunks) + 1;

        // Add a blob container and a bitmap to our file stub
        file.blob = new Blob([''], {"type": file.type})
        file.bitmap = Bitmap(chunks)

        // Insert new "file" inside IndexedDB
        db.sharepoints_add(file,
        function()
        {
            host.dispatchEvent({type: "transfer.begin", data: [file]})
            console.log("Transfer begin: '"+file.name+"' = "+JSON.stringify(file))

            // Demand data from the begining of the file
            getChannel(file).emit('transfer.query', file.socketId, file.name,
                                                    getRandom(file.bitmap))
        },
        function(errorCode)
        {
            console.error("Transfer begin: '"+file.name+"' is already in database.")
        })
    }
}