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

  // Add files to queue if they are not there yet
  for(var i=0, file; file=files[i];)
    for(var j=0, q_file; q_file=queue[j]; j++)
      if(file == q_file)
        files.splice(i)
      else
        i++;
  queue.concat(files)

  for(var i=0; i<files.length; ++i)
  {
    var file=files[i]

    var reader = new FileReader();
	    reader.onload = function(e)
	    {
	      hashFile(this.result, function(hash) // this.result is the read file as an ArrayBuffer.
	      {
              self.postMessage({'hash': hash, 'file': file});
	      })
	    }

	    reader.readAsArrayBuffer(file);
  }
}