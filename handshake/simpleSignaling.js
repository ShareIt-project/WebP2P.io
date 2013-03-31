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

  this.addEventListener('presence', function(event)
  {
    var uid = event.data[0];
  
    // Don't try to connect to ourselves
    if(uid != peersManager.uid)
    {
      var event = document.createEvent("Event");
          event.initEvent('presence',true,true);
          event.uid = uid

      self.dispatchEvent(event);
    }
  });

  // Connect a handshake channel to the XMPP server
  var handshake = new SimpleSignaling(configuration);

  handshake.onopen = function(uid)
  {
    // Notify our presence
    self.emit('presence', peersManager.uid);

    // Compose and send message
    self.send = function(uid, data)
    {
      handshake.send(uid, data);
    };

    handshake.onmessage = function(uid, data)
    {
      if(self.onmessage)
         self.onmessage(uid, data);
    };

    // Set handshake channel as open
    if(self.onopen)
       self.onopen(uid);
  };
  handshake.onerror = function(error)
  {
    if(self.onerror)
       self.onerror(error);
  };
}

return module
})(webp2p || {})