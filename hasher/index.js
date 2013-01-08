/**
 * Update the SharedPoints and hash its files
 * @param {IDBDatabase} db ShareIt! database
 * @param {Function|null} policy Function to manage the policy access
 */
function Hasher(db, policy)
{
    var queue = []
    var timeout

    var self = this

    /**
     * Refresh hashes after one hour
     */
    function updateTimeout()
    {
        clearTimeout(timeout)
        timeout = setTimeout(function()
        {
            self.refresh()
//        }, 30*1000)
        }, 60*60*1000)
    }

    /**
     * Delete a {Fileentry} (mainly because it was removed from the filesystem)
     * @param {Fileentry} fileentry {Fileentry} to be removed from database
     */
    function fileentry_delete(fileentry)
    {
        // Remove file from the database
        db.files_delete(fileentry.hash, function()
        {
            // Notify that the file have been deleted
            if(self.ondeleted)
                self.ondeleted(fileentry)
        })
    }

    /**
     * Set a {Fileentry} as hashed and store it on the database
     * @param {Fileentry} fileentry {Fileentry} to be added to the database
     */
    function fileentry_hashed(fileentry)
    {
        // Remove hashed file from the queue
        queue.splice(queue.indexOf(fileentry.file))

        /**
         * Add file to the database
         */
        function addFile(fileentry)
        {
            db.files_put(fileentry, function()
            {
                // Notify that the file have been hashed
                if(self.onhashed)
                    self.onhashed(fileentry)
            })
        }

        // Dropbox plugin start
        if(dropboxClient
        && fileentry.sharedpoint.name == "Dropbox")
        {
            var options = {download: true, downloadHack: true}

            dropboxClient.makeUrl(fileentry.path+'/'+name, options,
            function(error, publicUrl)
            {
                if(publicUrl)
                    fileentry.dropbox = publicUrl.url

                addFile(fileentry)
            })
        }
        else
        // Dropbox plugin end
            addFile(fileentry)
    }

    var worker = new Worker('../../js/webp2p/hasher/worker.js');
        worker.onmessage = function(event)
        {
            var fileentry = event.data[1]

            switch(event.data[0])
            {
                case 'delete':
                    fileentry_delete(fileentry)
                    break

                case 'hashed':
                    fileentry_hashed(fileentry)
            }

            // Update refresh timeout after each worker message
            updateTimeout()
        }

    /**
     * Hash the files from a {Sharedpoint}.
     * @param {Array} files List of files to be hashed
     */
    this.hash = function(files)
    {
      // Add files to queue if they are not there yet
	  for(var j=0, file; file=queue[j]; j++)
        for(var i=0, sp; sp=files[i];)
          if(!sp.size)          // File has zero size
          {
              // Precalculated hash for zero sized files
              sp.hash = "z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg=="
              fileentry_hashed(sp)

              files.splice(i)
          }
          else if(sp == file)   // File is already on the queue list
	          files.splice(i)
	      else                  // Normal file, hash it
	        i++;

      if(files.length)
      {
        var sharedpoint = {name: files[0].webkitRelativePath.split('/')[0],
                           type: 'folder'}

        files = Array.prototype.slice.call(files)
        queue = queue.concat(files)


        files.sort(function(a, b)
        {
            var str1 = a.webkitRelativePath
            var str2 = b.webkitRelativePath

            return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
        })

        // Run over all the files on the queue and process them
        for(var i=0, file; file=files[i]; ++i)
        {
            var fileentry = {'sharedpoint': sharedpoint,
                             'path': file.webkitRelativePath.split('/').slice(1,-1).join('/'),
                             'file': file}

            worker.postMessage(['hash',fileentry]);
        }


        sharedpoint.size = 0
        db.sharepoints_put(sharedpoint)
      }
    }

    /**
     * Refresh the {Sharedpoint}s and {Fileentry}s on the database
     */
    this.refresh = function()
    {
        // Hasher is working, just return
        if(timeout == 'hashing')
            return

        // Hasher is not working, start hashing files
        console.info("Starting hashing refresh")

        clearTimeout(timeout)
        timeout = 'hashing'

        db.sharepoints_getAll(null, function(sharedpoints)
        {
            db.files_getAll(null, function(fileentries)
            {
                function sharedpoint_exist(name)
                {
                    for(var i=0; i<sharedpoints.length; i++)
                        if(sharedpoints[i].name == name)
                            return true
                }

                // Remove all unaccesible files
                for(var i=0, fileentry; fileentry=fileentries[i]; i++)
                    if(!sharedpoint_exist(fileentry.sharedpoint.name))
                        delete_fileentry(fileentry)
                    else if(fileentry.file)
                        worker.postMessage(['refresh',fileentry]);

                if(sharedpoints.length & policy)
                    policy(updateTimeout)
                else
                    updateTimeout()
            })
        })
    }

    // Start hashing new files from the shared points on load
    self.refresh()
}