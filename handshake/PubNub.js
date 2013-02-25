var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
_priv.Handshake_PubNub = function(configuration)
{
  var self = this;

  // Connect a handshake channel to the PubNub server
  var pubnub = PUBNUB(configuration);
  pubnub.subscribe(
  {
    channel: configuration.channel,

    // Receive messages
    callback: function(message)
    {
      if(self.onmessage)
         self.onmessage(
         {
           data: message
         });
    },

    connect: function()
    {
      // Compose and send message
      self.send = function(message)
      {
        pubnub.publish(
        {
          channel: configuration.channel,
          message: message
        });
      };

      // Set handshake as open
      if(self.onopen)
         self.onopen();
    },

    error: function(error)
    {
      if(self.onerror)
         self.onerror(error);
    }
  });
}

return module
})(webp2p || {})