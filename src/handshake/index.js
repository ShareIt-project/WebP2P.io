/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
function HandshakeManager(uid)
{
  var self = this;

  var status = 'disconnected';

  var configs = []
  var index


  this.__defineGetter__("status", function()
  {
    return status
  })


  /**
   * Get a random handshake channel or test for the next one
   * @param {Object} configuration Handshake servers configuration.
   */
  function handshake()
  {
    if(index == undefined || !configs.length)
      throw Error('No handshake servers defined')

    status = 'connecting';

    for(; index < configs.length; index++)
    {
      var type = configs[index][0];
      var conf = configs[index][1];

      conf.uid = uid;

      var channelConstructor = HandshakeManager.handshakeServers[type];

      // Check if channel constructor is from a valid handshake server
      if(channelConstructor)
      {
        var channel = new channelConstructor(conf);
            channel.max_connections = conf.max_connections

        channel.uid = type;

        channel.addEventListener('open', function(event)
        {
          status = 'connected';

          var event = document.createEvent("Event");
              event.initEvent(status,true,true);
              event.channel = channel

          self.dispatchEvent(event);
        });
        channel.addEventListener('close', function(event)
        {
          // Try to get an alternative handshake channel
          index++
          handshake();
        });

        break
      }

      console.error("Invalid handshake server type '" + type + "'");
    }

    // There are no more available configured handshake servers
    status = 'disconnected';

    var event = document.createEvent("Event");
        event.initEvent(status,true,true);
        event.channel = channel

    self.dispatchEvent(event);

    // Get ready to start again from begining of handshake servers list
    index = 0
  }


  this.addConfigs = function(json_uri)
  {
    // Request the handshake servers configuration file
    var http_request = new XMLHttpRequest();

    http_request.open('GET', json_uri);
    http_request.onload = function(event)
    {
      if(this.status == 200)
      {
        var configuration = JSON.parse(http_request.response);

        if(configuration.length)
        {
          configs = configs.concat(configuration)

          // Start handshaking
          if(status = 'disconnected')
          {
            if(index == undefined)
              index = 0;

            handshake();
          }
        }

        else
        {
          var event = document.createEvent("Event");
              event.initEvent('error',true,true);
              event.error = ERROR_REQUEST_EMPTY

          self.dispatchEvent(event);
        }
      }
      else
      {
        var event = document.createEvent("Event");
            event.initEvent('error',true,true);
            event.error = ERROR_REQUEST_FAILURE

        self.dispatchEvent(event);
      }
    };
    http_request.onerror = function(event)
    {
      var event = document.createEvent("Event");
          event.initEvent('error',true,true);

      if(navigator.onLine)
        event.error = ERROR_NETWORK_UNKNOWN
      else
        event.error = ERROR_NETWORK_OFFLINE

      self.dispatchEvent(event);
    };

    http_request.send();
  }
}
HandshakeManager.prototype = new EventTarget()


HandshakeManager.handshakeServers = {}
HandshakeManager.registerConstructor = function(type, constructor)
{
  HandshakeManager.handshakeServers[type] = constructor
}