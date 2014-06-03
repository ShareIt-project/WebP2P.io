var inherits = require("inherits");

var HandshakeConnector = require("./core/HandshakeConnector");

var pusher = require("pusher");


/**
 * Handshake connector for Pusher
 * @param {Object} configuration Configuration object
 */
function Connector_Pusher(config_init, config_mess, max_connections)
{
  HandshakeConnector.call(this, max_connections);

  var self = this


  // Connect a handshake connector to the Pusher server
  var pusher = new PusherClient(configuration.appKey, configuration);
  var channel;

  pusher.on('connect', function()
  {
    // Receive messages
    channel = pusher.subscribe(config_mess.channel, {user_id:});
    channel.bind('client-message', function(message)
    {
      self.dispatchMessageEvent(message, configuration.uid)
    });

    self._open();
  });
  pusher.connect();

  error:   self.error


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
//    pusher.unsubscribe(configuration.channel);
    pusher.disconnect();
  }

  /**
   * Send a message to a peer
   */
  this.send = function(message)
  {
    channel.trigger('client-message', message);
  }
}
inherits(Connector_Pusher, HandshakeConnector);


module.exports = Connector_Pusher;
