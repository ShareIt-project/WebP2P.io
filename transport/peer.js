var chunksize = 65536


function Transport_Peer_init(transport, db, peersManager)
{
    function check_ifOwned(fileentry, fileslist)
    {
        // We add here ad-hoc the channel of the peer where we got
        // the file since we currently don't have support for hashes
        // nor tracker systems
        fileentry.channel = transport

        // Check if we have the file already, and if so set it our copy
        // bitmap and blob reference
        for(var j=0, file_hosted; file_hosted = fileslist[j]; j++)
            if(fileentry.hash == file_hosted.hash)
            {
                fileentry.bitmap = file_hosted.bitmap
                fileentry.blob   = file_hosted.file || file_hosted.blob

                break;
            }
    }

    function sort_fileslist(fileslist)
    {
        fileslist.sort(function(a, b)
        {
            function strcmp(str1, str2)
            {
                return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
            }

            var result = strcmp(a.path, b.path);
            if(result) return result;

            var result = strcmp(a.file ? a.file.name : a.name,
                                b.file ? b.file.name : b.name);
            if(result) return result;
        })
    }


    // fileslist

    var _fileslist = []

    transport.addEventListener('fileslist.send', function(event)
    {
        var fileentries = event.data[0]

        // Check if we have already any of the files
        // It's stupid to try to download it... and also give errors
        db.files_getAll(null, function(fileslist)
        {
            for(var i=0, fileentry; fileentry = fileentries[i]; i++)
                check_ifOwned(fileentry, fileslist)

            sort_fileslist(fileentries)

            // Update the peer's fileslist with the checked data
            _fileslist = fileentries

            // Notify about fileslist update
            transport.dispatchEvent({type: "fileslist._updated",
                                     data: [_fileslist]})
        })
    })
    transport.fileslist_query = function()
    {
        transport.emit('fileslist.query');
    }


    // fileslist updates

    transport.addEventListener('fileslist.added', function(event)
    {
        var fileentry = event.data[0]

        // Check if we have the file previously listed
        for(var i=0, listed; listed = _fileslist[i]; i++)
            if(fileentry.path == listed.path
            && fileentry.name == listed.name)
                return

        // Check if we have already the files
        db.files_getAll(null, function(fileslist)
        {
            check_ifOwned(fileentry, fileslist)

            // Add the fileentry to the fileslist
            _fileslist.push(fileentry)

            sort_fileslist(_fileslist)

            // Notify about fileslist update
            transport.dispatchEvent({type: "fileslist._updated",
                                     data: [_fileslist]})
        })
    })
    transport.addEventListener('fileslist.deleted', function(event)
    {
        var fileentry = event.data[0]

        // Search for the fileentry on the fileslist
        for(var i=0, listed; listed = _fileslist[i]; i++)
            if(fileentry.path == listed.path
            && fileentry.name == listed.name)
            {
                // Remove the fileentry for the fileslist
                _fileslist.splice(i, 1)

                // Notify about fileslist update
                transport.dispatchEvent({type: "fileslist._updated",
                                         data: [_fileslist]})

                return
            }
    })


    // transfer

    function _savetodisk(fileentry)
    {
        // Auto-save downloaded file
        var save = document.createElement("A");
            save.href = window.URL.createObjectURL(fileentry.blob)
            save.target = "_blank"      // This can give problems...
            save.download = fileentry.name   // This force to download with a filename instead of navigate

        save.click()

        // Hack to remove the ObjectURL after it have been saved and not before
        setTimeout(function()
        {
            window.URL.revokeObjectURL(save.href)
        }, 1000)
    }

    transport.addEventListener('transfer.send', function(event)
    {
        var hash = event.data[0]
        var chunk = parseInt(event.data[1])
        var data = event.data[2]

        // Fix back data transmited as UTF-8 to binary
        var byteArray = new Uint8Array(data.length);
        for(var i = 0; i < data.length; i++)
            byteArray[i] = data.charCodeAt(i) & 0xff;

        data = byteArray

        db.files_get(hash, function(fileentry)
        {
            fileentry.bitmap.set(chunk, true)

            // Create new FileWriter
            var fw = new FileWriter(fileentry.blob)

            // Calc and set pos, and increase blob size if necesary
            var pos = chunk * chunksize;
            if(fw.length < pos)
                fw.truncate(pos)
            fw.seek(pos)

            // Write data to the blob
            var blob = fw.write(data)

            // This is not standard, but it's the only way to get out the
            // created blob
            if(blob != undefined)
                fileentry.blob = blob

            // Check for pending chunks and require them or save the file
            var pending_chunks = fileentry.bitmap.indexes(false).length
            if(pending_chunks)
            {
                var chunks = fileentry.size/chunksize;
                if(chunks % 1 != 0)
                    chunks = Math.floor(chunks) + 1;

                // Notify about transfer update
                peersManager.dispatchEvent({type: "transfer.update",
                                            data: [fileentry, 1 - pending_chunks/chunks]})

                // Demand more data from one of the pending chunks after update
                // the fileentry status on the database
                db.files_put(fileentry, function()
                {
                    peersManager.transfer_query(fileentry)
                })
            }
            else
            {
                // There are no more chunks, set file as fully downloaded
                delete fileentry.bitmap;

                db.files_put(fileentry, function()
                {
                    // Auto-save downloaded file
                    _savetodisk(fileentry)

                    // Notify about transfer end
                    peersManager.dispatchEvent({type: "transfer.end",
                                                data: [fileentry]})
                    console.log("Transfer of "+fileentry.name+" finished!");
                })
            }
        })
    })
}