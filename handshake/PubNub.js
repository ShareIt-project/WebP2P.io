var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
_priv.Handshake_PubNub = function(configuration)
{
  _priv.Transport_Routing_init(this, peersManager);

  var self = this;

  // Connect a handshake channel to the PubNub server
  var pubnub = PUBNUB(configuration);

  /**
   * Handle the presence of other new peers
   */
  this.addEventListener('presence', function(event)
  {
    var uid = event.data[0];
  
    // Don't try to connect to ourselves
    if(uid != configuration.uid)
    {
      var event = document.createEvent("Event");
          event.initEvent('presence',true,true);
          event.uid = uid

      self.dispatchEvent(event);
    }
  });

  pubnub.subscribe(
  {
    channel: configuration.channel,


    /**
     * Receive messages
     */
    callback: function(message)
    {
      if(self.onmessage)
         self.onmessage(
         {
           data: message
         });
    },

    /**
     * Handle the connection to the handshake server
     */
    connect: function()
    {
      // Notify our presence
      self.emit('presence', peersManager.uid);


      /**
       * Send a message to a peer
       */
      self.send = function(message, uid)
      {
        pubnub.publish(
        {
          channel: configuration.channel,
          message: message
        });
      };

      // Notify that the connection to this handshake server is open
      if(self.onopen)
         self.onopen();
    },


    /**
     * Handle errors on the connection
     */
    error: function(error)
    {
      if(self.onerror)
         self.onerror(error)
    }
  });

  /**
   * Close the connection with this handshake server
   */
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