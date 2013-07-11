/**
 * Handshake channel connector for Pusher
 * @param {Object} configuration Configuration object
 */
function Handshake_Pusher(configuration)
{
  HandshakeConnector.call(this);

  var self = this

  // Connect a handshake channel to the Pusher server
  var pusher = new Pusher(configuration.appKey, configuration);
  var channel = pusher.subscribe(configuration.channel);

  // Receive messages
  callback: function(message)
  {
    self.dispatchMessageEvent(message, configuration.uid)
  },
  connect: self.connect,
  error:   self.error


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
//      pusher.unsubscribe(configuration.channel);
      pusher.disconnect();
  }

  /**
   *  Notify our presence
   */
  this.presence = function(){}

  /**
   * Send a message to a peer
   */
  this.sendData = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    pubnub.publish(
    {
        channel: configuration.channel,

        message: data
    })
  }
}
Handshake_Pusher.prototype = new HandshakeConnector();
Handshake_Pusher.prototype.constructor = Handshake_Pusher;

HandshakeManager.registerConstructor('Pusher', Handshake_Pusher);