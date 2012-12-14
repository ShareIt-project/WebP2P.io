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
          self.postMessage(['hashed',fileentry]);
        })
      }

  reader.readAsBinaryString(fileentry.file);
}

function checkRemoved(fileentry)
{
  var reader = new FileReader();
      reader.onerror = function()
      {
          self.postMessage(['delete',fileentry]);
      }

  reader.readAsBinaryString(fileentry.file.slice(0,1));
}


self.onmessage = function(e)
{
  var fileentry = e.data[1]

  switch(e.data[0])
  {
      case 'hash':
          hashFileentry(fileentry)
          break

      case 'refresh':
          checkRemoved(fileentry)
  }
}