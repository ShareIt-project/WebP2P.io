// Worker to hash a file


// Hack for sha512
var window = {}

importScripts('https://raw.github.com/Caligatio/jsSHA/master/src/sha512.js');


function hashData(data, onsuccess)
{
	var shaObj = new window.jsSHA(data, "TEXT");
	var hash = shaObj.getHash("SHA-512", "B64");

    onsuccess(hash)
}


function hashFileentry(fileentry)
{
  var reader = new FileReader();
      reader.onload = function()
      {
        // this.result is the readed file as an ArrayBuffer.
        hashData(this.result, function(hash)
        {
            fileentry.hash = hash
            self.postMessage(fileentry);
        })
      }

//  reader.readAsArrayBuffer(file);
  reader.readAsBinaryString(fileentry.file);
}


self.onmessage = function(e)
{
  var sharedpoint = e.data

  var fileentry = {'sharedpoint': sharedpoint.name, 'path': '',
                   'file': sharedpoint}

  hashFileentry(fileentry)
}