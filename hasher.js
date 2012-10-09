// Hack for sha512
var window = {}

//importScripts('https://raw.github.com/Caligatio/jsSHA/master/src/sha512.js');
importScripts('lib/sha512.js');


var queue = []


function hashFile(file)
{
    var hash = ""
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
	      hashFile(this.result); // this.result is the read file as an ArrayBuffer.
          self.postMessage(file);
	    }

	    reader.readAsArrayBuffer(file);
  }
}