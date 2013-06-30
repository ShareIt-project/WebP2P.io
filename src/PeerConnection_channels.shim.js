function applyChannelsShim(pc)
{
  if(pc.channels != undefined) return

  var channels = {}

  pc.__defineGetter__('channels', function()
  {
    return channels
  })
}