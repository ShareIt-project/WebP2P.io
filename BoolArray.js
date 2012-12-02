// Custom ArrayBufferView for packet booleans
//
// It can allow to access to an array of booleans structure but using far less
// memory usage

function BoolArray(length)
{
  ArrayBufferView.call(this, Math.ceil(length/8))


  this.get = function(index)
  {
    if(index >= length)
      throw INDEX_SIZE_ERR

    var i = Math.ceil(index/8)
    var j = index%8

    return (this[i] << (7-j)) >> 7
  }

  this.set = function(index, value)
  {
    if(index >= length)
      throw INDEX_SIZE_ERR

    var i = Math.ceil(index/8)
    var j = index%8

    if(value)
      this[i] |= 1 << j
    else
      this[i] &= ~(1 << j)
  }


  this.__defineGetter__("length", function()
  {
    return length
  })
}

BoolArray.prototype = new ArrayBufferView()

BoolArray.prototype.BYTES_PER_ELEMENT = 0.125