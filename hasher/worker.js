// Worker to hash a file


// Hack for sha512
var window = {}

importScripts('https://raw.github.com/Caligatio/jsSHA/master/src/sha512.js');


function hashFile(file, onsuccess)
{
	var shaObj = new window.jsSHA(file, "TEXT");
	var hash = shaObj.getHash("SHA-512", "B64");

    onsuccess(hash)
}


self.onmessage = function(e)
{
  var file = e.data

  var reader = new FileReader();
      reader.onload = function(e)
      {
        // this.result is the readed file as an ArrayBuffer.
        hashFile(this.result, function(hash)
        {
            self.postMessage({'hash': hash, 'file': file});
        })
      }

//  reader.readAsArrayBuffer(file);
  reader.readAsBinaryString(file);
}