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

  // Connect a signaling channel to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);

  // Receive messages
  connection.registerHandler('message', function(message)
  {
    console.log(message.getBody())

    if(self.onmessage)
       self.onmessage(
       {
         data: message.getBody()
       })
  })

  connection.connect(configuration);   // Ugly hack to have only one config object
  connection.registerHandler('onconnect', function()
  {
    // Notify our presence
    var presence = new JSJaCPresence();
        presence.setTo("webp2p@muc.jappix.com"+"/"+configuration.uid);

    connection.send(presence, function(data){console.log(data.getDoc());});

    // Handle presence of other new peers
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

    // Compose and send message
    self.send = function(message, uid)
    {
      var oMsg = new JSJaCMessage();
          oMsg.setTo("webp2p@muc.jappix.com"+"/"+uid);
          oMsg.setBody(message);

      connection.send(oMsg);
    }

    // Set handshake as open
    if(self.onopen)
       self.onopen()

//    self.send("hola", "piranna")
  });

  connection.registerHandler('onerror', function(error)
  {
    if(self.onerror)
       self.onerror(error)
  });

  this.close = function()
  {
    connection.disconnect()
  }


  this.sendOffer = function(uid, sdp)
  {
    console.log(uid)
    console.log(sdp)

    this.send(['offer', sdp], uid)
  }
}

return module
})(webp2p || {})