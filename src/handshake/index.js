/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
function HandshakeManager(json_uri, webp2p)
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
    // closed, set as disconnected and notify to the webp2p
    else if(!Object.keys(channels).length)
    {
      status = 'disconnected';

      webp2p.handshakeDisconnected();
    }
  }


  /**
   * Get a random handshake channel or test for the next one
   * @param {Object} configuration Handshake servers configuration.
   */
  function getRandomHandshake(configuration)
  {
    var index = Math.floor(Math.random() * configuration.length);
    var index = 0;  // Forced until servers interoperation works

    var type = configuration[index][0];
    var conf = configuration[index][1];

    conf.uid = webp2p.uid;

    var channelConstructor = HandshakeManager.handshakeServers[type];

    // Check if channel constructor is from a valid handshake server
    if(!channelConstructor)
    {
        console.error("Invalidad handshake server type '" + type + "'");

        // Try to get an alternative handshake channel
        nextHandshake();
    }

    var channel = new channelConstructor(conf);

    Transport_Presence_init(channel, webp2p, conf.max_connections)

    channel.uid = type;
    channels[type] = channel;

    channel.addEventListener('open', function(event)
    {
      status = 'connected';

      var event = document.createEvent("Event");
          event.initEvent('open',true,true);

      self.dispatchEvent(event);
    });
    channel.addEventListener('close', function(event)
    {
      status = 'connecting';

      // Delete the channel from the current ones
      delete channels[channel.uid];

      // Try to get an alternative handshake channel
      nextHandshake(configuration);
    });
  }


  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    return channels;
  };


  // Request the handshake servers configuration file
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

      else
      {
        status = 'disconnected';

        if(self.onerror)
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
HandshakeManager.prototype = new EventTarget()


HandshakeManager.handshakeServers = {}
HandshakeManager.registerConstructor = function(type, constructor)
{
  HandshakeManager.handshakeServers[type] = constructor
}