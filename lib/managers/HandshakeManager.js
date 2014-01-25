var Manager = require('./Manager');

var errors = require('../errors');


var Connector_PubNub = require('../connectors/PubNub');


/**
 * Manage the handshake connectors using several servers
 *
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
function HandshakeManager(messagepacker, handshake_servers)
{
  Manager.call(this, messagepacker);

  var self = this;


  var handshakeConnectorConstructors = {};

  this.registerConnectorConstructor = function(type, constructor)
  {
    handshakeConnectorConstructors[type] = constructor
  };


  // Default handshake connectors
  this.registerConnectorConstructor('PubNub', Connector_PubNub);


  function createConnector(config)
  {
    var type        = config.type;
    var config_init = config.config_init;
    var config_mess = config.config_mess;

    // Check if connector constructor is from a valid handshake server
    var connectorConstructor = handshakeConnectorConstructors[type];
    if(!connectorConstructor)
      throw Error("Invalid handshake server type '" + type + "'");

    var connector = new connectorConstructor(config_init, config_mess);

    self._initConnector(connector);

    connector.on('open', function()
    {
      // Notify our presence to the other peers
      connector.send(messagepacker.presence());
    });

    var _messageUnpacked = connector._messageUnpacked;
    connector._messageUnpacked = function(message)
    {
      if(message.type == 'presence')
      {
        if(connector.shouldConnect())
          self.emit("presence", message.from, connector);
      }
      else
        _messageUnpacked.call(connector, message);
    };

    return connector;
  };


  var configs = [];
  var index = 0;

  var configs_infinity = [];

  /**
   * Get a random handshake connector or test for the next one
   * @param {Object} configuration Handshake servers configuration.
   */
  function handshake()
  {
    if(!configs.length)
      throw Error('No handshake servers defined')

    for(; index < configs.length; index++)
    {
      var connector = createConnector(configs[index]);
          connector.on('close', function()
      {
        // Handshake connector has been closed, try to get an alternative one
        index++;
        handshake();
      });

      // Connector successfully created
      return;
    };

    // All configured handshake servers has been consumed
    // Get ready to start again from beginning of handshake servers list
    index = 0;
  };


  this.addConfigs_byObject = function(config)
  {
    // Check if connector constructor is from a valid handshake server
    var connectorConstructor = handshakeConnectorConstructors[config.type];
    if(!connectorConstructor)
    {
      console.error("Invalid handshake server config: ", config);
      return;
    };

    if(connectorConstructor.prototype.max_connections == Number.POSITIVE_INFINITY)
    {
      configs_infinity.push(config)

      // Start handshaking
      createConnector(config);
    }
    else
    {
      configs.push(config);

      // Start handshaking
      if(self.status == 'disconnected')
      {
        if(index == undefined)
           index = 0;

        handshake();
      }
    }
  };

  this.addConfigs_byArray = function(configuration)
  {
    for(var i=0, config; config=configuration[i]; i++)
      self.addConfigs_byObject(config);
  };

  this.addConfigs_byUri = function(json_uri)
  {
    function dispatchError(error)
    {
      self.emit('error', error);
    };

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
          dispatchError(errors.ERROR_REQUEST_EMPTY)
      }

      // Request returned an error
      else
        dispatchError(errors.ERROR_REQUEST_FAILURE)
    };

    // Connection error
    http_request.onerror = function(event)
    {
      dispatchError(navigator.onLine ? errors.ERROR_NETWORK_UNKNOWN
                                     : errors.ERROR_NETWORK_OFFLINE)
    };

    http_request.send();
  };

  this.addConfigs = function(configuration)
  {
    if(typeof configuration == 'string')
      this.addConfigs_byUri(configuration)

    else if(configuration instanceof Array)
      this.addConfigs_byArray(configuration)

    else
      this.addConfigs_byObject(configuration)
  };


  // Add handshake servers configuration
  if(handshake_servers)
    this.addConfigs(handshake_servers)
};
HandshakeManager.prototype.__proto__   = Manager.prototype;
HandshakeManager.prototype.constructor = HandshakeManager;


module.exports = HandshakeManager;