var inherits = require("inherits");

var Connector = require("./Connector");


function Connector_DataChannel(datachannel)
{
  Connector.call(this);

  var self = this;


  datachannel.addEventListener('open',  self._open);
  datachannel.addEventListener('message', function(event)
  {
    self._message(event.data);
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
    datachannel.send(message);
  };
};
inherits(Connector_DataChannel, Connector);


module.exports = Connector_DataChannel;
