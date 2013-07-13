/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
function Handshake_PubNub(configuration)
{
  HandshakeConnector.call(this);

  var self = this;

  // Connect a handshake channel to the PubNub server
  var pubnub = PUBNUB.init(configuration);

  // Configure handshake channel
  pubnub.subscribe(
  {
    channel: configuration.channel,

    callback: function(message)
    {
      self.dispatchMessageEvent(message, configuration.uid)
    },
    connect: self.connect,
    error:   self.error
  });


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: configuration.channel
    });
  }

  /**
   *  Notify our presence
   */
  this.presence = function()
  {
    self.sendData({type: 'presence'});
  }

  /**
   * Send a message to a peer
   */
  this.sendData = function(data, dest)
  {
    data.from = configuration.uid
    data.dest = dest

    pubnub.publish(
    {
      channel: configuration.channel,
      message: data
    });
  };
}
Handshake_PubNub.prototype = new HandshakeConnector();
Handshake_PubNub.prototype.constructor = Handshake_PubNub;

HandshakeManager.registerConstructor('PubNub', Handshake_PubNub);