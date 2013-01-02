var chunksize = 65536


/**
 * Addapt a transport layer to be used as a peer
 * @param transport
 * @param {IDBdatabase} db WebP2P database
 * @param {PeersManager} peersManager {PeersManager} object
 */
function Transport_Peer_init(transport, db, peersManager)
{
    /**
     * Check if we already have the file and set it references to our copy
     * @param {Fileentry} fileentry {Fileentry} to be checked
     * @param {Array} fileslist List of {Fileentry}s
     */
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

    /**
     * Sort in place the fileslist by path and filename
     * @param {Array} fileslist List of {Fileentry}s
     */
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

    /**
     * Catch new sended data for the other peer fileslist
     */
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

    /**
     * Request the other peer fileslist
     */
    transport.fileslist_query = function()
    {
        transport.emit('fileslist.query');
    }


    // fileslist updates

    /**
     * Catch when the other peer has added a new file
     */
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

    /**
     * Catch when the other peer has deleted a file
     */
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

    /**
     * Catch new sended data for a file
     */
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
            updateFile(fileentry, chunk, data)

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
                    peersManager.transfer_end(fileentry)
                })
            }
        })
    })

    /**
     * Request (more) data for a file
     * @param {Fileentry} Fileentry of the file to be requested
     * @param {Number} chunk Chunk of the file to be requested
     */
    transport.transfer_query = function(fileentry, chunk)
    {
        transport.emit('transfer.query', fileentry.hash, chunk)
    }
}