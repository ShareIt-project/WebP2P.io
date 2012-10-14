// Object that update the SharedPoints and hash its files


function Hasher(db)
{
    var queue = []

    var worker = new Worker('js/webp2p/hasher_worker.js');
        worker.onmessage = function(event)
        {
            var fileentry = event.data

            // Remove hashed file from the queue
            queue.splice(queue.indexOf(fileentry.file))

            // Notify that the file have been hashed
            if(this.onsuccess)
                this.onsuccess(fileentry)
        }

    this.hash = function(sharedpoints)
    {
	  // Add files to queue if they are not there yet
	  for(var i=0, sp; sp=sharedpoints[i];)
	    for(var j=0, file; q_file=queue[j]; j++)
	      if(sp == file)
	        sharedpoints.splice(i)
	      else
	        i++;

	  queue.concat(sharedpoints)

      // Run over all the files on the queue and process them
	  for(var i=0, sp; sp=sharedpoints[i]; ++i)
	  {
        worker.postMessage(sp)

        db.sharepoints_put(sp)
      }
    }

    this.refresh = function()
    {
        var self = this

        db.sharepoints_getAll(null, function(sharedpoints)
        {
            self.hash(sharedpoints)
        })
    }

    // Start hashing new files from the shared points on load
    this.refresh()

    // Refresh hashes every hour
    setInterval(function()
    {
        this.refresh()
    }, 60*60*1000)
}