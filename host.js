Blob.slice = Blob.slice || Blob.webkitSlice || Blob.mozSlice
if(Blob.slice != undefined)
	alert("It won't work in your browser. Please use Chrome or Firefox.");

// Filereader support (be able to host files from the filesystem)
if(typeof FileReader == "undefined")
	oldBrowser();


var chunksize = 65536


function Bitmap(size)
{
  var bitmap = new Array(size)
  for(var i=0; i<size; i++)
    bitmap[i] = i;
  return bitmap
}

function getRandom(bitmap)
{
  return bitmap[Math.floor(Math.random() * bitmap.length)]
}

function remove(bitmap, item)
{
  bitmap.splice(bitmap.indexOf(item), 1)
}


function Host_init(db, protocol, onsuccess)
{
	var host = {}

    // EventTarget interface
    host._events = {};

    host.addEventListener = function(type, listener)
    {
      host._events[type] = host._events[type] || [];
      host._events[type].push(listener);
    };

    host.dispatchEvent = function(type)
    {
      var events = host._events[type];
      if(!events)
        return;

      var args = Array.prototype.slice.call(arguments, 1);

      for(var i = 0, len = events.length; i < len; i++)
        events[i].apply(null, args);
    };

    host.removeEventListener = function(type, listener)
    {
      var events = host._events[type];
      if(!events)
        return;

      events.splice(events.indexOf(listener), 1)

      if(!events.length)
        delete host._events[type]
    };

	if(onsuccess)
		onsuccess(host);

	// Host

    protocol.addEventListener('fileslist.query', function(socketId)
    {
        db.sharepoints_getAll(null, function(fileslist)
        {
            // Stupid conversion because JSON.stringify() doesn't parse File
            // objects (use them as plain objects in the best case). Maybe add
            // a File.toString() method would do the trick, but later would not
            // be able to store them on IndexedDB...
            //
            // I miss you Python :-(
			var files_send = []

			for(var i = 0, file; file = fileslist[i]; i++)
			    files_send.push({"name": file.name, "size": file.size,
			                     "type": file.type});

            protocol.emit('fileslist.send', socketId, files_send);
        })
    })

    protocol.addEventListener('fileslist.send', function(socketId, files)
    {
        // Check if we have already any of the files
        // It's stupid to try to download it... and also give errors
        db.sharepoints_getAll(null, function(filelist)
        {
            for(var i=0, file; file = files[i]; i++)
            {
                // We add here ad-hoc the socketId of the peer where we got the
                // file since we currently don't have support for hashes nor
                // tracker systems
                file.socketId = socketId

                for(var j=0, file_hosted; file_hosted = filelist[j]; j++)
                    if(file.name == file_hosted.name)
                    {
                        file.bitmap = file_hosted.bitmap
                        file.blob   = file_hosted.blob || file_hosted

                        break;
                    }
            }

            host.dispatchEvent("fileslist_peer.update", socketId, files)
        })
    })

	// Filereader support (be able to host files from the filesystem)
	if(typeof FileReader == "undefined")
		console.warn("'Filereader' is not available, can't be able to host files");

	else
		protocol.addEventListener('transfer.query', function(socketId, filename, chunk)
		{
			var reader = new FileReader();
				reader.onerror = function(evt)
				{
					console.error("host.transfer_query("+socketId+", "+filename+", "+chunk+") = '"+evt.target.result+"'")
				}
				reader.onload = function(evt)
				{
				    protocol.emit('transfer.send', socketId, filename, chunk, evt.target.result);
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
	    	save.target = "_blank"		// This can give problems...
			save.download = file.name	// This force to download with a filename instead of navigate
	
		var evt = document.createEvent('MouseEvents');
			evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
	
		save.dispatchEvent(evt);

		window.URL.revokeObjectURL(save.href)
	}

	protocol.addEventListener('transfer.send', function(socketId, filename, chunk, data)
	{
	    chunk = parseInt(chunk)

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
		    file.blob = new Blob([head, new Uint8Array(padding),
		                          byteArray.buffer, blob.slice(stop)],
		                         {"type": blob.type})

			var pending_chunks = file.bitmap.length
			if(pending_chunks)
			{
				var chunks = file.size/chunksize;
				if(chunks % 1 != 0)
					chunks = Math.floor(chunks) + 1;

                host.dispatchEvent("transfer.update", file,
                                   1 - pending_chunks/chunks)

			    // Demand more data from one of the pending chunks
		        db.sharepoints_put(file, function()
		        {
                    protocol.emit('transfer.query', socketId, file.name,
                                                    getRandom(file.bitmap));
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

                    host.dispatchEvent("transfer.end", file)
                    console.log("Transfer of "+file.name+" finished!");
		        })
			}
		})
	})

    // Get the socketId of one of the peers that have the file from its hash.
    // Since the hash and the tracker system are currently not implemented we'll
    // get just the socketId of the peer where we got the file that we added
    // ad-hoc before
    function getSocketId(file)
    {
        return file.socketId
    }

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
            host.dispatchEvent("transfer.begin", file)
            console.log("Transfer begin: '"+file.name+"' = "+JSON.stringify(file))

            // Demand data from the begining of the file
            protocol.emit('transfer.query', getSocketId(file), file.name,
                                            getRandom(file.bitmap))
        },
        function(errorCode)
        {
            console.error("Transfer begin: '"+file.name+"' is already in database.")
        })
    }
}