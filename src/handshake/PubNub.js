/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
function Handshake_PubNub(configuration)
{
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
    self.send({type: 'presence', from: configuration.uid});
  }

  /**
   * Send a message to a peer
   */
  this.send = function(data, uid)
  {
    data.from = configuration.uid
    data.to = uid

    pubnub.publish(
    {
      channel: configuration.channel,
      message: data
    });
  };
}
Handshake_PubNub.prototype = HandshakeConnector;

HandshakeManager.registerConstructor('PubNub', Handshake_PubNub);