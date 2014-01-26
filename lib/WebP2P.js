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

  this.__defineGetter__("status", function()
  {
    if(peersManager.status == 'connected')
      return 'connected'

    return handshakeManager.status
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
        delete offers[sessionID];

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
        var message = messagepacker.offer(dest, offer, callback);

        offers[dest] =
        {
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
    {
      console.warning("TTL achieved: "+message);
      return;
    };

    var dest = message.dest;

    message = message.pack();

    // Search the peer between the ones currently connected
    for(var i=0, peer; peer=peersManager._connectors[i]; i++)
      if(peer.sessionID == dest)
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
        // Add PeerConnection object to available ones when gets open
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