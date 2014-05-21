var EventEmitter = require("events").EventEmitter;

var inherits = require('inherits');
var freeice  = require('freeice');
var uuid     = require('uuid');
var wrtc     = require('wrtc');

var RTCPeerConnection     = wrtc.RTCPeerConnection;
var RTCSessionDescription = wrtc.RTCSessionDescription;

require("process-events-shim");

var HandshakeManager = require('./managers/HandshakeManager');
var PeersManager     = require('./managers/PeersManager');

var MessagePacker = require('./MessagePacker');


const MAX_TTL_DEFAULT = 5;


function noop(error)
{
  if(error) console.error(error);
};



/**
 * @classdesc Init and connect to the WebP2P.io network
 *
 * @constructor
 */
function WebP2P(options)
{
  var self = this;


  options = options || {};

  // Internal options
  var commonLabels      = options.commonLabels || [];
  var handshake_servers = options.handshake_servers;
  var iceServers        = freeice(options.iceServers);

  // Read-only options
  Object.defineProperty(this, "routingLabel",
  {
    value: options.routingLabel || "webp2p"
  });
  Object.defineProperty(this, "sessionID",
  {
    value: options.sessionID || uuid.v4()
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
      {iceServers: iceServers},
      {optional: [{DtlsSrtpKeyAgreement: true}]}
    );

    pc.addEventListener('icecandidate', function(event)
    {
      // There's a candidate, ignore it
      if(event.candidate) return;

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
        var channels = pc._channels || [];

        peersManager.add(sessionID, pc, channels);

        var offer = offers[sessionID];
        if(offer)
        {
          delete offers[sessionID];

          offer.callback(null, pc, channels);
        };

        self.emit('peerconnection', pc, channels);
      };
    });

    // Set ID of the PeerConnection
    Object.defineProperty(pc, "sessionID", {value : sessionID});

    return pc;
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

    // Don't connect to ourself
    if(dest == self.sessionID)
      return callback(new Error("Connecting to ourself"));

    // Check if we are already connected to the requested peer
    var pc = peersManager.get(dest);
    if(pc)
    {
      // We are already connected to that peer, ignore the request
      var message = "["+self.sessionID+"] Already connected to "+dest;
      console.log(message);

      // [ToDo] AddChannels(pc, labels);

      var channels = pc._channels || [];

      callback(null, pc, channels);

      return;
    };

    // Check if we are already trying to connect to that peer
    var offer = offers[dest];
    if(offer)
    {
      // We are already trying to connect to that peer, ignore the request
      var message = "["+self.sessionID+"] Already requested connection to "+dest;
      console.log(message);

      var pc = offer.peerConnection;

      // [ToDo] AddChannels(pc, labels);

      pc.addEventListener('signalingstatechange', function(event)
      {
        if(pc.signalingState == 'stable')
        {
          var channels = pc._channels || [];

          callback(null, pc, channels);
        }
      });

      return;
    };

    // Request to connect to a new peer, generate the offer
    generateOffer(dest, [handshakeManager, peersManager], labels, callback);
  };


  //
  // Managers
  //

  function forward(message, connector)
  {
    var from = message.from;
    var dest = message.dest;

    // Message was for us, raise error
    if(dest == self.sessionID)
      return console.error('Ignored message send to us', message);

    // Don't forward the message if TTL has been achieved
    if(--message.ttl <= 0)
      return console.warn("TTL achieved:",message);

    var dest = message.dest;

    message = message.pack();

    // Search the peer between the ones currently connected so we can send the
    // message directly to it
    for(var i=0, peer; peer=peersManager._connectors[i]; i++)
      if(peer.sessionID == dest)
        return peer.send(message);

    // Peer was not found, forward message to all the connectors except the one
    // where we received it
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


  /**
   * Check if it's a request from a peer we are already connected or trying to
   * connect to, so we can prevent to do crossed connections
   *
   * @param from - ID of the other peer
   *
   * @returns {Boolean} - If we are already connected or trying to connect
   */
  function connectionProcessed(from)
  {
    // Check if we are already connected to the requester peer
    var peer = peersManager.get(from);
    if(peer)
    {
      // [ToDo] AddChannels(peer, labels);

      // We are already connected to that peer, send an error to the other end
      var message = "["+self.sessionID+"] Already connected to "+from;
      console.log(message);

      var error =
      {
        code: -1,
        message: message,
        ttl: MAX_TTL_DEFAULT
      };
      return error;
    };

    // Check if we are already trying to connect to that peer
    var offer = offers[from];
    if(offer)
    {
      // [ToDo] AddChannels(offer.peerConnection, labels);

      // We are already trying to connect to that peer, ignore the request
      var message = "["+self.sessionID+"] Already requested connection to "+from;
      console.log(message);

      // We have higher precedence, send an error to the other end
      if(self.sessionID < from)
      {
        console.log("["+self.sessionID+"] Higher precedence than "+from+", sending error");

        var error =
        {
          code: -2,
          message: message,
          ttl: MAX_TTL_DEFAULT
        };
        return error;
      }

      // We have less precedence, cancel our connection request and prepare to use the
      // incoming one with the previous callback
      delete offers[from];

      messagepacker.cancel(offer.message);
      offer.peerConnection.close();

      console.debug("["+self.sessionID+"] Lower precedence than "+from+", request canceled");

      return offer.callback;
    };

    // Connection request is a genuinely new one, process it as usual
  };


    //
    // Protocol messages
    //

  function onpresence(from, connector)
  {
    // Check if we are already connected to the new peer
    var peer = peersManager.get(from);
    if(peer) return;

    // Check if we are already trying to connect to the new peer
    var offer = offers[from];
    if(offer) return;

    var pc = generateOffer(from, connector);

    pc.addEventListener('signalingstatechange', function(event)
    {
      // If PeerConnection object gets open, increase number of connections
      // fetch over this connector so it can decide if it could close
      if(pc.signalingState == 'stable')
        connector.increaseConnections();
    });
  };

  function onoffer(request, connector)
  {
    var from = request.from;
    var dest = request.dest;

    // Message is for us
    if(dest == self.sessionID)
    {
      console.log("["+dest+"] Received connection request from "+from);

      // If connection is already processed, send an error to the other end
      var processed = connectionProcessed(from);
      if(processed && processed.code)
        return request.reply(processed);

      // Search the peer between the list of currently connected ones,
      // or create it if it's not connected
      var pc = createPeerConnection(from, "answer", function(answer)
      {
        var response =
        {
          sdp: answer,
          ttl: MAX_TTL_DEFAULT
        };

        // Send back the connection request over the same connector, since
        // this should be the shortest path to connect both peers
        request.reply(null, response);
      });

      // Process offer & generate answer
      pc.setRemoteDescription(new RTCSessionDescription(
      {
        sdp:  request.sdp,
        type: 'offer'
      }),
      function()
      {
        pc.createAnswer(function(answer)
        {
          pc.setLocalDescription(answer, null, onerror);
        },
        onerror)
      },
      onerror);

      if(processed)
        pc.addEventListener('signalingstatechange', function(event)
        {
          if(pc.signalingState == 'stable')
          {
            var channels = pc._channels || [];

            processed(null, pc, channels);
          }
        });

      pc.addEventListener('datachannel', function(event)
      {
        var channel = event.channel;

        console.info('datachannel', from, channel);

        var channels = pc._channels || [];

        channels.push(channel);

        pc._channels = channels;
      });
    }

    // Forward message
    else
      forward(request, connector);
  };


  function generateOffer(dest, connector, labels, callback)
  {
    var pc = createPeerConnection(dest, "offer", function(offer)
    {
      var ttl = callback ? 5 : 1;

      callback = callback || noop;

      var request = messagepacker.offer(dest, offer, ttl, function(error, result)
      {
        if(error) return callback(error);

        processAnswer(result);
      });

      offers[dest] =
      {
        callback: callback,
        message: request,
        peerConnection: pc
      };

      if(connector instanceof Array)
        connector.forEach(function(c)
        {
          c.send(request);
        });

      // Send back the connection request over the same connector, since this
      // should be the shortest path to connect both peers
      else
        connector.send(request);
    });

    //
    // Init PeerConnection
    //

    // Set channels for this PeerConnection object
    labels = [self.routingLabel].concat(commonLabels, labels);

    var channels = pc._channels = [];

    for(var i=0, label; label=labels[i]; i++)
    {
      var channel = pc.createDataChannel(label);

      channels.push(channel);

      channel.addEventListener('close', function(event)
      {
        channels.splice(channels.indexOf(channel), 1);
      });
    };

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
      pc.setLocalDescription(offer, null, onerror);
    },
    onerror,
    mediaConstraints);

    return pc;
  };

  function processAnswer(response)
  {
    var from = response.from;

    console.debug('['+self.sessionID+'] Received answer from '+from);

    var offer = offers[from];
    if(offer)
      offer.peerConnection.setRemoteDescription(new RTCSessionDescription(
      {
        sdp:  response.sdp,
        type: 'answer'
      }),
      null, onerror);
    else
      console.warn("["+self.sessionID+"] Connection with peer '" + from + "' was not previously requested");
  };


    //
    // Manager events
    //

  function initManagerEvents(manager)
  {
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
//    manager.on('error', onerror);

    manager.on('offer',  onoffer);
    manager.on('answer', forward);
    manager.on('error',  forward);
  };

  // Init managers events

  initManagerEvents(handshakeManager);
  initManagerEvents(peersManager);

  handshakeManager.on('presence', onpresence);


  //
  // Clossing functions
  //

  this.close = function()
  {
    handshakeManager.close();
    peersManager.close();

    messagepacker.cancel();
  };

  // Close all connections when user goes out of the page or app is clossed
  process.on('exit', function(code)
  {
    self.close();
  });
};
inherits(WebP2P, EventEmitter);


module.exports = WebP2P;
