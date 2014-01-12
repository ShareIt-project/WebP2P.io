var Connector = require("./Connector");


function HandshakeConnector()
{
  Connector.call(this);

  var self = this;


  /**
   * Check if we should connect this new peer or ignore it to increase entropy
   * in the network mesh
   *
   * @returns {Boolean}
   */
  this.shouldConnect = function()
  {
    return true;
  };


  // Count the maximum number of pending connections allowed to be
  // done with this handshake server (undefined == unlimited)
  var connections = 0;

  this.increaseConnections = function()
  {
    // Increase the number of connections reached throught
    // this handshake server
    connections++;

    // Close connection with handshake server if we got its quota of peers
    if(connections >= self.max_connections)
       self.close();
  };
};
HandshakeConnector.prototype.__proto__   = Connector.prototype;
HandshakeConnector.prototype.constructor = HandshakeConnector;

// Class constants
HandshakeConnector.prototype.max_connections = Number.POSITIVE_INFINITY;


module.exports = HandshakeConnector;