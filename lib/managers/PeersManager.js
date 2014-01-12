var Manager = require('./Manager');

var Connector_DataChannel = require('../connectors/core/DataChannel');


/**
 * @classdesc Manager of the communications with the other peers
 *
 * @constructor
 */
function PeersManager(routingLabel)
{
  Manager.call(this);

  var self = this;


  function createConnector(channel)
  {
    var connector = new Connector_DataChannel(channel);

    this._initConnector(connector);

    return connector;
  };


  var peers = {};

  this.add = function(sessionID, peerConnection)
  {
    peerConnection.addEventListener('signalingstatechange', function(event)
    {
      // Remove the peer from the list of peers when gets closed
      if(peerConnection.signalingState == 'closed')
        delete peers[sessionID];
    });

    // Routing DataChannel, just init routing functionality on it
    var channels = peerConnection.getDataChannels();

    for(var i=0, channel; channel=channels[i]; i++)
      if(channel.label == routingLabel)
        self._connectors.push(createConnector(channel));

    // Add the PeerConnection to the list of enabled ones
    peers[sessionID] = peerConnection;
  };

  this.get = function(sessionID)
  {
    return peers[sessionID];
  };
};
PeersManager.prototype.__proto__   = Manager.prototype;
PeersManager.prototype.constructor = PeersManager;


module.exports = PeersManager;