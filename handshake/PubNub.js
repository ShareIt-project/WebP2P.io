var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
_priv.Handshake_PubNub = function(configuration)
{
  _priv.Transport_Routing_init(this, peersManager);

  // Count the maximum number of pending connections allowed to be
  // done with this handshake server (undefined == unlimited)
  this.connections = 0;
  this.max_connections = max_connections;

  var self = this;

  this.addEventListener('presence', function(event)
  {
    var uid = event.data[0];
  
    // Don't try to connect to ourselves
    if(uid != peersManager.uid)
    {
      // Check if we should ignore this new peer to increase
      // entropy in the network mesh
      // Do the connection with the new peer
      peersManager.connectTo(uid, self, function(error, channel)
      {
        if(error)
          console.error(uid, peer, channel);

        else
          // Increase the number of connections reached throught
          // this handshake server
          transport.connections++;

          // Close connection with handshake server if we got its
          // quota of peers
          if(transport.connections == transport.max_connections)
             transport.close();
      });
    }
  });

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
      // Notify our presence
      self.emit('presence', peersManager.uid);

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
         self.onerror(error)
    }
  });

  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: configuration.channel
    });
  }
}

return module
})(webp2p || {})