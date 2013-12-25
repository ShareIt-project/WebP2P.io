/**
 * Handshake connector for XMPP
 * @param {Object} configuration Configuration object
 */
function Handshake_XMPP(configuration)
{
  HandshakeConnector.call(this);

  var self = this;


  //configuration.oDbg = new JSJaCConsoleLogger(1)

  // Connect a handshake connector to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);
      connection.connect(configuration);  // Ugly hack to have only one config object


  // Configure handshake connector
  connection.registerHandler('onconnect', function()
  {
    // Notify our presence
    var message = new JSJaCPresence();
        message.setTo(configuration.room+"/"+configuration.uid);

    connection.send(message);

    // Notify that the connection to this handshake server is open
    self.onopen(new Event('open'));


    //
    // Listen for presence of new peers
    //

    // Ugly hack so we can ignore presence messages from previous peers
    setTimeout(function()
    {
      /**
       * Handle the presence of other new peers
       */
      connection.registerHandler('presence', function(message)
      {
        // Only notify new connections
        if(!message.getType()
        && !message.getShow())
        {
          var from = message.getFromJID().getResource();

          var event = new Event('presence');
              event.from = from;

          self.onpresence(event);
        }
      });
    }, 1000)
  });


  //
  // Process incoming messages
  //

  connection.registerHandler('message', function(message)
  {
    message = message.getBody();
    if(message == "")
      return

    // Check type of message
    var method = message.method;
    switch(method)
    {
      case 'connect':
        self._connectRequest(message);
      break;

      case undefined:  // Probably a response, dispatch handler
        self._connectResponse(message);
      break;

      default:
        console.error("Unknown message method '"+method+"'");
        console.error(message);
    }
  });

  connection.registerHandler('onerror', self.onerror);


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.disconnect();
  };


  this._send = function(message, dest)
  {
    var oMsg = new JSJaCMessage();
        oMsg.setTo(configuration.room+"/"+dest);
        oMsg.setBody(message);

    connection.send(oMsg);
  };
}
Handshake_XMPP.prototype.__proto__   = HandshakeConnector.prototype;
Handshake_XMPP.prototype.constructor = Handshake_XMPP;

HandshakeManager.registerConstructor('XMPP', Handshake_XMPP);