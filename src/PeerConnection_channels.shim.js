function applyChannelsShim(pc)
{
  if(pc.channels != undefined) return

  var channels = {}

  pc.__defineGetter__('channels', function()
  {
    return channels
  })

  var dispatchEvent = pc.dispatchEvent;
  pc.dispatchEvent = function(event)
  {
    if(event.type == 'datachannel')
    {
      var channel = event.channel

      // Application DataChannel, set callback to close PeerConnection
      channels[channel.label] = channel

      channel.addEventListener('close', function(event)
      {
        delete channels[channel.label]
      });
    }

    // Dispatch application datachannel events and regular ones
    dispatchEvent.call(this, event)
  };
}