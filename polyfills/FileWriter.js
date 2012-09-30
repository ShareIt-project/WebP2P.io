// FileWriter polyfill based on code from idb.filesystem.js by Eric Bidelman
//
// Copyright 2012 Jesus Leganes Combarro "Piranna"

(function(module){

if(FileWriter != undefined)
    return;

Blob.slice = Blob.slice || Blob.webkitSlice || Blob.mozSlice
if(Blob.slice != undefined)
    alert("It won't work in your browser. Please use Chrome or Firefox.");

/**
 * Interface to writing a Blob/File.
 *
 * Modeled from:
 * dev.w3.org/2009/dap/file-system/file-writer.html#the-filewriter-interface
 *
 * @param {FileEntry} fileEntry The FileEntry associated with this writer.
 * @constructor
 */
function FileWriter(blob)
{
  var position_ = 0;
  var blob_ = blob;

  this.__defineGetter__('position', function()
  {
    return position_;
  });

  this.__defineGetter__('length', function()
  {
    return blob.size;
  });

  this.write = function(data)
  {
    if(!blob)
      throw Error('Expected blob argument to write.');

    // Call onwritestart if it was defined.
    if(this.onwritestart)
      this.onwritestart();

    // Calc the fragments
    var head = blob_.slice(0, position_)
    var padding = position_-head.size
    if(padding < 0)
        padding = 0;
    var stop = position_+data.size

    // Do the "write" --in fact, a full overwrite of the Blob
    blob_ = new Blob([head, ArrayBuffer(padding), data, blob_.slice(stop)],
                     {"type": blob_.type})

    // Set writer.position == write.length.
    position_ += data.size;

    if(self.onwriteend)
      self.onwriteend();

    // This is not standard, but it's the only way to get out the created blob
    return blob_
  };
}

FileWriter.prototype =
{
  seek: function(offset)
  {
    this.position_ = offset

    if(this.position_ > this.length)
      this.position_ = this.length
    else if(this.position_ < 0)
      this.position_ += this.length

    if(this.position_ < 0)
      this.position_ = 0
  },
  truncate: function(size)
  {
    if(size < this.length)
      this.blob_ = this.blob_.slice(size)
    else
      this.blob_ = new Blob([this.blob_, ArrayBuffer(size - this.length)])
  }
}

})(this)