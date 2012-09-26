// Filereader support (be able to host files from the filesystem)
if(typeof FileReader == "undefined")
	oldBrowser();


var chunksize = 65536


function Host(db)
{
    EventTarget.call(this)

    var self = this

	this._transferbegin = function(file)
	{
	    // Get the channel of one of the peers that have the file from its hash.
	    // Since the hash and the tracker system are currently not implemented we'll
	    // get just the channel of the peer where we got the file that we added
	    // ad-hoc before
	    function getChannel(file)
	    {
	        return file.channel
	    }

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
	        self.dispatchEvent({type:"transfer.begin", data:file})
	        console.log("Transfer begin: '"+file.name+"' = "+JSON.stringify(file))

	        // Demand data from the begining of the file
	        getChannel(file).emit('transfer.query', file.name,
	                                                getRandom(file.bitmap))
	    },
	    function(errorCode)
	    {
	        console.error("Transfer begin: '"+file.name+"' is already in database.")
	    })
	}
}