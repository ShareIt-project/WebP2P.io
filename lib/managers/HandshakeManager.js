/**
 * Manage the handshake connectors using several servers
 *
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


  var connector;

  /**
   * Get a random handshake connector or test for the next one
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

      var connectorConstructor = HandshakeManager.handshakeServers[type];

      // Check if connector constructor is from a valid handshake server
      if(connectorConstructor)
      {
        connector = new connectorConstructor(conf);
        connector.max_connections = conf.max_connections

        // Count the maximum number of pending connections allowed to be
        // done with this handshake server (undefined == unlimited)
        connector.connections = 0

        connector.uid = type;

        connector.onopen = function(event)
        {
          status = 'connected';

          var event = new Event(status);
              event.connector = connector;

          self.onconnected(event);
        };

        connector.onpresence = function(event)
        {
          var from = event.from;

          // Check if we should ignore this new peer to increase entropy in
          // the network mesh


          // Do the connection with the new peer
          var event = new Event('connect');
              event.from = from;
              event.connector = this;

          self.onpresence(event);
        };

        connector.onconnect = function(event)
        {
          self.onconnect(event);
        };

        connector.onforward = function(event)
        {
          var connector = event.connector;
          var message = event.message;

          for(var i=0, peer; peer=peers[i]; i++)
          {
            // Don't send the message to the same connector where we received it
            if(peer === connector)
              continue;

            peer.send(message);
          };

          self.onforward(event);
        };

        connector.onclose = function(event)
        {
          // Try to get an alternative handshake connector
          index++
          handshake();
        };

        connector.onerror = function(event)
        {
          console.error(error);

          // Close the connector (and try with the next one)
          transport.close();
        };

        return
      }

      console.error("Invalid handshake server type '" + type + "'");
    }

    // There are no more available configured handshake servers
    status = 'disconnected';

    var event = new Event(status);
        event.connector = connector;

    self.ondisconnected(event);

    // Get ready to start again from begining of handshake servers list
    index = 0;
  }


  this.close = function()
  {
    if(connector)
       connector.close();
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

      self.onerror(event);
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
  };
};
HandshakeManager.prototype.__proto__   = Manager.prototype;
HandshakeManager.prototype.constructor = HandshakeManager;

HandshakeManager.handshakeServers = {}
HandshakeManager.registerConstructor = function(type, constructor)
{
  HandshakeManager.handshakeServers[type] = constructor
};