// Object that update the SharedPoints and hash its files


function Hasher(db, policy)
{
    var queue = []
    var timeout

    var self = this

    // Refresh hashes after one hour
    function updateTimeout()
    {
        clearTimeout(timeout)
        timeout = setTimeout(function()
        {
            self.refresh()
//        }, 30*1000)
        }, 60*60*1000)
    }

    function delete_fileentry(fileentry)
    {
        // Remove file from the database
        db.files_delete(fileentry.hash, function()
        {
            // Notify that the file have been deleted
            if(self.ondeleted)
                self.ondeleted(fileentry)
        })
    }

    var worker = new Worker('../../js/webp2p/hasher/worker.js');
        worker.onmessage = function(event)
        {
            var fileentry = event.data[1]

            switch(event.data[0])
            {
                case 'hashed':
                {
                    // Remove hashed file from the queue
                    queue.splice(queue.indexOf(fileentry.file))

                    // Add file to the database
                    db.files_put(fileentry, function()
                    {
                        // Notify that the file have been hashed
                        if(self.onhashed)
                            self.onhashed(fileentry)
                    })
                }
                break

                case 'delete':
                    delete_fileentry(fileentry)
            }

            // Update refresh timeout after each worker message
            updateTimeout()
        }

    this.hash = function(files)
    {
      // Add files to queue if they are not there yet
	  for(var j=0, file; file=queue[j]; j++)
        for(var i=0, sp; sp=files[i];)
	      if(sp == file || !sp.size)
	          files.splice(i)
	      else
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