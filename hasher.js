// Hack for sha512
var window = {}

//importScripts('https://raw.github.com/Caligatio/jsSHA/master/src/sha512.js');
importScripts('lib/sha512.js');


var queue = []


function hashFile(file, onsuccess)
{
	var shaObj = new window.jsSHA("This is a Test", "TEXT");
	var hash = shaObj.getHash("SHA-512", "B64");

    onsuccess(hash)
}


self.onmessage = function(e)
{
  var files = e.data

  for(var i=0; i<files.length; ++i)
  {
    var file=files[i]

    var reader = new FileReader();
	    reader.onload = function(e)
	    {
	      hashFile(this.result, function(hash) // this.result is the read file as an ArrayBuffer.
	      {
              self.postMessage({'hash': hash, 'blob': file});
	      })
	    }

	    reader.readAsArrayBuffer(file);
  }
}