function Bitmap(length)
{
  this.prototype = new BoolArray(length)

  // Return an array with the index of the setted or unsetted bits
  this.indexes = function(setted)
  {
    var array = []

    for(var i=0; i<this.prototype.length; i++)
      if(this.prototype.get(i) == setted)
        array.push(i)

    return array
  }

  // Get the index of a random setted or unsetted bit on the bitmap.
  // If none is available, return undefined
  this.getRandom = function(setted)
  {
    var array = this.indexes(setted)

    if(array.length)
      return array[Math.floor(Math.random() * array.length)]
  }

  this.set = function(index, value)
  {
      this.prototype.set(index, value)
  }
}