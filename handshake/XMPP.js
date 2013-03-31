var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
_priv.Handshake_XMPP = function(configuration)
{
  EventTarget.call(this);

  var self = this

//  configuration.oDbg = new JSJaCConsoleLogger(1)

  // Connect a handshake channel to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);
      connection.connect(configuration);  // Ugly hack to have only one config object

  /**
   * Receive messages
   */
  connection.registerHandler('message', function(message)
  {
    console.log(message.getBody())

    if(self.onmessage)
       self.onmessage(
       {
         data: message.getBody()
       })
  })

  /**
   * Handle the connection to the handshake server
   */
  connection.registerHandler('onconnect', function()
  {
    // Notify our presence
    var presence = new JSJaCPresence();
        presence.setTo(configuration.room+"/"+configuration.uid);

    connection.send(presence, function(data){console.log(data.getDoc());});

    /**
     * Handle the presence of other new peers
     */
    connection.registerHandler('presence', function(presence)
    {
      console.log(presence.getFrom())
      console.log(presence.getType())

      var uid = presence.getFrom().split('/')[1]

      // Only notify new connections
//      if(presence.getType() != "unavailable")
      if(uid != configuration.uid
      && !presence.getType()
      && !presence.getShow())
      {
        var event = document.createEvent("Event");
            event.initEvent('presence',true,true);
            event.uid = uid

        self.dispatchEvent(event);
      }
    });

    /**
     * Send a message to a peer
     */
    self.send = function(message, uid)
    {
      var oMsg = new JSJaCMessage();
          oMsg.setTo(configuration.room+"/"+uid);
          oMsg.setBody(message);

      connection.send(oMsg);
    }

    // Notify that the connection to this handshake server is open
    if(self.onopen)
       self.onopen()
  });

  /**
   * Handle errors on the connection
   */
  connection.registerHandler('onerror', function(error)
  {
    if(self.onerror)
       self.onerror(error)
  });

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.disconnect()
  }


  /**
   * Send an offer to another peer
   */
  this.sendOffer = function(uid, sdp)
  {
    console.log(uid)
    console.log(sdp)

    this.send(['offer', sdp], uid)
  }
}

return module
})(webp2p || {})