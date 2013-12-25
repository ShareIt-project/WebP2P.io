;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  Object.defineProperty(this, "uid",
  {
    value: options.uid || UUIDv4()
  });

  this.__defineGetter__("status", function()
  {
    if(peersManager.status == 'connected')
      return 'connected'

    return handshakeManager.status
  });


  function disconnected()
  {
    if(self.status == 'disconnected')
      self.dispatchEvent(new Event('disconnected'));
  }

  function onerror(error)
  {
    console.error(error);
  };


  //
  // Connection methods
  //

  /**
   * Callback to send the offer. If not defined send it to all connected peers.
   *
   * @callback WebP2P~ConnectToCallback
   * @param {Error} error
   * @param {RTCPeerConnection} peer - The (newly created) peer.
   */

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   *
   * @param {UUID} uid - Identifier of the other peer to be connected.
   * @param {string[]} [labels] - Per-connection labels
   * @param {WebP2P~ConnectToCallback} callback
   */
  this.connectTo = function(uid, labels, callback)
  {
    // Fix the optional parameters
    if(typeof labels == 'function')
    {
      if(callback)
        throw SyntaxError("Nothing can be defined after the callback");

      callback = options;
      labels = [];
    };

    connectTo(uid, null, labels, callback);
  };

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   *
   * @private
   *
   * @param {UUID} uid - Identifier of the other peer to be connected.
   * @param {HandshakeConnector} connector - Optional connector where to
   * @param {string[]} labels - Per-connection labels
   * @param {WebP2P~ConnectToCallback} callback
   */
  function connectTo(uid, connector, labels, callback)
  {
    // Flag to check if we should create the offer or not
    var createOffer = false;

    // If peer is not currently connected, create a new one with a routing connector
    var peer = peersManager.get(uid);
    if(!peer)
    {
      createOffer = true;

      // Create PeerConnection
      peer = peersManager.create(uid, connector, this.routingLabel);
    };

    // Add the requested channels to be connected to the list of common ones for
    // this PeerConnection
    labels = commonLabels.concat(labels);

    for(var i=0, label; label=labels[i]; i++)
    {
      // If channel doesn't exists, create and initialize it
      var channel = peer.channels[label]
      if(!channel)
      {
        createOffer = true;

        // Create new DataChannel
        peer.channels[label] = channel = peer.createDataChannel(label);

        // Dispatch new DataChannel event to the application
        var event = new Event('datachannel');
            event.channel = channel;

        peer.dispatchEvent(event);
      };
    };

    // Connection characteristics changed, send offer to the other (new) peer
    if(createOffer)
    {
      var mediaConstraints =
      {
        mandatory:
        {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
        }
      };

      peer.createOffer(function(offer)
      {
        // Set the peer local description
        peer.setLocalDescription(offer,
        function()
        {
          console.log("Generated Offer LocalDescription for UID "+uid);

          if(callback)
             callback(null, peer);
        },
        callback);
      },
      callback,
      mediaConstraints);
    }

    // Connection has not changed, just notify to the application
    else if(callback)
      callback(null, peer);
  };

  /**
   * Process the offer to connect to a new peer
   *
   * @param {UUID}   uid - Identifier of the other peer.
   * @param {string} sdp - Session Description Protocol data of the other peer.
   *
   * @return {RTCPeerConnection} The (newly created) peer.
   */
  function connectRequest(uid, sdp, connector)
  {
    console.log("Received connection request from "+uid);

    // Search the peer between the list of currently connected ones,
    // or create it if it's not connected
    var peer = peersManager.getOrCreate(uid, connector);

    // Process offer
    peer.setRemoteDescription(new RTCSessionDescription(
    {
      sdp: sdp,
      type: 'offer'
    }),
    function()
    {
      // Send answer
      peer.createAnswer(function(answer)
      {
        // Set the peer local description
        peer.setLocalDescription(answer,
        function()
        {
          console.log("Generated Answer LocalDescription for UID "+uid);
        },
        onerror);
      },
      onerror)
    },
    onerror);
  };

  /**
   * Process the answer received while attempting to connect to the other peer
   *
   * @param {UUID} uid - Identifier of the other peer.
   * @param {String} sdp - Session Description Protocol data of the other peer.
   */
  function connectResponse(uid, sdp)
  {
    console.log("Received connection response from "+uid);

    // Search the peer on the list of currently connected ones
    var peer = peersManager.get(uid);
    if(peer)
      peer.setRemoteDescription(new RTCSessionDescription(
      {
        sdp: sdp,
        type: 'answer'
      }),
      function()
      {
        console.log("Successfuly generated RemoteDescription for UID "+uid);
      },
      onerror);

    else
      onerror("Connection with peer '" + uid + "' was not previously requested");
  };


  //
  // Handshake manager
  //

  var handshakeManager = new HandshakeManager(this.uid);

  if(handshake_servers)
  {
    if(handshake_servers instanceof Array)
      handshakeManager.addConfigs_byArray(handshake_servers)
    else
      handshakeManager.addConfigs_byUri(handshake_servers)
  };

  handshakeManager.onconnected = function(event)
  {
    var connector = event.connector;

    var event2 = new Event('connected');
        event2.uid = self.uid;

    self.dispatchEvent(event2);
  };
  handshakeManager.onpresence = function(event)
  {
    var from      = event.from;
    var connector = event.connector;

    connectTo(from, connector, [], function(error)
    {
      if(error)
        console.error(from, connector, error);

      else
      {
        // Increase the number of connections reached throught
        // this handshake server
        connector.connections++;

        // Close connection with handshake server if we got its quota of peers
        if(connector.connections == connector.max_connections)
           connector.close();
      }
    });
  };
  handshakeManager.onforward = function(event)
  {
    peersManager.forward(event.message, event.connector);
  };
  handshakeManager.ondisconnected = function(event)
  {
    var event2 = document.createEvent("Event");
        event2.initEvent('handshakeManager.disconnected',true,true);
        event2.handshakeManager = handshakeManager;

    self.dispatchEvent(event2);

    disconnected();
  };
  handshakeManager.onerror = function(error)
  {
    self.dispatchEvent(error);
  };


  //
  // Peers manager
  //

  var peersManager = new PeersManager();

  peersManager.onconnected = function(event)
  {

  };
  peersManager.onforward = function(event)
  {

  };
  peersManager.ondisconnected = function(event)
  {

  };
  peersManager.onerror = function(error)
  {
    self.dispatchEvent(error);
  };


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
WebP2P.prototype.__proto__   = EventTarget.prototype;
WebP2P.prototype.constructor = WebP2P;


exports.WebP2P = WebP2P;
},{}]},{},[1])
;