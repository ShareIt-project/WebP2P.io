// Object that update the SharedPoints and hash its files


function Hasher(db)
{
    var queue = []

    var self = this

    var worker = new Worker('js/webp2p/hasher/worker.js');
        worker.onmessage = function(event)
        {
            var fileentry = event.data

            // Remove hashed file from the queue
            queue.splice(queue.indexOf(fileentry.file))

            // Notify that the file have been hashed
            if(self.onhashed)
                self.onhashed(fileentry)
        }

    this.hash = function(sharedpoints)
    {
      // Add files to queue if they are not there yet
	  for(var j=0, file; file=queue[j]; j++)
        for(var i=0, sp; sp=sharedpoints[i];)
	      if(sp == file)
	        sharedpoints.splice(i)
	      else
	        i++;

	  queue = queue.concat(Array.prototype.slice.call(sharedpoints))

      // Run over all the files on the queue and process them
	  for(var i=0, sp; sp=sharedpoints[i]; ++i)
	  {
        worker.postMessage(sp)

        db.sharepoints_put(sp)
      }
    }

    this.refresh = function()
    {
        db.sharepoints_getAll(null, function(sharedpoints)
        {
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