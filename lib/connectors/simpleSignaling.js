var inherits = require("inherits");

var HandshakeConnector = require("./core/HandshakeConnector");

require("../../vendor/simpleSignaling");


/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object.
 */
function Connector_SimpleSignaling(config_init, config_mess, max_connections)
{
  HandshakeConnector.call(this, max_connections);


  // Connect a handshake channel to the SimpleSignaling server
  var connection = new SimpleSignaling(configuration);

  // Configure handshake channel
  connection.onmessage = this._message.bind(this);
  connection.onopen    = this._open.bind(this);
  connection.onerror   = this._error.bind(this);


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = connection.close.bind(connection);

  /**
   * Send a message to a peer
   */
  this.send = connection.send.bind(connection);
}
inherits(Connector_SimpleSignaling, HandshakeConnector);


module.exports = Connector_PubNub;
