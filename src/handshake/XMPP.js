/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
function Handshake_XMPP(configuration)
{
  var self = this

//configuration.oDbg = new JSJaCConsoleLogger(1)

  // Connect a handshake channel to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);
      connection.connect(configuration);  // Ugly hack to have only one config object

  // Configure handshake channel
  connection.registerHandler('message', function(message)
  {
    var body = message.getBody()
    if(body == "")
      return

    var event = JSON.parse(body)
        event.from = message.getFromJID().getResource()

    self.dispatchMessageEvent(event, configuration.uid)
  })
  connection.registerHandler('onconnect', self.connect);
  connection.registerHandler('onerror',   self.error);


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.disconnect()
  }

  /**
   *  Notify our presence
   */
  this.presence = function()
  {
    var presence = new JSJaCPresence();
    presence.setTo(configuration.room+"/"+configuration.uid);

    connection.send(presence);


    // Ugly hack so we can ignore presence messages from previous peers
    setTimeout(function()
    {
      /**
       * Handle the presence of other new peers
       */
      connection.registerHandler('presence', function(presence)
      {
        // Only notify new connections
        if(!presence.getType()
        && !presence.getShow())
        {
          var from = presence.getFromJID().getResource()

          self.dispatchPresence(from);
        }
      });
    }, 1000)
  }

  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    var oMsg = new JSJaCMessage();
        oMsg.setTo(configuration.room+"/"+uid);
        oMsg.setBody(JSON.stringify(data));

    connection.send(oMsg);
  }
}
Handshake_XMPP.prototype = HandshakeConnector;

HandshakeManager.registerConstructor('XMPP', Handshake_XMPP);