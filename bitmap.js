function Bitmap(length)
{
  return new BoolArray(length)
}


function Bitmap_getSetted_Random(bitmap)
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

//Run over all the bits on the bitmap and return and array with the setted ones
function Bitmap_setted(bitmap)
{
  var setted = []

  for(var i=0; i<bitmap.length; i++)
    for(var j=0; j<=7; j++)
      if(bitmap[i] & (1 << j))
        setted.append(i*8 + j)

  return setted
}

//Run over all the bits on the bitmap and return and array with the setted ones
function Bitmap_unsetted(bitmap)
{
  var setted = []

  for(var i=0; i<bitmap.length; i++)
    for(var j=0; j<=7; j++)
      if(!(bitmap[i] & (1 << j)))
        setted.append(i*8 + j)

  return setted
}

function Bitmap_unset(bitmap, index)
{
  var i = Math.ceil(index/8)
  var j = index%8

  bitmap[i] &= ~(1 << j)
}