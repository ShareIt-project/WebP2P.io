/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
function HandshakeManager(uid)
{
  var self = this;

  EventTarget.call(this);

  var status = 'disconnected';

  var configs = []
  var index


  this.__defineGetter__("status", function()
  {
    return status
  })


  var channel;

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
        channel = new channelConstructor(conf);
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

        return
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


  this.close = function()
  {
    if(channel)
       channel.close();
  }

  this.addConfigs_byArray = function(configuration)
  {
    configs = configs.concat(configuration)

    // Start handshaking
    if(status == 'disconnected')
    {
      if(index == undefined)
         index = 0;

      handshake();
    }
  }

  this.addConfigs_byUri = function(json_uri)
  {
    function dispatchError(error)
    {
      var event = document.createEvent("Event");
          event.initEvent('error',true,true);
          event.error = error

      self.dispatchEvent(event);
    }

    // Request the handshake servers configuration file
    var http_request = new XMLHttpRequest();

    http_request.open('GET', json_uri);
    http_request.onload = function(event)
    {
      if(this.status == 200)
      {
        var configuration = JSON.parse(http_request.response);

        // We got some config entries
        if(configuration.length)
          this.addConfigs_byArray(configuration)

        // Config was empty
        else
          dispatchError(ERROR_REQUEST_EMPTY)
      }

      // Request returned an error
      else
        dispatchError(ERROR_REQUEST_FAILURE)
    };

    // Connection error
    http_request.onerror = function(event)
    {
      dispatchError(navigator.onLine ? ERROR_NETWORK_UNKNOWN
                                     : ERROR_NETWORK_OFFLINE)
    };

    http_request.send();
  }
}


HandshakeManager.handshakeServers = {}
HandshakeManager.registerConstructor = function(type, constructor)
{
  HandshakeManager.handshakeServers[type] = constructor
}


function HandshakeConnector()
{
  var self = this

  /**
   * Handle the connection to the handshake server
   */
  this.connect = function()
  {
    // Notify our presence
    self.presence()

    // Notify that the connection to this handshake server is open
    var event = document.createEvent("Event");
        event.initEvent('open',true,true);

    self.dispatchEvent(event);
  }

  this.disconnect = function()
  {
    var event = document.createEvent("Event");
        event.initEvent('close',true,true);

    self.dispatchEvent(event);
  }

  /**
   * Dispatch received messages
   */
  this.dispatchMessageEvent = function(event, uid)
  {
    // Don't try to connect to ourselves
    if(event.from == uid)
      return

    self.dispatchEvent(event);
  }

  /**
   * Dispatch received messages
   */
  this.dispatchPresence = function(from)
  {
    var event = document.createEvent("Event");
        event.initEvent('presence',true,true);

        event.from = from

    self.dispatchMessageEvent(event);
  }

  /**
   * Handle errors on the connection
   */
  this.error = function(event)
  {
    self.dispatchEvent(event)
  }
}
HandshakeConnector.prototype = new EventTarget();