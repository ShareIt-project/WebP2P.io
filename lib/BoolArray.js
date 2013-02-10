// Custom ArrayBufferView for packet booleans
//
// It can allow to access to an array of booleans structure but using far less
// memory usage

function BoolArray(length)
{
  this.prototype = new Uint8Array(Math.ceil(length/8));


  this.get = function(index)
  {
    if(index >= length)
      throw INDEX_SIZE_ERR;

    var i = Math.floor(index/8);
    var j = index%8;

    return Boolean(this.prototype[i] & (1 << j));
  };

  this.set = function(index, value)
  {
    if(index >= length)
      throw INDEX_SIZE_ERR;

    var i = Math.floor(index/8);
    var j = index%8;

    if(value)
      this.prototype[i] |= 1 << j;
    else
      this.prototype[i] &= ~(1 << j);
  };


  this.__defineGetter__("length", function()
  {
    return length;
  });

  this.BYTES_PER_ELEMENT = 0.125;
}


// Export the BoolArray class
if(typeof exports == 'undefined')
  window.BoolArray = BoolArray;
else
  exports.BoolArray = BoolArray;