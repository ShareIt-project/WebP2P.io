// Object that update the SharedPoints and hash its files


function Hasher(db, policy)
{
    var queue = []

    var self = this

    var worker = new Worker('../../js/webp2p/hasher/worker.js');
        worker.onmessage = function(event)
        {
            var fileentry = event.data

            // Remove hashed file from the queue
            queue.splice(queue.indexOf(fileentry.file))

            // Notify that the file have been hashed
            if(self.onhashed)
                self.onhashed(fileentry)
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
        files = Array.prototype.slice.call(files)
        files.sort(function(a, b)
        {
            var str1 = a.webkitRelativePath
            var str2 = b.webkitRelativePath

            return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
        })

        queue = queue.concat(files)

        var sharedpoint_name = files[0].webkitRelativePath.split('/')[0]

        // Run over all the files on the queue and process them
        for(var i=0, file; file=files[i]; ++i)
        {
            var fileentry = {'sharedpoint': sharedpoint_name,
                             'path': file.webkitRelativePath.split('/').slice(1,-1).join('/'),
                             'file': file}

            worker.postMessage(fileentry);

            console.log(file.webkitRelativePath+': "'+file.name+'": '+file.type)
        }

        db.sharepoints_put({name: sharedpoint_name, type: 'folder', size: 0})
      }
    }

    this.refresh = function()
    {
        db.sharepoints_getAll(null, function(sharedpoints)
        {
            if(sharedpoints.length & policy)
                policy(function()
                {
                    self.hash(sharedpoints)
                })
            else
                self.hash(sharedpoints)
        })
    }

    // Start hashing new files from the shared points on load
    self.refresh()

    // Refresh hashes every hour
    setInterval(function()
    {
        self.refresh()
    }, 60*60*1000)
}