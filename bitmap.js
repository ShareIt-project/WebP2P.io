function Bitmap(size)
{
  var bitmap = new Array(size)
  for(var i=0; i<size; i++)
    bitmap[i] = i;
  return bitmap
}

function getRandom(bitmap)
{
  return bitmap[Math.floor(Math.random() * bitmap.length)]
}

function remove(bitmap, item)
{
  bitmap.splice(bitmap.indexOf(item), 1)
}