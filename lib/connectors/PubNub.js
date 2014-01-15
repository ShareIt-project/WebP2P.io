var HandshakeConnector = require("./core/HandshakeConnector");

var PUBNUB = require("pubnub");


/**
 * Handshake connector for PubNub
 * @param {Object} configuration Configuration object.
 */
function Connector_PubNub(config_init, config_mess)
{
  HandshakeConnector.call(this);

  var self = this;

  var channel = config_mess.channel;


  // Connect a handshake connector to the PubNub server
  var pubnub = PUBNUB.init(config_init);

  // Configure handshake connector
  pubnub.subscribe(
  {
    channel: channel,
    restore: false,
    backfill: false,

    connect:    self._open,
    message:    self._message,
    disconnect: self._close,
    error:      self._error
  });


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: channel
    });

    // This shouldn't be necesary, but seems 'disconnect' event is not being
    // dispatched by the PubNub channel, so we close the connector explicitly
    self._close();
  }

  /**
   * Send the message
   */
  this.send = function(message)
  {
    pubnub.publish(
    {
      channel: channel,
      message: message
    });
  };
}
Connector_PubNub.prototype.__proto__   = HandshakeConnector.prototype;
Connector_PubNub.prototype.constructor = Connector_PubNub;

//Class constants
Connector_PubNub.prototype.max_connections = 50;
Connector_PubNub.prototype.max_chars       = 1800;


module.exports = Connector_PubNub;