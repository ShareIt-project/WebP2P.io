var webp2p = (function(module){
var _priv = module._priv = module._priv || {}


/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
_priv.HandshakeManager = function(json_uri, peersManager)
{
  var self = this;

  var channels = {};
  var status = 'disconnected';


  function nextHandshake(configuration)
  {
    // Remove the configuration from the poll
    configuration.splice(index, 1);

    // If there are more pending configurations, go to the next one
    if(configuration.length)
      getRandomHandshake(configuration);

    // There are no more pending configurations and all channels have been
    // closed, set as disconnected and notify to the PeersManager
    else if(!Object.keys(channels).length)
    {
      status = 'disconnected';

      peersManager.handshakeDisconnected();
    }
  }

  /**
   * Get a random handshake channel or test for the next one
   * @param {Object} configuration Handshake servers configuration.
   */
  function getRandomHandshake(configuration)
  {
    var index = Math.floor(Math.random() * configuration.length);
    var index = 0; // Forced until redirection works

    var type = configuration[index][0];
    var conf = configuration[index][1];

    var channelConstructor;
    switch(type)
    {
      case 'PubNub':
        conf.uuid = peersManager.uid;
        channelConstructor = _priv.Handshake_PubNub;
        break;

      case 'SimpleSignaling':
        conf.uid = peersManager.uid;
        channelConstructor = _priv.Handshake_SimpleSignaling;
        break;

      case 'XMPP':
        conf.uid = peersManager.uid
        channelConstructor = _priv.Handshake_XMPP;
        break;

      case 'xRTML':
        conf.uid = peersManager.uid
        channelConstructor = _priv.Handshake_xRTML;
        break;

      default:
        console.error("Invalidad handshake server type '" + type + "'");

        // Try to get an alternative handshake channel
        nextHandshake();
    }

    var channel = new channelConstructor(conf);

    channel.uid = type;
    channels[channel.uid] = channel;

    // Count the maximum number of pending connections allowed to be
    // done with this handshake server (undefined == unlimited)
    channel.connections = 0;
    channel.max_connections = conf.max_connections;

    channel.addEventListener('presence', function(event)
    {
      var uid = event.uid;

      // Check if we should ignore this new peer to increase
      // entropy in the network mesh
      // Do the connection with the new peer
      peersManager.connectTo(uid, channel, function(error, channel)
      {
        if(error)
          console.error(uid, peer, channel);

        else
          // Increase the number of connections reached throught
          // this handshake server
          channel.connections++;

        // Close connection with handshake server if we got its
        // quota of peers
        if(channel.connections == channel.max_connections)
           channel.close();
      });
    });

    _priv.Transport_Routing_init(channel, peersManager);

    channel.onopen = function()
    {
      status = 'connected';

//      // Notify our presence to the other peers on the handshake server
//      channel.presence();

      if(self.onopen)
         self.onopen();
    };
    channel.onclose = function()
    {
      // Delete the channel from the current ones
      delete channels[channel.uid];

      // Try to get an alternative handshake channel
      nextHandshake(configuration);
    };
    channel.onerror = function(error)
    {
      console.error(error);

      // Close the channel (and try with the next one)
      channel.close();
    };
  }


  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    return channels;
  };


  var http_request = new XMLHttpRequest();
  http_request.open('GET', json_uri);
  http_request.onload = function()
  {
    if(this.status == 200)
    {
      status = 'connecting';

      var configuration = JSON.parse(http_request.response);

      if(configuration.length)
        getRandomHandshake(configuration);

      else if(self.onerror)
      {
        status = 'disconnected';

        self.onerror('Handshake servers configuration is empty');
      }
    }
    else if(self.onerror)
      self.onerror('Unable to fetch handshake servers configuration');
  };
  http_request.onerror = function()
  {
    if(self.onerror)
       self.onerror('Unable to fetch handshake servers configuration');
  };

  http_request.send();
}

return module
})(webp2p || {})