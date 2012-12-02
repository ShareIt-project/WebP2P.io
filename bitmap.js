function Bitmap(length)
{
  return new BoolArray(length)
}


// Get the index of a random setted or unsetted bit on the bitmap.
// If none is available, return undefined
function Bitmap_getRandom(bitmap, setted)
{
  var array = Bitmap_indexes(bitmap, setted)

  if(array.length)
    return array[Math.floor(Math.random() * array.length)]
}

// Return an array with the index of the setted or unsetted bits
function Bitmap_indexes(bitmap, setted)
{
  var array = []

  for(var i=0; i<bitmap.length; i++)
    for(var j=0; j<=7; j++)
    {
      var cond = bitmap[i] & (1 << j)

      if((cond && setted) || (!cond && !setted))
          array.append(i*8 + j)
    }

  return array
}