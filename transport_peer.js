function Transport_Peer_init(transport, db, host)
{
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

    transport.addEventListener('fileslist.send', function(files)
    {
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

                for(var j=0, file_hosted; file_hosted = filelist[j]; j++)
                    if(file.name == file_hosted.name)
                    {
                        file.bitmap = file_hosted.bitmap
                        file.blob   = file_hosted.blob || file_hosted

                        break;
                    }
            }

            host.dispatchEvent({type:"fileslist_peer.update", data:files})
        })
    })

    // Filereader support (be able to host files from the filesystem)
    if(typeof FileReader == "undefined")
        console.warn("'Filereader' is not available, can't be able to host files");

    else
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

    // Peer

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

    transport.addEventListener('transfer.send', function(filename, chunk, data)
    {
        chunk = parseInt(chunk)

        db.sharepoints_get(filename, function(file)
        {
            remove(file.bitmap, chunk)

            // Update blob
            var pos = chunk * chunksize;

            var fw = FileWriter(file.blob)
            if(fw.length < pos)
                fw.truncate(pos)
            fw.seek(pos)

//            var byteArray = new Uint8Array(data.length);
//            for(var i = 0; i < data.length; i++)
//                byteArray[i] = data.charCodeAt(i) & 0xff;

            var blob = fw.write(byteArray.buffer)
            if(blob != undefined)
                file.blob = blob

            var pending_chunks = file.bitmap.length
            if(pending_chunks)
            {
                var chunks = file.size/chunksize;
                if(chunks % 1 != 0)
                    chunks = Math.floor(chunks) + 1;

                host.dispatchEvent({type:"transfer.update",
                                    data:[file, 1 - pending_chunks/chunks]})

                // Demand more data from one of the pending chunks
                db.sharepoints_put(file, function()
                {
                    getChannel(file).emit('transfer.query',
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

                    host.dispatchEvent({type:"transfer.end", file:file})
                    console.log("Transfer of "+file.name+" finished!");
                })
            }
        })
    })

    var self = this

    transport._transferbegin = function(file)
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
            self.dispatchEvent({type:"transfer.begin", data:file})
            console.log("Transfer begin: '"+file.name+"' = "+JSON.stringify(file))

            // Demand data from the begining of the file
            getChannel(file).emit('transfer.query', file.name,
                                                    getRandom(file.bitmap))
        },
        function(errorCode)
        {
            console.error("Transfer begin: '"+file.name+"' is already in database.")
        })
    }

    transport.fileslist_query = function()
    {
        transport.emit('fileslist.query');
    }
}