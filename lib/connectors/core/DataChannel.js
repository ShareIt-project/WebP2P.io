var Connector = require("./Connector");


function Connector_DataChannel(datachannel)
{
  Connector.call(this);

  var self = this;


  datachannel.addEventListener('open',  self._open);
  datachannel.addEventListener('message', function(event)
  {
    self._message(JSON.parse(event.data));
  });
  datachannel.addEventListener('close', self._close);
  datachannel.addEventListener('error', self._error);


  // Define methods

  /**
   * Close the connection with the peer
   */
  this.close = function()
  {
    datachannel.close();
  };

  /**
   * Send the message
   */
  this.send = function(message)
  {
    datachannel.send(JSON.stringify(message));
  };
};
Connector_DataChannel.prototype.__proto__   = Connector.prototype;
Connector_DataChannel.prototype.constructor = Connector_DataChannel;


module.exports = Connector_DataChannel;