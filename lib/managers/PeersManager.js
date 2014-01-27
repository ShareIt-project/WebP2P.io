var Manager = require('./Manager');

var Connector_DataChannel = require('../connectors/core/DataChannel');


/**
 * @classdesc Manager of the communications with the other peers
 *
 * @constructor
 */
function PeersManager(messagepacker, routingLabel)
{
  Manager.call(this, messagepacker);

  var self = this;


  function createConnector(channel)
  {
    var connector = new Connector_DataChannel(channel);

    self._initConnector(connector);

    return connector;
  };


  var peers = {};

  this.__defineGetter__("peers", function()
  {
    return peers;
  });


  this.add = function(sessionID, peerConnection)
  {
    peerConnection.addEventListener('signalingstatechange', function(event)
    {
      // Remove the peer from the list of peers when gets closed
      if(peerConnection.signalingState == 'closed')
        delete peers[sessionID];
    });

    function initRoutingChannel(channel)
    {
      if(channel.label == routingLabel)
      {
        var connector = createConnector(channel);
            connector.sessionID = sessionID;

        // Add PeerConnection to the list of enabled ones
        peers[sessionID] = peerConnection;

        self.emit('peerconnection', peerConnection);

        // Notify that the routing channel has been initialized
        return true;
      };
    };

    // Routing DataChannel, just init routing functionality on it
    var channels = peerConnection.getDataChannels();
    if(channels)
      for(var i=0, channel; channel=channels[i]; i++)
        if(initRoutingChannel(channel))
          return;

    // Channels were not still created, wait until they are done
    else
    {
      function initRoutingChannel_listener(event)
      {
        if(initRoutingChannel(event.channel))
          peerConnection.removeEventListener('datachannel', initRoutingChannel_listener);
      };

      peerConnection.addEventListener('datachannel', initRoutingChannel_listener);
    }
  };

  this.get = function(sessionID)
  {
    return peers[sessionID];
  };
};
PeersManager.prototype.__proto__   = Manager.prototype;
PeersManager.prototype.constructor = PeersManager;


module.exports = PeersManager;
