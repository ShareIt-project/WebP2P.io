!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.WebP2Pio=e():"undefined"!=typeof global?global.WebP2Pio=e():"undefined"!=typeof self&&(self.WebP2Pio=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Based on code from RPC-Builder
 */


const PRESENCE = 0;
const OFFER    = 1;
const ANSWER   = 2;

var MAX_TTL_DEFAULT = 5;

Manager.MAX_ALLOWED_ERROR_TRIES = 3;
Manager.BASE_TIMEOUT = 5000;


function MessagePacker(sessionID)
{
  var requestID = 0;

  var requests  = {};
  var responses = {};


  this.pack = function()
  {
      
  };

  this.unpack = function(message)
  {
    var result = {};

    // Type
    switch(message[0])
    {
      case PRESENCE:
        result.type = "presence";
      break;

      case OFFER:
        result.type = "offer";
      break;

      case ANSWER:
        result.type = "answer";
      break;

      default:
      {
        var error = Error("Unknown message type '"+type+"'");
            error.message = message;

        throw error;
      };
    };

    // From
    result.from = message[1];

    // Offer & Answer

    if(result.type != 'presence')
    {
      result.dest = message[2];
      result.id   = message[3];
      result.ttl  = message[4];
      result.sdp  = message[5];
    };

    return result;
  };


  this.presence = function()
  {
    var message =
    [
      PRESENCE,  // type
      sessionID  // from
    ];

    return message;
  };

  this.offer = function(dest, sdp)
  {
    var message =
    [
      OFFER,            // type
      sessionID,        // from
      dest,             // dest
      requestID++,      // id
      MAX_TTL_DEFAULT,  // ttl
      sdp               // sdp
    ];

    return message;
  };

  this.answer = function(dest, id, sdp)
  {
    var message =
    [
      ANSWER,           // type
      sessionID,        // from
      dest,             // dest
      id,               // id
      MAX_TTL_DEFAULT,  // ttl
      sdp               // sdp
    ];

    return message;
  };
};


module.exports = MessagePacker;
},{}],2:[function(require,module,exports){
/**
 * Add support to get a list of channels on a PeerConnection object
 */
function applyChannelsShim(pc)
{
  if(pc.getDataChannels != undefined) return;

  var channels = [];

  pc.getDataChannels = function()
  {
    return channels;
  };

  function initChannel(channel, createdbyus)
  {
    channel.createdbyus = createdbyus;

    channels.push(channel);

    channel.addEventListener('close', function(event)
    {
      channels.splice(channels.indexOf(channel), 1);
    });
  };

  // Add DataChannels created by remote PeerConnection object
  var dispatchEvent = pc.dispatchEvent;
  pc.dispatchEvent = function(event)
  {
    if(event.type == 'datachannel')
    {
      var channel = event.channel;

      initChannel(channel, false);
    };

    // Dispatch events
    dispatchEvent.call(this, event);
  };

  // Add DataChannels created by local PeerConnection object
  var createDataChannel = pc.createDataChannel;
  pc.createDataChannel = function(label, dataChannelDict)
  {
    var channel = createDataChannel.call(this, label, dataChannelDict);

    initChannel(channel, true);

    // Dispatch datachannel events for local created ones
    var event = new Event('datachannel');
        event.channel = channel;

    dispatchEvent.call(this, event);
  };
};


module.exports = applyChannelsShim;
},{}],3:[function(require,module,exports){
var HandshakeConnector = require("./core/HandshakeConnector");


/**
 * Handshake connector for PubNub
 * @param {Object} configuration Configuration object.
 */
function Connector_PubNub(config_init, config_mess)
{
  HandshakeConnector.call(this);

  var self = this;

  var channel = config_mess.channel;


  // Connect a handshake connector to the PubNub server
  var pubnub = PUBNUB.init(config_init);

  // Configure handshake connector
  pubnub.subscribe(
  {
    channel: channel,

    connect:    self._open,
    message:    self._message,
    disconnect: self._close,
    error:      self._error
  });


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: channel
    });

//    self._close();
  }

  /**
   * Send the message
   */
  this.send = function(message)
  {
    pubnub.publish(
    {
      channel: channel,
      message: message
    });
  };
}
Connector_PubNub.prototype.__proto__   = HandshakeConnector.prototype;
Connector_PubNub.prototype.constructor = Connector_PubNub;

//Class constants
Connector_PubNub.prototype.max_connections = 50;
Connector_PubNub.prototype.max_chars       = 1800;


module.exports = Connector_PubNub;
},{"./core/HandshakeConnector":6}],4:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter;


function Connector()
{
  EventEmitter.call(this);

  var self = this;


  /**
   * Notify that the connection to this handshake server is open
   */
  this._open = function()
  {
    self.emit('open');
  };

  this._message = function(message)
  {
    self.emit("message", message);
  };

  this._close = function()
  {
    self.emit('close');
  };

  this._error = function(error)
  {
    self.emit('error', error);
  };
};
Connector.prototype.__proto__   = EventEmitter.prototype;
Connector.prototype.constructor = Connector;

Connector.prototype.close = function()
{
  throw new TypeError("Connector.close should be defined in a child class");
};
Connector.prototype.send = function(message)
{
  throw new TypeError("Connector.send should be defined in a child class");
};


module.exports = Connector;
},{"events":12}],5:[function(require,module,exports){
var Connector = require("./Connector");


function Connector_DataChannel(datachannel)
{
  Connector.call(this);

  var self = this;


  datachannel.addEventListener('open',  self._open);
  datachannel.addEventListener('message', function(event)
  {
    self._message(JSON.parse(event.data));
  });
  datachannel.addEventListener('close', self._close);
  datachannel.addEventListener('error', self._error);


  // Define methods

  /**
   * Close the connection with the peer
   */
  this.close = function()
  {
    datachannel.close();
  };

  /**
   * Send the message
   */
  this.send = function(message)
  {
    datachannel.send(JSON.stringify(message));
  };
};
Connector_DataChannel.prototype.__proto__   = Connector.prototype;
Connector_DataChannel.prototype.constructor = Connector_DataChannel;


module.exports = Connector_DataChannel;
},{"./Connector":4}],6:[function(require,module,exports){
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
},{"./Connector":4}],7:[function(require,module,exports){
const ERROR_NETWORK_UNKNOWN = {id: 0, msg: 'Unable to fetch handshake servers configuration'};
const ERROR_NETWORK_OFFLINE = {id: 1, msg: "There's no available network"};
const ERROR_REQUEST_FAILURE = {id: 2, msg: 'Unable to fetch handshake servers configuration'};
const ERROR_REQUEST_EMPTY   = {id: 3, msg: 'Handshake servers configuration is empty'};

const ERROR_NO_PEERS        = {id: 4, msg: 'Not connected to any peer'};


exports.ERROR_NETWORK_UNKNOWN = ERROR_NETWORK_UNKNOWN;
exports.ERROR_NETWORK_OFFLINE = ERROR_NETWORK_OFFLINE;
exports.ERROR_REQUEST_FAILURE = ERROR_REQUEST_FAILURE;
exports.ERROR_REQUEST_EMPTY   = ERROR_REQUEST_EMPTY;
exports.ERROR_NO_PEERS        = ERROR_NO_PEERS;
},{}],8:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter;

//var uuid = require('uuid');

var HandshakeManager = require('./managers/HandshakeManager');
var PeersManager     = require('./managers/PeersManager');

var MessagePacker = require('./MessagePacker');

var applyChannelsShim = require("./PeerConnection_channels.shim");


/**
 * @classdesc Init and connect to the WebP2P.io network
 *
 * @constructor
 */
function WebP2P(options)
{
  var self = this;


  /**
   * UUID generator
   */
  var UUIDv4 = function b(a)
  {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
  };


  var options = options || {};

  // Internal options
  var commonLabels      = options.commonLabels || [];
  var handshake_servers = options.handshake_servers;
  var stun_server       = options.stun_server || 'stun.l.google.com:19302';

  // Read-only options
  Object.defineProperty(this, "routingLabel",
  {
    value: options.routingLabel || "webp2p"
  });
  Object.defineProperty(this, "sessionID",
  {
    value: options.sessionID || UUIDv4()
//    value: options.sessionID || uuid.v4()
  });


  var messagePacker = new MessagePacker(this.sessionID);

  var handshakeManager = new HandshakeManager(handshake_servers, messagepacker);
  var peersManager     = new PeersManager(self.routingLabel);

  this.__defineGetter__("status", function()
  {
    if(peersManager.status == 'connected')
      return 'connected'

    return handshakeManager.status
  });


  function onerror(error)
  {
    self.emit('error', error);
  };


  /**
   * Create a new RTCPeerConnection
   * @param {UUID} id Identifier of the other peer so later can be accessed.
   *
   * @return {RTCPeerConnection}
   */
  function createPeerConnection(sessionID, callbackType, callback)
  {
    var pc = new RTCPeerConnection
    (
      {iceServers: [{url: 'stun:'+stun_server}]},
      {optional: [{DtlsSrtpKeyAgreement: true}]}
    );

    applyChannelsShim(pc);

    self.emit('peerconnection', pc);

    pc.createDataChannel(self.routingLabel);

    pc.addEventListener('icecandidate', function(event)
    {
      // There's a candidate, ignore it
      if(event.candidate)
        return;

      // There's no candidate, send the full SDP
      var type = this.localDescription.type;
      var sdp  = this.localDescription.sdp;

      if(type == callbackType)
        callback(sdp)
      else
        console.error(type+" SDP type is not equal to "+callbackType+" callback type");
    });

    // Add PeerConnection object to available ones when gets open
    pc.addEventListener('open', function(event)
    {
      peersManager.add(sessionID, pc);
    });

    return pc;
  };


  function initPeerConnection_Offer(pc, labels)
  {
    // Set channels for this PeerConnection object
    for(var i=0, label; label=commonLabels[i]; i++)
      pc.createDataChannel(label);

    // Send offer
    var mediaConstraints =
    {
      mandatory:
      {
        OfferToReceiveAudio: false,
        OfferToReceiveVideo: false
      }
    };

    pc.createOffer(function(offer)
    {
      // Set the peer local description
      pc.setLocalDescription(offer,
      function()
      {
        console.log("LocalDescription correctly set for "+from);
      },
      onerror);
    },
    onerror,
    mediaConstraints);
  };

  function initPeerConnection_Answer(pc)
  {
    // Process offer
    pc.setRemoteDescription(new RTCSessionDescription(
    {
      sdp: message.sdp,
      type: 'offer'
    }),
    function()
    {
      // Send answer
      pc.createAnswer(function(answer)
      {
        // Set the peer local description
        pc.setLocalDescription(answer,
        function()
        {
          console.log("Generated Answer LocalDescription for "+from);
        },
        onerror);
      },
      onerror)
    },
    onerror);
  };


  //
  // Connection methods
  //

  /**
   * Callback to send the offer. If not defined send it to all connected peers.
   *
   * @callback WebP2P~ConnectToCallback
   * @param {Error} error
   * @param {RTCPeerConnection} peer - The (newly created) peer
   */

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   *
   * @param {UUID} sessionID - Identifier of the other peer to be connected.
   * @param {string[]} [labels] - Per-connection labels
   * @param {WebP2P~ConnectToCallback} callback
   */
  this.connectTo = function(dest, labels, callback)
  {
    var peer = peersManager.get(dest);
    if(peer)
      callback(null, peer)

    else
    {
      peer = createPeerConnection(dest, "offer", function(offer)
      {
        var message = messagepacker.offer(dest, offer, callback);

        handshakeManager.send(message);
        peersManager.send(message);
      });

      initPeerConnection_Offer(peer, labels);
    }
  };


  //
  // Managers
  //

  function forward(message, connector)
  {
    // Don't forward the message if TTL has been achieved
    if(--message.ttl <= 0)
    {
      console.warning("TTL achieved: "+message);
      return;
    };

    // Ensure that TTL is not over the maximum
    message.ttl = min(message.ttl, MAX_TTL_DEFAULT);

    var dest = message.dest;

    message = messagepacker.pack(message);

    // Search the peer between the ones currently connected
    for(var i=0, peer; peer=peersManager._connectors[i]; i++)
      if(peer.sessionID === dest)
      {
        peer.send(message);
        return;
      };

    // Peer was not found, forward message to all the connectors
    peersManager.send(message, connector);
    handshakeManager.send(message, connector);
  };


  function initManagerEvents(manager)
  {
    //
    // Basic events
    //

    manager.on('connected', function(connector)
    {
      if(handshakeManager.status != peersManager.status)
        self.emit('connected');
    });
    manager.on('disconnected', function()
    {
      if(handshakeManager.status == peersManager.status)
        self.emit('disconnected');
    });
    manager.on('error', function(error)
    {
      self.emit('error', error);
    });

    //
    // Offer & answer events
    //

    manager.on('offer', function(message, connector)
    {
      var from = message.from;
      var dest = message.dest;

      console.log("Received connection request from "+from);

      // Message is for us
      if(dest == sessionID)
      {
        // Search the peer between the list of currently connected ones,
        // or create it if it's not connected
        var pc = createPeerConnection(from, "answer", function(answer)
        {
          var message = messagepacker.answer(from, message.id, answer);

          // Send back the connection request over the same connector, since
          // this should be the shortest path to connect both peers
          connector.send(message);
        });

        initPeerConnection_Answer(pc);
      }

      // Forward message
      else
        forward(message, connector);
    });

    manager.on('answer', function(message, connector)
    {
      var from = message.from;
      var dest = message.dest;

      // Message is for us
      if(dest == sessionID)
      {
        console.log("Received connection response from "+from);

        var peer = peersManager.get(from);
        if(peer)
        {
          peer.setRemoteDescription(new RTCSessionDescription(
          {
            sdp: sdp,
            type: 'answer'
          }),
          function()
          {
            console.log("Successfuly generated RemoteDescription for "+from);
          },
          onerror);

          connector.increaseConnections();
        }
        else
          onerror("Connection with peer '" + from + "' was not previously requested");
      }

      // Forward message
      else
        forward(message, connector);
    });
  };

  // Init managers events

  initManagerEvents(handshakeManager);
  initManagerEvents(peersManager);

  handshakeManager.on('presence', function(from, connector)
  {
    var peer = peersManager.get(from);
    if(!peer)
    {
      var pc = createPeerConnection(from, "offer", function(offer)
      {
        var message = messagepacker.offer(from, offer);

        // Send back the connection request over the same connector, since this
        // should be the shortest path to connect both peers
        connector.send(message);
      });

      initPeerConnection_Offer(pc, labels);
    }
  });


  //
  // Clossing functions
  //

  this.close = function()
  {
    handshakeManager.close();
    peersManager.close();
  };

  // Close all connections when user goes out of the page
  if(window)
    window.addEventListener('beforeunload', function(event)
    {
      self.close();
    });
};
WebP2P.prototype.__proto__   = EventEmitter.prototype;
WebP2P.prototype.constructor = WebP2P;


exports.WebP2P = WebP2P;
},{"./MessagePacker":1,"./PeerConnection_channels.shim":2,"./managers/HandshakeManager":9,"./managers/PeersManager":11,"events":12}],9:[function(require,module,exports){
var Manager = require('./Manager');

var errors = require('../errors');


var Connector_PubNub = require('../connectors/PubNub');


/**
 * Manage the handshake connectors using several servers
 *
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration.
 */
function HandshakeManager(handshake_servers, messagepacker)
{
  Manager.call(this);

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
    var connectorConstructor = handshakeConnectorsConstructors[type];
    if(!connectorConstructor)
      throw Error("Invalid handshake server type '" + type + "'");

    var connector = new connectorConstructor(config_init, config_mess);

    self._initConnector(connector);

    connector.on('open', function()
    {
      // Notify our presence to the other peers
      connector.send(messagepacker.presence());
    });

    connector._messageUnpacked = function(message)
    {
      if(message.type == 'presence')
      {
        if(connector.shouldConnect())
          self.emit("presence", message.from, connector);
      }
      else
        Manager._messageUnpacked.call(this, message);
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
      if(connector)
      {
        connector.on('close', function()
        {
          // Handshake connector has been closed, try to get an alternative one
          index++;
          handshake();
        });

        // Connector successfully created
        return;
      };
    };

    // All configured handshake servers has been consumed
    // Get ready to start again from beginning of handshake servers list
    index = 0;

    // There are no more available configured handshake servers
    if(self.status == 'disconnected')
       self.emit('disconnected');
  };


  this.addConfigs_byObject = function(config)
  {
    // Check if connector constructor is from a valid handshake server
    var connectorConstructor = handshakeConnectorsConstructors[type];
    if(!connectorConstructor)
    {
      console.error("Invalid handshake server config: "+config);
      return;
    };

    if(connectorConstructor.prototype.max_connections == Number.POSITIVE_INFINITY)
    {
      configs_infinity.push(config)

      // Start handshaking
      var connector = createConnector(config);
      connector.on('close', function()
      {
        if(self.status == 'disconnected')
           self.emit('disconnected');
      });
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
},{"../connectors/PubNub":3,"../errors":7,"./Manager":10}],10:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter;


function Manager()
{
  EventEmitter.call(this);

  var self = this;


  this._connectors = [];

  this.__defineGetter__("status", function()
  {
    return this._connectors.length ? 'connected' : 'disconnected';
  });


  this._initConnector = function(connector)
  {
    connector.on('open', function()
    {
      if(self.status == 'disconnected')
         self.emit('connected');

      self._connectors.push(connector);
    });
    connector.on('close', function()
    {
      self._connectors.splice(self._connectors.indexOf(connector), 1);
    });
    connector.on('error', function(error)
    {
      connector.close();

      self.emit('error', error);
    });

    connector._messageUnpacked = function(message)
    {
      switch(message.type)
      {
        case 'offer':
        case 'answer':
          self.emit(message.type, message, connector);
        break;

        default:
          console.error("Unknown message type '"+type+"'");
          console.error(message);
      };
    };

    connector.on('message', function(message)
    {
      connector._messageUnpacked(messagepacker.unpack(message));
    });
  };


  /**
   * {Object} message - Message to be send
   * {Connector} [incomingConnector] - {Connector} to don't send the message
   */
  this.send = function(message, incomingConnector)
  {
    for(var i=0, peer; peer=this._connectors[i]; i++)
    {
      // Don't send the message to the same connector where we received it
      if(peer === incomingConnector)
        continue;

      peer.send(message);
    };
  };


  /**
   * Close all the connections
   */
  this.close = function()
  {
    for(var i=0, peer; peer=this._connectors[i]; i++)
      peer.close();
  };


//  //
//  // Connection request and response proccessors
//  //
//
//  this._connectRequest = function(request)
//  {
//    var id  = request.id;
//    var sdp = request.params[0];
//
//    var from = request.from;
//
//    // Check if it's a re-try
//    var response = responses[from];
//    if(response)
//    {
//      // Old message, ignore it
//      if(response.id > id)
//        return
//
//      // Updated message (or duplicated one), delete old response
//      clearTimeout(response.timeout);
//      delete responses[from];
//
//      // Duplicated message, re-send it
//      if(response.id == id)
//      {
//        sendResponse(response.message, from)
//        return
//      }
//    }
//
//    // It's not a re-try, notify about the connection request
//    self.emit('offer', from, sdp, id)
//  };
//
//  this._connectResponse = function(response)
//  {
//    var id     = response.id;
//    var error  = response.error;
//    var result = response.result;
//
//    var from = response.from;
//
//    var request_ids = requests[from];
//    if(request_ids)
//    {
//      var request = request_ids[id];
//      if(request)
//         request.callback(error, result);
//    }
//  };
//
//
//  /**
//   * Send a request to try to connect to another peer
//   */
//  this._sendRequest = function(request, dest, callback)
//  {
//    // Store the response to prevent duplicates
//    if(callback)
//    {
//      var id = request.id = HandshakeConnector.requestID++;
//
//      var request_ids = requests[dest] = requests[dest] || {};
//
//      var request_id = request_ids[id] =
//      {
//        request: request,
//        callback: dispatchCallback,
//        error_tries: 0
//      };
//
//      function dispatchCallback(error, result)
//      {
//        clearTimeout(request_id.timeout);
//
//        delete request_ids[id];
//        if(!Object.keys(request_ids).length)
//          delete requests[dest];
//
//        callback(error, result);
//      }
//
//      function dispatchRequest()
//      {
//        request_id.timeout = setTimeout(function()
//        {
//          request_id.error_tries++;
//
//          if(request_id.error_tries < HandshakeConnector.MAX_ALLOWED_ERROR_TRIES)
//          {
//            dispatchRequest();
//            send(request, dest);
//          }
//
//          // Max number of re-try achieved, raise error
//          else
//            dispatchCallback(new Error('Timed Out'))
//        },
//        HandshakeConnector.BASE_TIMEOUT * Math.pow(2, request_id.error_tries));
//      }
//
//      dispatchRequest();
//    }
//
//    // Send request
//    send(request, dest);
//  };
//
//  /**
//   * Send a response to a peer trying to connect to us
//   */
//  function sendResponse(response, dest)
//  {
//    // Store the response to prevent duplicates
//    responses[dest] = {message: response};
//    responses[dest].timeout = setTimeout(function()
//    {
//      delete responses[dest];
//    },
//    HandshakeConnector.BASE_TIMEOUT * Math.pow(2, HandshakeConnector.MAX_ALLOWED_ERROR_TRIES));
//
//    // Send response
//    send(response, dest);
//  };
};
Manager.prototype.__proto__   = EventEmitter.prototype;
Manager.prototype.constructor = Manager;


module.exports = Manager;
},{"events":12}],11:[function(require,module,exports){
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
},{"../connectors/core/DataChannel":5,"./Manager":10}],12:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      console.trace();
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[8])
(8)
});
;