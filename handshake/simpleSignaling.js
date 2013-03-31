var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object.
 */
_priv.Handshake_SimpleSignaling = function(configuration)
{
  _priv.Transport_Routing_init(this, peersManager);

  var self = this;

  // Connect a handshake channel to the SimpleSignaling server
  var handshake = new SimpleSignaling(configuration);


  /**
   * Receive messages
   */
  handshake.onmessage = function(uid, data)
  {
    if(self.onmessage)
       self.onmessage(uid, data);
  };


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


  handshake.onopen = function(uid)
  {
    // Notify our presence
    self.emit('presence', peersManager.uid);


    /**
     * Send a message to a peer
     */
    self.send = function(message, uid)
    {
      handshake.send(uid, message);
    };

    // Notify that the connection to this handshake server is open
    if(self.onopen)
       self.onopen(uid);
  };


  /**
   * Handle errors on the connection
   */
  handshake.onerror = function(error)
  {
    if(self.onerror)
       self.onerror(error);
  };
}

return module
})(webp2p || {})