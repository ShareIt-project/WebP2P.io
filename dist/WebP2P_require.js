(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Based on code from RPC-Builder
 */


const ERROR    = 0;
const PRESENCE = 1;
const OFFER    = 2;
const ANSWER   = 3;

const MAX_TTL_DEFAULT = 5;

const BASE_TIMEOUT = 5000;


function MessagePacker(sessionID)
{
  var self = this;

  var requestID = 0;

  var requests  = {};
  var responses = {};


  /**
   * Store the response to prevent to process duplicate request later
   */
  function storeResponse(message, dest, id)
  {
    message.stored = true;

    var response =
    {
      message: message,
      id: id,
      timeout: setTimeout(function()
      {
        clearTimeout(response.timeout);
        delete responses[dest];
      },
      BASE_TIMEOUT)
    };
    responses[dest] = response;
  };


  //
  // Pack & Unpack
  //

  this.pack = function(message, id)
  {
    var result = new Array(6);

    // Type
    var type = message.type;
    switch(type)
    {
      case "presence":
        result[0] = PRESENCE;
      break;

      case "offer":
        result[0] = OFFER;
      break;

      case "answer":
        result[0] = ANSWER;
      break;

      default:
      {
        var error = Error("Unknown message type '"+type+"'");
            error.message = message;

        throw error;
      };
    };

    // From
    result[1] = message.from || sessionID;

    // Offer & Answer

    if(result.type != PRESENCE)
    {
      result[2] = message.dest;
      result[3] = id || requestID++;
      result[4] = Math.min(message.ttl || MAX_TTL_DEFAULT, MAX_TTL_DEFAULT);
      result[5] = message.sdp;
    };

    return result;
  };

  this.unpack = function(message)
  {
    var result = {};

    var from = message[1];
    var id   = message[3];

    // Type
    var type = message[0];
    switch(type)
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
    result.from = from;

    // Offer & Answer

    if(type != PRESENCE)
    {
      result.dest = message[2];
      result.ttl  = message[4];
      result.sdp  = message[5];

      result.pack = function()
      {
        return self.pack(this, id);
      };
    };

    // Dispatch responses callbacks
    if(result.type == 'offer')
    {
      // Check if it's a re-try
      var response = responses[from];
      if(response)
      {
        // Old message, ignore it
        if(response.id > id)
          return;

        // Updated message (or duplicated one), delete old response
        clearTimeout(response.timeout);
        delete responses[from];

        // Duplicated message, re-send it
        if(response.id == id)
        {
          var message = response.message;

          // Store the response to prevent to process duplicate request later
          storeResponse(message, from, id);

          // Return the stored response so it can be directly send back
          return message;
        };
      }
      else
        result.reply = function(dest, sdp)
        {
          var message = self.pack(
          {
            type: "answer",
            dest: dest,
            sdp:  sdp
          }, id);

          // Store the response to prevent to process duplicate request later
          storeResponse(message, dest, id);

          // Return the packed message
          return message;
        };
    };

    if(result.type == 'answer')
    {
      var request_ids = requests[from];
      if(request_ids)
      {
        var request = request_ids[id];
        if(request)
        {
          request.callback(error, result);

          // Return undefined to notify message has been procesed
          return;
        };
      };
    };

    // Return unpacked message
    return result;
  };


  //
  // Application dependent messages
  //

  this.presence = function()
  {
    var message = this.pack(
    {
      type: "presence"
    });

    // Return the packed message
    return message;
  };

  this.offer = function(dest, sdp, callback)
  {
    var message = this.pack(
    {
      type: "offer",
      dest: dest,
      sdp:  sdp
    });

    message.cancel = function(){};

    // Store callback if defined to be executed when received the response
    if(callback)
    {
      var request_ids = requests[dest] = requests[dest] || {};

      var id = message[3];

      var request = request_ids[id] =
      {
        message: message,
        callback: dispatchCallback,
        timeout:  setTimeout(function()
        {
          var error = new Error('Timed Out');
              error.request = message;

          dispatchCallback(error)
        },
        BASE_TIMEOUT)
      };

      message.cancel = function()
      {
        clearTimeout(request.timeout);

        delete request_ids[id];
        if(!Object.keys(request_ids).length)
          delete requests[dest];
      };

      function dispatchCallback(error, result)
      {
        message.cancel();

        callback(error, result);
      };
    };

    // Return the packed message
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

  function initChannel(channel)
  {
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

      initChannel(channel);
    };

    // Dispatch events
    dispatchEvent.call(this, event);
  };

  // Add DataChannels created by local PeerConnection object
  var createDataChannel = pc.createDataChannel;
  pc.createDataChannel = function(label, dataChannelDict)
  {
    var channel = createDataChannel.call(this, label, dataChannelDict);

    initChannel(channel);

    return channel;
  };
};


module.exports = applyChannelsShim;

},{}],3:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter;

var RTCPeerConnection = require('wrtc').RTCPeerConnection;
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


  var messagepacker = new MessagePacker(this.sessionID);

  var handshakeManager = new HandshakeManager(messagepacker, handshake_servers);
  var peersManager     = new PeersManager(messagepacker, self.routingLabel);

  this.__defineGetter__('status', function()
  {
    if(peersManager.status == 'connected')
      return 'connected';

    return handshakeManager.status;
  });

  this.__defineGetter__("peers", function()
  {
    return peersManager.peers;
  });


  function onerror(error)
  {
    self.emit('error', new Error(error));
  };


  var offers = {};

  /**
   * Create a new RTCPeerConnection
   * @param {UUID} sessionID Identifier of the other peer so later can be accessed.
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

    pc.addEventListener('signalingstatechange', function(event)
    {
      // Add PeerConnection object to available ones when gets open
      if(pc.signalingState == 'stable')
      {
        peersManager.add(sessionID, pc);

        var request = offers[sessionID];
        if(request)
        {
          delete offers[sessionID];

          var callback = request.callback;
          if(callback)
             callback(null, pc);
        };

        self.emit('peerconnection', pc);
      };
    });

    // Set ID of the PeerConnection
    Object.defineProperty(pc, "sessionID", {value : sessionID});

    return pc;
  };


  function initPeerConnection_Offer(pc, labels)
  {
    // Set channels for this PeerConnection object
    labels = [self.routingLabel].concat(commonLabels, labels);

    for(var i=0, label; label=labels[i]; i++)
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
        console.log('['+self.sessionID+'] Offer LocalDescription created and set');
      },
      onerror);
    },
    onerror,
    mediaConstraints);
  };

  function initPeerConnection_Answer(pc, sdp)
  {
    // Process offer
    pc.setRemoteDescription(new RTCSessionDescription(
    {
      sdp:  sdp,
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
          console.log('['+self.sessionID+'] Answer LocalDescription created and set');
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
    if(labels instanceof Function)
    {
      if(callback)
        throw new SyntaxError("Nothing can be defined after the callback");

      callback = labels;
      labels = undefined;
    };

    // Don't connect to uurself
    if(dest == self.sessionID)
    {
      callback(new Error("Connecting to ourself"));
      return;
    }

    var pc = peersManager.get(dest);
    if(pc)
      callback(null, pc)

    else
    {
      pc = createPeerConnection(dest, "offer", function(offer)
      {
        var message = messagepacker.offer(dest, offer, function(error)
        {
          if(error)
            callback(error);
        });

        offers[dest] =
        {
          callback: callback,
          message: message,
          peerConnection: pc
        };

        handshakeManager.send(message);
        peersManager.send(message);
      });

      initPeerConnection_Offer(pc, labels);
    }
  };


  //
  // Managers
  //

  function forward(message, connector)
  {
    // Don't forward the message if TTL has been achieved
    if(--message.ttl <= 0)
      return console.warn("TTL achieved:",message);

    var dest = message.dest;

    message = message.pack();

    // Search the peer between the ones currently connected
    for(var i=0, peer; peer=peersManager._connectors[i]; i++)
      if(peer.sessionID == dest)
        return peer.send(message);

    // Peer was not found, forward message to all the connectors
    peersManager.send(message, connector);
    handshakeManager.send(message, connector);
  };


  handshakeManager.on('connected', function()
  {
    self.emit('handshakeManager.connected', handshakeManager);
  });
  handshakeManager.on('disconnected', function()
  {
    self.emit('handshakeManager.disconnected', handshakeManager);
  });

  peersManager.on('connected', function()
  {
    self.emit('peersManager.connected', peersManager);
  });
  peersManager.on('disconnected', function()
  {
    self.emit('peersManager.disconnected', peersManager);
  });

  function initManagerEvents(manager)
  {
    //
    // Basic events
    //

    manager.on('connected', function()
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

    /**
     * Check if it's a request from a peer we are already connected or trying to
     * connect to, so we can prevent to do crossed connections
     *
     * @param sessionID - ID of the other peer
     *
     * @returns {Boolean} - If we are already connected or trying to connect
     */
    function connectionProcessed(sessionID)
    {
      // Check if we are already connected to the requester peer
      var peer = peersManager.get(sessionID);
      if(peer)
      {
        // We are already connected to that peer, ignore the request
        console.log("["+self.sessionID+"] Already connected to "+sessionID);
        return true;
      };

      // Check if we are already trying to connect to that peer
      var offer = offers[sessionID];
      if(offer)
      {
        // We are already trying to connected to that peer, ignore the request
        console.log("["+self.sessionID+"] Already offered connection to "+sessionID);

        // We have higher precedence, ignore incoming connection request
        if(self.sessionID < sessionID)
          return true;  // Should send an error to the other end

        // We have less precedence, cancel our connection request and prepare to
        // incoming one
        offer.message.cancel();
        offer.peerConnection.close();

        delete offers[sessionID];
      };

      // Connection request is a genuinely new one, process it as usual
      return false;
    };

    manager.on('offer', function(message, connector)
    {
      var from = message.from;
      var dest = message.dest;

      // Ignore messages send by us
      if(from == self.sessionID) return;

      // Message is for us
      if(dest == self.sessionID)
      {
        console.log("["+self.sessionID+"] Received connection request from "+from);

        if(connectionProcessed(from))
          return;

        var request = message;

        // Search the peer between the list of currently connected ones,
        // or create it if it's not connected
        var pc = createPeerConnection(from, "answer", function(answer)
        {
          var message = request.reply(from, answer);

          // Send back the connection request over the same connector, since
          // this should be the shortest path to connect both peers
          connector.send(message);
        });

        initPeerConnection_Answer(pc, message.sdp);
      }

      // Forward message
      else
        forward(message, connector);
    });

    manager.on('answer', function(message, connector)
    {
      var from = message.from;
      var dest = message.dest;

      // Ignore messages send by us
      if(from == self.sessionID) return;

      // Message is for us
      if(dest == self.sessionID)
      {
        console.log("["+self.sessionID+"] Received connection response from "+from);

        var peer = offers[from];
        if(peer)
        {
          peer.peerConnection.setRemoteDescription(new RTCSessionDescription(
          {
            sdp: message.sdp,
            type: 'answer'
          }),
          function()
          {
            console.log("Successfuly generated RemoteDescription for "+from);
          },
          onerror);
        }
        else
          console.warn("["+self.sessionID+"] Connection with peer '" + from + "' was not previously requested");
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
    // Ignore messages send by us
    if(from == self.sessionID) return;

    var peer = peersManager.get(from);
    if(!peer)
    {
      var pc = createPeerConnection(from, "offer", function(offer)
      {
        var message = messagepacker.offer(from, offer);

        offers[from] =
        {
          message: message,
          peerConnection: pc
        };

        // Send back the connection request over the same connector, since this
        // should be the shortest path to connect both peers
        connector.send(message);
      });

      pc.addEventListener('signalingstatechange', function(event)
      {
        // If PeerConnection object gets open, increase number of connections
        // fetch over this connector so it can decide if it could close
        if(pc.signalingState == 'stable')
          connector.increaseConnections();
      });

      initPeerConnection_Offer(pc);
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


module.exports = WebP2P;

},{"./MessagePacker":1,"./PeerConnection_channels.shim":2,"./managers/HandshakeManager":10,"./managers/PeersManager":12,"events":13,"wrtc":14}],4:[function(require,module,exports){
var HandshakeConnector = require("./core/HandshakeConnector");

var PUBNUB = require("pubnub");


/**
 * Handshake connector for PubNub
 * @param {Object} configuration Configuration object.
 */
function Connector_PubNub(config_init, config_mess, max_connections)
{
  HandshakeConnector.call(this, max_connections);

  var self = this;

  var channel = config_mess.channel;


  // Connect a handshake connector to the PubNub server
  var pubnub = PUBNUB.init(config_init);

  // Configure handshake connector
  pubnub.subscribe(
  {
    channel: channel,
    restore: false,
    backfill: false,

    connect:    self._open,
    message:    self._message,
    disconnect: self._close,

    error: function(response)
    {
      self._error(new Error(response ? response.error : 'Undefined error'))
    }
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

    // This shouldn't be necesary, but seems 'disconnect' event is not being
    // dispatched by the PubNub channel, so we close the connector explicitly
    self._close();
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

// Class constants
Connector_PubNub.prototype.max_connections = 50;
Object.defineProperty(Connector_PubNub.prototype, 'max_chars', {value: 1800});


module.exports = Connector_PubNub;

},{"./core/HandshakeConnector":7,"pubnub":15}],5:[function(require,module,exports){
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
},{"events":13}],6:[function(require,module,exports){
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
},{"./Connector":5}],7:[function(require,module,exports){
var Connector = require("./Connector");


function HandshakeConnector(max_connections)
{
  Connector.call(this);

  var self = this;


  if(max_connections != undefined)
    this.max_connections = Math.min(max_connections, this.max_connections);

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
},{"./Connector":5}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
/**
 * New node file
 */
var HandshakeConnector = require('./connectors/core/HandshakeConnector');
var WebP2P             = require('./WebP2P');


module.exports = WebP2P;
module.exports.HandshakeConnector = HandshakeConnector;
},{"./WebP2P":3,"./connectors/core/HandshakeConnector":7}],10:[function(require,module,exports){
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
    var type            = config.type;
    var config_init     = config.config_init;
    var config_mess     = config.config_mess;
    var max_connections = config.max_connections;

    // Check if connector constructor is from a valid handshake server
    var connectorConstructor = handshakeConnectorConstructors[type];
    if(!connectorConstructor)
      throw Error("Invalid handshake server type '" + type + "'");

    var connector = new connectorConstructor(config_init, config_mess, max_connections);

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

    if(connectorConstructor.prototype.max_connections == Number.POSITIVE_INFINITY
    && !config.max_connections)
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
},{"../connectors/PubNub":4,"../errors":8,"./Manager":11}],11:[function(require,module,exports){
var EventEmitter = require("events").EventEmitter;


function Manager(messagepacker)
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
      self._connectors.push(connector);

      if(self._connectors.length == 1)
         self.emit('connected');
    });
    connector.on('close', function()
    {
      self._connectors.splice(self._connectors.indexOf(connector), 1);

      if(self._connectors.length == 0)
         self.emit('disconnected');
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
      message = messagepacker.unpack(message);
      if(message)
      {
        // Response was previously stored, send it directly
        if(message.stored)
          connector.send(message)

        // Normal message, process it
        else
          connector._messageUnpacked(message);
      };
    });
  };


  /**
   * {Object} message - Message to be send
   * {Connector} [incomingConnector] - {Connector} to don't send the message
   */
  this.send = function(message, incomingConnector)
  {
    for(var i=0, connector; connector=this._connectors[i]; i++)
    {
      // Don't send the message to the same connector where we received it
      if(connector === incomingConnector)
        continue;

      connector.send(message);
    };
  };


  /**
   * Close all the connections
   */
  this.close = function()
  {
    for(var i=0, connector; connector=this._connectors[i]; i++)
      connector.close();
  };
};
Manager.prototype.__proto__   = EventEmitter.prototype;
Manager.prototype.constructor = Manager;


module.exports = Manager;
},{"events":13}],12:[function(require,module,exports){
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
          break;
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
},{"../connectors/core/DataChannel":6,"./Manager":11}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
var RTCIceCandidate       = window.mozRTCIceCandidate       || window.webkitRTCIceCandidate       || window.RTCIceCandidate;
var RTCPeerConnection     = window.mozRTCPeerConnection     || window.webkitRTCPeerConnection     || window.RTCPeerConnection;
var RTCSessionDescription = window.mozRTCSessionDescription || window.webkitRTCSessionDescription || window.RTCSessionDescription;


exports.RTCIceCandidate       = RTCIceCandidate;
exports.RTCPeerConnection     = RTCPeerConnection;
exports.RTCSessionDescription = RTCSessionDescription;
},{}],15:[function(require,module,exports){
// Version: 3.5.48
(function(){
var j=!0,t=null,u=!1;function x(){return function(){}}
window.JSON&&window.JSON.stringify||function(){function a(){try{return this.valueOf()}catch(a){return t}}function c(a){d.lastIndex=0;return d.test(a)?'"'+a.replace(d,function(a){var b=H[a];return"string"===typeof b?b:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+a+'"'}function b(d,h){var p,f,q,r,i,k=e,g=h[d];g&&"object"===typeof g&&(g=a.call(g));"function"===typeof m&&(g=m.call(h,d,g));switch(typeof g){case "string":return c(g);case "number":return isFinite(g)?String(g):"null";case "boolean":case "null":return String(g);
case "object":if(!g)return"null";e+=s;i=[];if("[object Array]"===Object.prototype.toString.apply(g)){r=g.length;for(p=0;p<r;p+=1)i[p]=b(p,g)||"null";q=0===i.length?"[]":e?"[\n"+e+i.join(",\n"+e)+"\n"+k+"]":"["+i.join(",")+"]";e=k;return q}if(m&&"object"===typeof m){r=m.length;for(p=0;p<r;p+=1)f=m[p],"string"===typeof f&&(q=b(f,g))&&i.push(c(f)+(e?": ":":")+q)}else for(f in g)Object.hasOwnProperty.call(g,f)&&(q=b(f,g))&&i.push(c(f)+(e?": ":":")+q);q=0===i.length?"{}":e?"{\n"+e+i.join(",\n"+e)+"\n"+
k+"}":"{"+i.join(",")+"}";e=k;return q}}window.JSON||(window.JSON={});var d=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,e,s,H={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"},m;"function"!==typeof JSON.stringify&&(JSON.stringify=function(a,c,d){var f;s=e="";if("number"===typeof d)for(f=0;f<d;f+=1)s+=" ";else"string"===typeof d&&(s=d);if((m=c)&&"function"!==typeof c&&("object"!==typeof c||"number"!==
typeof c.length))throw Error("JSON.stringify");return b("",{"":a})});"function"!==typeof JSON.parse&&(JSON.parse=function(a){return eval("("+a+")")})}();var aa=1,C=u,ba=[],G="-pnpres",I=1E3,ca="/",da="&",fa=/{([\w\-]+)}/g;function ga(){return"x"+ ++aa+""+ +new Date}function J(){return+new Date}var P,ha=Math.floor(20*Math.random());P=function(a,c){return 0<a.indexOf("pubsub.")&&a.replace("pubsub","ps"+(c?ja().split("-")[0]:20>++ha?ha:ha=1))||a};
function ka(a,c){var b=a.join(ca),d=[];if(!c)return b;Q(c,function(a,b){"undefined"!=typeof b&&(b!=t&&0<encodeURIComponent(b).length)&&d.push(a+"="+encodeURIComponent(b))});return b+="?"+d.join(da)}function la(a,c){function b(){e+c>J()?(clearTimeout(d),d=setTimeout(b,c)):(e=J(),a())}var d,e=0;return b}function na(a,c){var b=[];Q(a||[],function(a){c(a)&&b.push(a)});return b}function oa(a,c){return a.replace(fa,function(a,d){return c[d]||a})}
function ja(a){var c="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(a){var c=16*Math.random()|0;return("x"==a?c:c&3|8).toString(16)});a&&a(c);return c}function Q(a,c){if(a&&c)if("undefined"!=typeof a[0])for(var b=0,d=a.length;b<d;)c.call(a[b],a[b],b++);else for(b in a)a.hasOwnProperty&&a.hasOwnProperty(b)&&c.call(a[b],b,a[b])}function pa(a,c){var b=[];Q(a||[],function(a,e){b.push(c(a,e))});return b}function qa(a){var c=[];Q(a,function(a,d){d.j&&c.push(a)});return c.sort()}
function ra(){setTimeout(function(){C||(C=1,Q(ba,function(a){a()}))},I)}
if(!window.PUBNUB){var sa=function(a,c){return CryptoJS.HmacSHA256(a,c).toString(CryptoJS.enc.Base64)},ta=function(a){return document.getElementById(a)},ua=function(a){console.error(a)},va=function(a,c){var b=[];Q(a.split(/\s+/),function(a){Q((c||document).getElementsByTagName(a),function(a){b.push(a)})});return b},U=function(a,c,b){Q(a.split(","),function(a){function e(a){a||(a=window.event);b(a)||(a.cancelBubble=j,a.preventDefault&&a.preventDefault(),a.stopPropagation&&a.stopPropagation())}c.addEventListener?
c.addEventListener(a,e,u):c.attachEvent?c.attachEvent("on"+a,e):c["on"+a]=e})},xa=function(){return va("head")[0]},V=function(a,c,b){if(b)a.setAttribute(c,b);else return a&&a.getAttribute&&a.getAttribute(c)},ya=function(a,c){for(var b in c)if(c.hasOwnProperty(b))try{a.style[b]=c[b]+(0<"|width|height|top|left|".indexOf(b)&&"number"==typeof c[b]?"px":"")}catch(d){}},Ba=function(a){return document.createElement(a)},Da=function(){return Ca||W()?0:ga()},Fa=function(a){function c(a,b){M||(M=1,g.onerror=
t,clearTimeout(ea),a||!b||N(b),setTimeout(function(){a&&O();var b=ta(D),c=b&&b.parentNode;c&&c.removeChild(b)},I))}if(Ca||W()){a:{var b,d,e=function(){if(!H){H=1;clearTimeout(L);try{d=JSON.parse(b.responseText)}catch(a){return r(1)}s=1;f(d)}},s=0,H=0,m=a.timeout||1E4,L=setTimeout(function(){r(1)},m),h=a.b||x(),p=a.data||{},f=a.c||x(),q="undefined"===typeof a.g,r=function(a,c){s||(s=1,clearTimeout(L),b&&(b.onerror=b.onload=t,b.abort&&b.abort(),b=t),a&&h(c))};try{b=W()||window.XDomainRequest&&new XDomainRequest||
new XMLHttpRequest;b.onerror=b.onabort=function(){r(1,b.responseText||{error:"Network Connection Error"})};b.onload=b.onloadend=e;b.onreadystatechange=function(){if(b&&4==b.readyState)switch(b.status){case 401:case 402:case 403:try{d=JSON.parse(b.responseText),r(1,d)}catch(a){return r(1,b.responseText)}}};q&&(b.timeout=m);p.pnsdk=Ea;var i=ka(a.url,p);b.open("GET",i,q);b.send()}catch(k){r(0);Ca=0;a=Fa(a);break a}a=r}return a}var g=Ba("script"),e=a.a,D=ga(),M=0,ea=setTimeout(function(){c(1)},a.timeout||
1E4),O=a.b||x(),m=a.data||{},N=a.c||x();window[e]=function(a){c(0,a)};a.g||(g[Ga]=Ga);g.onerror=function(){c(1)};m.pnsdk=Ea;g.src=ka(a.url,m);V(g,"id",D);xa().appendChild(g);return c},Ha=function(){return!("onLine"in navigator)?1:navigator.onLine},W=function(){if(!Ia||!Ia.get)return 0;var a={id:W.id++,send:x(),abort:function(){a.id={}},open:function(c,b){W[a.id]=a;Ia.get(a.id,b)}};return a},Ga="async",Ea="PubNub-JS-Web/3.5.48",Ca=-1==navigator.userAgent.indexOf("MSIE 6");window.console||(window.console=
window.console||{});console.log||(console.log=console.error=(window.opera||{}).postError||x());var Ja,Ka=window.localStorage;Ja={get:function(a){try{return Ka?Ka.getItem(a):-1==document.cookie.indexOf(a)?t:((document.cookie||"").match(RegExp(a+"=([^;]+)"))||[])[1]||t}catch(c){}},set:function(a,c){try{if(Ka)return Ka.setItem(a,c)&&0;document.cookie=a+"="+c+"; expires=Thu, 1 Aug 2030 20:00:00 UTC; path=/"}catch(b){}}};var Y={list:{},unbind:function(a){Y.list[a]=[]},bind:function(a,c){(Y.list[a]=Y.list[a]||
[]).push(c)},fire:function(a,c){Q(Y.list[a]||[],function(a){a(c)})}},Z=ta("pubnub")||0,La=function(a){function c(){}function b(a,b){function c(b){b&&(ia=J()-(b/1E4+(J()-d)/2),a&&a(ia))}var d=J();b&&c(b)||z.time(c)}function d(a,b){R&&R(a,b);R=t}function e(){z.time(function(a){b(x(),a);a||d(1,{error:"Heartbeat failed to connect to Pubnub Servers.Please check your network settings."});setTimeout(e,q)})}function s(){Na()||d(1,{error:"Offline. Please check your network settings. "});setTimeout(s,I)}function H(a){var b=
0;Q(qa(E),function(c){if(c=E[c])b++,(a||x())(c)});return b}function m(a){if(Oa){if(!y.length)return}else{a&&(y.h=0);if(y.h||!y.length)return;y.h=1}A(y.shift())}a.jsonp&&(Ca=0);var L=a.subscribe_key||"";a.uuid||Ja.get(L+"uuid");a.xdr=Fa;a.db=Ja;a.error=ua;a._is_online=Ha;a.jsonp_cb=Da;a.PNSDK=Ea;a.hmac_SHA256=sa;var h,p=+a.windowing||10,f=(+a.timeout||310)*I,q=(+a.keepalive||60)*I,r=a.noleave||0,i=a.publish_key||"demo",k=a.subscribe_key||"demo",g=a.auth_key||"",D=a.secret_key||"",M=a.PNSDK||"",ea=
a.hmac_SHA256,O=a.ssl?"s":"",N="http"+O+"://"+(a.origin||"pubsub.pubnub.com"),K=P(N),wa=P(N),y=[],ia=0,za=0,Aa=0,R=0,ma=0,S=0,E={},Oa=a.no_wait_for_pending,A=a.xdr,l=a.error||x(),Na=a._is_online||function(){return 1},F=a.jsonp_cb||function(){return 0},T=a.db||{get:x(),set:x()},B=a.uuid||T&&T.get(k+"uuid")||"",z={LEAVE:function(a,b,c,d){var X={uuid:B,auth:g},e=P(N),c=c||x(),v=d||x(),d=F();if(0<a.indexOf(G))return j;if(r||!O||"0"==d)return u;"0"!=d&&(X.callback=d);A({g:b||O,timeout:2E3,a:d,data:X,c:function(a){"object"==
typeof a&&a.error?v(a):c(a)},b:v,url:[e,"v2","presence","sub_key",k,"channel",encodeURIComponent(a),"leave"]});return j},history:function(a,b){var b=a.callback||b,c=a.count||a.limit||100,d=a.reverse||"false",X=a.error||x(),e=a.auth_key||g,v=a.channel,w=a.start,h=a.end,n={},i=F();if(!v)return l("Missing Channel");if(!b)return l("Missing Callback");if(!k)return l("Missing Subscribe Key");n.stringtoken="true";n.count=c;n.reverse=d;n.auth=e;i&&(n.callback=i);w&&(n.start=w);h&&(n.end=h);A({a:i,data:n,
c:function(a){"object"==typeof a&&a.error?X(a):b(a)},b:X,url:[K,"v2","history","sub-key",k,"channel",encodeURIComponent(v)]})},replay:function(a){var b=b||a.callback||x(),c=a.auth_key||g,d=a.source,e=a.destination,h=a.stop,v=a.start,w=a.end,Pa=a.reverse,a=a.limit,n=F(),f={};if(!d)return l("Missing Source Channel");if(!e)return l("Missing Destination Channel");if(!i)return l("Missing Publish Key");if(!k)return l("Missing Subscribe Key");"0"!=n&&(f.callback=n);h&&(f.stop="all");Pa&&(f.reverse="true");
v&&(f.start=v);w&&(f.end=w);a&&(f.count=a);f.auth=c;A({a:n,c:function(a){"object"==typeof a&&a.error?err(a):b(a)},b:function(){b([0,"Disconnected"])},url:[K,"v1","replay",i,k,d,e],data:f})},auth:function(a){g=a;c()},time:function(a){var b=F();A({a:b,data:{uuid:B,auth:g},timeout:5*I,url:[K,"time",b],c:function(b){a(b[0])},b:function(){a(0)}})},publish:function(a,b){var b=b||a.callback||x(),c=a.message,d=a.channel,e=a.auth_key||g,h=a.error||x(),v=F(),w="push";a.prepend&&(w="unshift");if(!c)return l("Missing Message");
if(!d)return l("Missing Channel");if(!i)return l("Missing Publish Key");if(!k)return l("Missing Subscribe Key");c=JSON.stringify(c);y[w]({a:v,timeout:5*I,url:[K,"publish",i,k,0,encodeURIComponent(d),v,encodeURIComponent(c)],data:{uuid:B,auth:e},b:function(a){h(a);m(1)},c:function(a){"object"==typeof a&&a.error?h(a):b(a);m(1)}});m()},unsubscribe:function(a,b){var d=a.channel,b=b||a.callback||x(),e=a.error||x();S=0;ma=1;d=pa((d.join?d.join(","):""+d).split(","),function(a){if(E[a])return a+","+a+G}).join(",");
Q(d.split(","),function(a){var c=j;a&&(C&&(c=z.LEAVE(a,0,b,e)),c||b({action:"leave"}),E[a]=0)});c()},subscribe:function(a,b){function e(a){a?setTimeout(c,I):(K=P(N,1),wa=P(N,1),setTimeout(function(){z.time(e)},I));H(function(b){if(a&&b.d)return b.d=0,b.m(b.name);!a&&!b.d&&(b.d=1,b.l(b.name))})}function h(){var a=F(),b=qa(E).join(",");b&&(d(),R=A({timeout:O,a:a,b:function(a){n(a);R=t;z.time(e)},data:{uuid:B,auth:m},url:[wa,"subscribe",k,encodeURIComponent(b),a,S],c:function(a){R=t;if(!a||"object"==
typeof a&&"error"in a&&a.error)return n(a),setTimeout(c,I);r(a[1]);S=!S&&ma&&T.get(k)||a[1];H(function(a){a.f||(a.f=1,a.k(a.name))});y&&(S=1E4,y=0);T.set(k,a[1]);var b,d=(2<a.length?a[2]:pa(E,function(b){return pa(Array(a[0].length).join(",").split(","),function(){return b})}).join(",")).split(",");b=function(){var a=d.shift()||Aa;return[(E[a]||{}).a||za,a.split(G)[0]]};var e=J()-ia-+a[1]/1E4;Q(a[0],function(c){var d=b();d[0](c,a,d[1],e)});setTimeout(h,L)}}))}var i=a.channel,b=(b=b||a.callback)||
a.message,m=a.auth_key||g,v=a.connect||x(),w=a.reconnect||x(),q=a.disconnect||x(),n=a.error||x(),r=a.idle||x(),s=a.presence||0,D=a.noheresync||0,y=a.backfill||0,M=a.timetoken||0,O=a.timeout||f,L=a.windowing||p;ma=a.restore;S=M;if(!i)return l("Missing Channel");if(!b)return l("Missing Callback");if(!k)return l("Missing Subscribe Key");Q((i.join?i.join(","):""+i).split(","),function(a){var c=E[a]||{};E[Aa=a]={name:a,f:c.f,d:c.d,j:1,a:za=b,k:v,l:q,m:w};s&&(z.subscribe({channel:a+G,callback:s}),!c.j&&
!D&&z.here_now({channel:a,callback:function(b){Q("uuids"in b?b.uuids:[],function(c){s({action:"join",uuid:c,timestamp:J(),occupancy:b.occupancy||1},b,a)})}}))});c=function(){d();setTimeout(h,L)};if(!C)return ba.push(c);c()},here_now:function(a,b){var b=a.callback||b,c=a.error||x(),d=a.auth_key||g,e=a.channel,h=F(),d={uuid:B,auth:d};if(!e)return l("Missing Channel");if(!b)return l("Missing Callback");if(!k)return l("Missing Subscribe Key");"0"!=h&&(d.callback=h);A({a:h,data:d,c:function(a){"object"==
typeof a&&a.error?c(a):b(a)},b:c,url:[K,"v2","presence","sub_key",k,"channel",encodeURIComponent(e)]})},grant:function(a,b){var b=a.callback||b,c=a.error||x(),d=a.channel,e=F(),h=a.ttl||-1,g=a.read?"1":"0",w=a.write?"1":"0",f=a.auth_key;if(!d)return l("Missing Channel");if(!b)return l("Missing Callback");if(!k)return l("Missing Subscribe Key");if(!i)return l("Missing Publish Key");if(!D)return l("Missing Secret Key");"0"!=e&&(n.callback=e);var n=Math.floor((new Date).getTime()/1E3),m=ea(k+"\n"+i+
"\ngrant\n"+(f&&0<encodeURIComponent(f).length?"auth="+encodeURIComponent(f)+"&":"")+"channel="+encodeURIComponent(d)+"&pnsdk="+encodeURIComponent(M)+"&r="+g+"&timestamp="+encodeURIComponent(n)+(-1<h?"&ttl="+h:"")+"&w="+w,D),m=m.replace(/\+/g,"-"),m=m.replace(/\//g,"_"),n={w:w,r:g,signature:m,channel:encodeURIComponent(d),timestamp:n};-1<h&&(n.ttl=h);f&&(n.auth=encodeURIComponent(f));A({a:e,data:n,c:function(a){b(a)},b:c,url:[K,"v1","auth","grant","sub-key",k]})},audit:function(a,b){var b=a.callback||
b,c=a.error||x(),d=a.channel,e=a.auth_key,h=F();if(!b)return l("Missing Callback");if(!k)return l("Missing Subscribe Key");if(!i)return l("Missing Publish Key");if(!D)return l("Missing Secret Key");"0"!=h&&(g.callback=h);var g=Math.floor((new Date).getTime()/1E3),f=k+"\n"+i+"\naudit\n";e&&(f+="auth="+encodeURIComponent(e)+"&");d&&(f+="channel="+encodeURIComponent(d)+"&");var f=f+("pnsdk="+encodeURIComponent(M)+"&timestamp="+g),f=ea(f,D),f=f.replace(/\+/g,"-"),f=f.replace(/\//g,"_"),g={signature:f,
timestamp:g};d&&(g.channel=encodeURIComponent(d));e&&(g.auth=encodeURIComponent(e));A({a:h,data:g,c:function(a){b(a)},b:c,url:[K,"v1","auth","audit","sub-key",k]})},revoke:function(a,b){a.read=u;a.write=u;z.grant(a,b)},set_uuid:function(a){B=a;c()},get_uuid:function(){return B},xdr:A,ready:ra,db:T,uuid:ja,map:pa,each:Q,"each-channel":H,grep:na,offline:function(){d(1)},supplant:oa,now:J,unique:ga,updater:la};B||(B=z.uuid());T.set(k+"uuid",B);setTimeout(s,I);setTimeout(e,q);b();h=z;h.css=ya;h.$=ta;
h.create=Ba;h.bind=U;h.head=xa;h.search=va;h.attr=V;h.events=Y;h.init=La;U("beforeunload",window,function(){h["each-channel"](function(a){h.LEAVE(a.name,0)});return j});if(a.notest)return h;U("offline",window,h.offline);U("offline",document,h.offline);return h};"complete"===document.readyState?setTimeout(ra,0):U("load",window,function(){setTimeout(ra,0)});var $=Z||{};PUBNUB=La({notest:1,publish_key:V($,"pub-key"),subscribe_key:V($,"sub-key"),ssl:!document.location.href.indexOf("https")||"on"==V($,
"ssl"),origin:V($,"origin"),uuid:V($,"uuid")});window.jQuery&&(window.jQuery.PUBNUB=PUBNUB);"undefined"!==typeof module&&(module.exports=PUBNUB)&&ra();var Ia=ta("pubnubs")||0;if(Z){ya(Z,{position:"absolute",top:-I});if("opera"in window||V(Z,"flash"))Z.innerHTML="<object id=pubnubs data=https://pubnub.a.ssl.fastly.net/pubnub.swf><param name=movie value=https://pubnub.a.ssl.fastly.net/pubnub.swf><param name=allowscriptaccess value=always></object>";PUBNUB.rdx=function(a,c){if(!c)return W[a].onerror();
W[a].responseText=unescape(c);W[a].onload()};W.id=I}}
var Ma=PUBNUB.ws=function(a,c){if(!(this instanceof Ma))return new Ma(a,c);var b=this,a=b.url=a||"";b.protocol=c||"Sec-WebSocket-Protocol";var d=a.split("/"),d={ssl:"wss:"===d[0],origin:d[2],publish_key:d[3],subscribe_key:d[4],channel:d[5]};b.CONNECTING=0;b.OPEN=1;b.CLOSING=2;b.CLOSED=3;b.CLOSE_NORMAL=1E3;b.CLOSE_GOING_AWAY=1001;b.CLOSE_PROTOCOL_ERROR=1002;b.CLOSE_UNSUPPORTED=1003;b.CLOSE_TOO_LARGE=1004;b.CLOSE_NO_STATUS=1005;b.CLOSE_ABNORMAL=1006;b.onclose=b.onerror=b.onmessage=b.onopen=b.onsend=
x();b.binaryType="";b.extensions="";b.bufferedAmount=0;b.trasnmitting=u;b.buffer=[];b.readyState=b.CONNECTING;if(!a)return b.readyState=b.CLOSED,b.onclose({code:b.CLOSE_ABNORMAL,reason:"Missing URL",wasClean:j}),b;b.e=PUBNUB.init(d);b.e.i=d;b.i=d;b.e.subscribe({restore:u,channel:d.channel,disconnect:b.onerror,reconnect:b.onopen,error:function(){b.onclose({code:b.CLOSE_ABNORMAL,reason:"Missing URL",wasClean:u})},callback:function(a){b.onmessage({data:a})},connect:function(){b.readyState=b.OPEN;b.onopen()}})};
Ma.prototype.send=function(a){var c=this;c.e.publish({channel:c.e.i.channel,message:a,callback:function(a){c.onsend({data:a})}})};
})();

},{}]},{},[9])