/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object.
 */
function Handshake_SimpleSignaling(configuration)
{
  HandshakeConnector.call(this);

  var self = this;

  // Connect a handshake channel to the SimpleSignaling server
  var connection = new SimpleSignaling(configuration);

  // Configure handshake channel
  connection.onmessage = function(message)
  {
    var event = JSON.parse(message.data);

    self.dispatchMessageEvent(event, configuration.uid)
  };
  connection.onopen  = self.connect;
  connection.onerror = self.error;


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.close()
  }

  /**
   *  Notify our presence
   */
  this.presence = function()
  {
    self.send({type: 'presence', from: configuration.uid});
  }

  /**
   * Send a message to a peer
   */
  this.sendData = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    connection.send(JSON.stringify(data));
  }
}
Handshake_SimpleSignaling.prototype = new HandshakeConnector();
Handshake_SimpleSignaling.prototype.constructor = Handshake_SimpleSignaling;

HandshakeManager.registerConstructor('SimpleSignaling', Handshake_SimpleSignaling);