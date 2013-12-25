/**
 * Handshake connector for PubNub
 * @param {Object} configuration Configuration object.
 */
function Handshake_PubNub(configuration)
{
  HandshakeConnector.call(this);

  var self = this;


  // Connect a handshake connector to the PubNub server
  var pubnub = PUBNUB.init(configuration);


  // Configure handshake connector
  pubnub.subscribe(
  {
    channel: configuration.channel,

    connect: function()
    {
      // Notify our presence
      var request =
      {
        method: 'presence',
        ttl:    1
      };
      this._sendRequest(request);

      // Notify that the connection to this handshake server is open
      self.onopen(new Event('open'));
    },

    //
    // Process incoming messages
    //
    callback: function(message)
    {
      if(self._processMessage(message))
        return;

      var method = message.method;
      switch(method)
      {
        case 'presence':
        {
          var from = message.from;

          var event = new Event('presence');
              event.from = from;

          self.onpresence(event);
        }
        break;

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
    },

    disconnect: function()
    {
      self.onclose(new Event('close'));
    },

    error: self.onerror
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

//    self.disconnect();
  }


  this._send = function(message, dest)
  {
    if(dest)
      message.dest = dest;  // If not defined, it's send as broadcast

    // Send message
    pubnub.publish(
    {
      channel: configuration.channel,
      message: message
    });
  };
}
Handshake_PubNub.prototype.__proto__   = HandshakeConnector.prototype;
Handshake_PubNub.prototype.constructor = Handshake_PubNub;

HandshakeManager.registerConstructor('PubNub', Handshake_PubNub);