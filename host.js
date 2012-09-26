// Filereader support (be able to host files from the filesystem)
if(typeof FileReader == "undefined")
	oldBrowser();


var chunksize = 65536


function Host(db)
{
    EventTarget.call(this)
}