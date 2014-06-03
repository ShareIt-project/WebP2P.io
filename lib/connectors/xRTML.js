var inherits = require('inherits');

var HandshakeConnector = require("./core/HandshakeConnector");

var ortcNodeclient = require('ibtrealtimesjnode').IbtRealTimeSJNode;


/**
 * Handshake connector for xRTML
 * @param {Object} configuration Configuration object
 */
function Connector_xRTML(config_init, config_mess, max_connections)
{
  HandshakeConnector.call(this, max_connections);

  var self = this;

  var channel = config_mess.channel;

  // Create ORTC client
  var ortcClient = new ortcNodeclient();

  ortcClient.setClusterUrl('http://ortc-developers.realtime.co/server/2.1/');

  ortcClient.onConnected = function(ortc)
  {
    ortcClient.subscribe(channel, true, function(ortc, channel, message)
    {
      self._message(message);
    });
  };

  ortcClient.onSubscribed   = this._open.bind(this);
  ortcClient.onUnsubscribed = this._close.bind(this);

  ortcClient.onException = function(ortc, exception)
  {
    self._error(exception);
  };

  // Connect a handshake connector to the xRTML server
  ortcClient.connect(config_init.application_key, config_init.authentication_token);


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    ortcClient.unsubscribe(channel);
  };

  /**
   * Send the message
   */
  this.send = function(message)
  {
    ortcClient.send(channel, message);
  };
}
inherits(Connector_xRTML, HandshakeConnector);


module.exports = Connector_xRTML;
