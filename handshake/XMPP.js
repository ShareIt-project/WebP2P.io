var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
_priv.Handshake_XMPP = function(configuration)
{
  var self = this

  configuration.oDbg = new JSJaCConsoleLogger(3)

  // Connect a signaling channel to the XMPP server
  var signaling = new JSJaCHttpBindingConnection(configuration);

  // Receive messages
  signaling.registerHandler('message', function(oJSJaCPacket)
  {
    if(self.onmessage)
       self.onmessage(
       {
         data: oJSJaCPacket.getBody()
       })
  })

  signaling.connect(configuration);   // Ugly hack to have only one config object
  signaling.registerHandler('onconnect', function()
  {
    // Compose and send message
    self.send = function(message)
    {
      var oMsg = new JSJaCMessage();
          oMsg.setBody(message);

      signaling.send(oMsg);
    }

    // Set handshake as open
    if(self.onopen)
       self.onopen()
  });

  signaling.registerHandler('onerror', function(error)
  {
    if(self.onerror)
       self.onerror(error)
  });

  this.close = function()
  {
    signaling.disconnect()
  }
}

return module
})(webp2p || {})