function Bitmap(size)
{
  var i = Math.ceil(size/8)
  var j = size%8

  var bitmap = new Uint8Array(i)

  bitmap[i] = Math.pow(2, j) - 1

  for(var i=0; i<bitmap.length-1; i++)
    bitmap[i] = Math.pow(2, 8) - 1

  return bitmap
}


function Bitmap_getRandom(bitmap)
{
  var setted = Bitmap_setted(bitmap)

  return setted[Math.floor(Math.random() * setted.length)]
}

function Bitmap_set(bitmap, index)
{
  var i = Math.ceil(index/8)
  var j = index%8

  bitmap[i] |= 1 << j
}

// Run over all the bits on the bitmap and return and array with the setted ones
function Bitmap_setted(bitmap)
{
  var setted = []

  for(var i=0; i<bitmap.length; i++)
    for(var j=0; j<=7; j++)
      if(bitmap[i] & (1 << j))
        setted.append(i*8 + j)

  return setted
}

function Bitmap_unset(bitmap, index)
{
  var i = Math.ceil(index/8)
  var j = index%8

  bitmap[i] &= ~(1 << j)
}