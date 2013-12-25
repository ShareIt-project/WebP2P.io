function Routing_DataChannel(channel)
{
  HandshakeConnector.call(this);

  var self = this;


  //
  // Process incoming messages
  //
  channel.addEventListener('message', function(event)
  {
    var message = JSON.parse(event.data);

    // [ToDo] Check this
//    event.from = channel.uid

    if(self._processMessage(message))
      return;

    var method = message.method;
    switch(method)
    {
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
  });

  channel.addEventListener('close', self.onclose);
  channel.addEventListener('error', self.onerror);


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    channel.close();
  };


  /**
   * Send the message to another peer
   */
  this._send = function(message, dest)
  {
    if(dest)
      message.dest = dest;  // If not defined, it's send as broadcast

    channel.send(JSON.stringify(message));
  };
};
Routing_DataChannel.prototype.__proto__   = HandshakeConnector.prototype;
Routing_DataChannel.prototype.constructor = Routing_DataChannel;