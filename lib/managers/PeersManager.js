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


  function initDataChannel(channel, sessionID)
  {
    if(channel.label == routingLabel)
    {
      var connector = createConnector(channel);
          connector.sessionID = sessionID;

      return connector;
    };
  };

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

    if(channels.length)
    {
      for(var i=0, channel; channel=channels[i]; i++)
        if(initDataChannel(channel, sessionID))
          return;
    }
    else
    {
      function initDataChannel_listener(event)
      {
        var channel = event.channel;

        var connector = initDataChannel(channel, sessionID);
        if(connector)
        {
          event.target.removeEventListener('datachannel', initDataChannel_listener);

          // Force to exec the 'open' event on the connector if the datachannel
          // was already open when the 'datachannel' event was dispatched
          if(channel.readyState == 'open')
            connector.emit('open');
        }
      };

      peerConnection.addEventListener('datachannel', initDataChannel_listener);
    };

    // Add PeerConnection to the list of enabled ones
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