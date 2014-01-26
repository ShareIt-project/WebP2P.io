/**
 * Add support to get a list of channels on a PeerConnection object
 */
function applyChannelsShim(pc)
{
  if(pc.getDataChannels != undefined) return;

  var channels = [];

  pc.getDataChannels = function()
  {
    return channels;
  };

  function initChannel(channel)
  {
    channels.push(channel);

    channel.addEventListener('close', function(event)
    {
      channels.splice(channels.indexOf(channel), 1);
    });
  };

  // Add DataChannels created by remote PeerConnection object
  var dispatchEvent = pc.dispatchEvent;
  pc.dispatchEvent = function(event)
  {
    if(event.type == 'datachannel')
    {
      var channel = event.channel;

      initChannel(channel);
    };

    // Dispatch events
    dispatchEvent.call(this, event);
  };

  // Add DataChannels created by local PeerConnection object
  var createDataChannel = pc.createDataChannel;
  pc.createDataChannel = function(label, dataChannelDict)
  {
    var channel = createDataChannel.call(this, label, dataChannelDict);

    initChannel(channel);

    return channel;
  };
};


module.exports = applyChannelsShim;
