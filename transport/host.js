var chunksize = 65536


function Host(transport, db)
{
	EventTarget.call(this)

    // filelist

    transport.addEventListener('fileslist.query', function(event)
    {
        var socketId = event.data[0]

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

            transport.emit('fileslist.send', socketId, files_send);
        })
    })

	// Filereader support (be able to host files from the filesystem)
	if(typeof FileReader == "undefined")
		console.warn("'Filereader' is not available, can't be able to host files");

	else
		transport.addEventListener('transfer.query', function(event)
		{
		    var socketId = event.data[0]
		    var filename = event.data[1]
		    var chunk = event.data[2]

			var reader = new FileReader();
				reader.onerror = function(evt)
				{
					console.error("host.transfer_query("+socketId+", "+filename+", "+chunk+") = '"+evt.target.result+"'")
				}
				reader.onload = function(evt)
				{
				    transport.emit('transfer.send', socketId, filename, chunk, evt.target.result);
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
}