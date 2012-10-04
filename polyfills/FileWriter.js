// FileWriter polyfill based on code from idb.filesystem.js by Eric Bidelman
//
// Copyright 2012 Jesus Leganes Combarro "Piranna"

(function(module){

if(window.FileWriter != undefined)
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
FileWriter = function(blob)
{
  if(!blob)
    throw Error('Expected blob argument to write.');

  this.position_ = 0;
  this.blob_ = blob;
}

FileWriter.prototype =
{
  get position()
  {
    return this.position_;
  },

  get length()
  {
    return this.blob_.size;
  },

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
      this.blob_ = this.blob_.slice(0, size)
    else
      this.blob_ = new Blob([this.blob_, new Uint8Array(size - this.length)],
                             {"type": this.blob_.type})
  },

  write: function(data)
  {
    // Call onwritestart if it was defined.
    if(this.onwritestart)
      this.onwritestart();

    // Calc the head and tail fragments
    var head = this.blob_.slice(0, this.position_)
    var tail = this.blob_.slice(this.position_+data.length)

    // Calc the padding
    var padding = this.position_-head.size
    if(padding < 0)
        padding = 0;

    // Do the "write" --in fact, a full overwrite of the Blob
    this.blob_ = new Blob([head, new Uint8Array(padding), data, tail],
                           {"type": this.blob_.type})

    // Set writer.position == write.length.
    this.position_ += data.size;

    if(self.onwriteend)
      self.onwriteend();

    // This is not standard, but it's the only way to get out the created blob
    return this.blob_
  }
}

})(this)
