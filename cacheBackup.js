function CacheBackup(db)
{
    zip.workerScriptsPath = "../../js/webp2p/lib/zip.js/";

    this.export = function(onprogress, onerror)
    {
        db.files_getAll(null, function(fileslist)
        {
            // Create a new filesystem inside the Zip file
            var fs = new zip.fs.FS()

            // Create folder to store the blobs
            var blobs = fs.root.addDirectory('blobs')

            // Run over all the cache-stored files and add them to the
            // corresponding folder and generate the JSON metadata file
            var files = []

            for(var i=0, fileentry; fileentry=fileslist[i]; i++)
                if(fileentry.blob)
                {
                    // Store blob on Zip file
                    blobs.addBlob(fileentry.hash, fileentry.blob)

                    // Generate file path
                    var path = ""
                    if(fileentry.sharedpoint)
                    {
                        path += fileentry.sharedpoint.name
                        if(fileentry.path != "")
                            path += '/'+fileentry.path
                    }

                    // Generate file metadata
                    var file = {hash: fileentry.hash,
                                path: path,
                                name: fileentry.name}

                    if(fileentry.bitmap)
                        file.bitmap = bitmap

                    // Add file to files metadata list
                    files.push(file)
                }

            // Store the JSON metadata file inside the Zip file
            fs.root.addText('files.json', JSON.stringify(files))

            // Generate and export the cache backup in the Zip file
            fs.exportBlob(function(blob)
            {
                var date = new Date()
                var name = 'WebP2P-CacheBackup_'+date.toISOString()+'.zip'

                savetodisk(blob, name)
            },
            onprogress, onerror)
        })
    }

    this.import = function(blob, onerror)
    {
        var fs = new zip.fs.FS()
            fs.importBlob(blob, function()
            {
                // Check blobs metadata
                var files = fs.root.getChildByName('files.json')

                files.getText(function(text)
                {
                    // Extract blobs data and add it to cache
                    var blobs = fs.root.getChildByName('blobs')

                    var files = JSON.parse(text)
                    for(var i=0, file; file=files; i++)
                        db.files_get(file.hash, function(fileentry)
                        {
                            var blob = blobs.getChildByName(file.hash)

                            // Fileentry exists on cache
                            if(fileentry)
                            {
                                // Fileentry is not completed, update it
                                if(fileentry.bitmap)
                                {
                                    var chunks = fileentry.bitmap.indexes()
                                    for(var i=0, chunk; chunk=chunks[i]; i++)
                                        if(blob.bitmap == undefined
                                        || blob.bitmap.get(chunk))
                                        {
                                            var reader = new FileReader();
                                                reader.onerror = function(evt)
                                                {
                                                    console.error("CacheBackup.import("+file.hash+", "+chunk+") = '"+evt.target.result+"'")
                                                }
                                                reader.onload = function(evt)
                                                {
                                                    var data = evt.target.result

                                                    updateFile(fileentry, chunk, data)

                                                    // Check for pending chunks and require them or save the file
                                                    var pending_chunks = fileentry.bitmap.indexes(false).length

                                                    // There are no more chunks, set file as fully downloaded
                                                    if(!pending_chunks)
                                                        delete fileentry.bitmap;

                                                    // Update the fileentry status on the database
                                                    db.files_put(fileentry)
                                                }

                                            var start = chunk * chunksize;
                                            var stop  = start + chunksize;

                                            blob.getBlob(null, function(blob)
                                            {
                                                var filesize = parseInt(blob.size);
                                                if(stop > filesize)
                                                    stop = filesize;

                                                reader.readAsBinaryString(blob.slice(start, stop));
                                            })
                                        }
                                }
                            }

                            // Fileentry don't exists on cache, add it
                            else
                                blob.getBlob(null, function(blob)
                                {
                                    var fileentry = {hash: file.hash,
                                                     path: file.path,
                                                     name: file.name,
                                                     blob: blob}
                                    if(file.bitmap)
                                        fileentry.bitmap = file.bitmap

                                    db.files_add(fileentry)
                                })
                        })
                })
            },
            onerror)
    }
}