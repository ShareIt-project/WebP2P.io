/**
 * @classdesc Manager of the communications with the other peers
 * @constructor
 * @param {String} [stun_server="stun.l.google.com:19302"] URL of the server
 * used for the STUN communications.
 */
function WebP2P(options)
{
  //Fallbacks for vendor-specific variables until the spec is finalized.
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;


  /**
   * UUID generator
   */
  var UUIDv4 = function b(a)
  {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
  };


  var self = this;

  var peers = {};


  var options = options || {};

  var handshake_servers = options.handshake_servers;
  var stun_server       = options.stun_server || 'stun.l.google.com:19302';

  this.commonLabels = options.commonLabels || []
  this.routingLabel = options.routingLabel || "webp2p";
  this.uid          = options.uid          || UUIDv4();


  /**
   *  Close PeerConnection object if there are no open channels
   */
  function closePeer(peer)
  {
    if(!Object.keys(peer.channels).length)
      peer.close();
  }

  function disconnected()
  {
    if(self.status == 'disconnected')
    {
      var event = document.createEvent("Event");
          event.initEvent('disconnected',true,true);

      self.dispatchEvent(event);
    }
  }


  /**
   * Create a new RTCPeerConnection
   * @param {UUID} id Identifier of the other peer so later can be accessed.
   * @return {RTCPeerConnection}
   */
  function createPeerConnection(uid, incomingChannel)
  {
    var pc = peers[uid] = new RTCPeerConnection(
    {
      iceServers: [{url: 'stun:'+stun_server}]
    },
    {
      optional: [{RtpDataChannels: true}]
    });

    pc.onerror = function(error)
    {
      console.error(error);
    };
    pc.onicecandidate = function(event)
    {
      if(event.candidate)
        incomingChannel.sendCandidate(uid, event.candidate);
    }
    pc.onstatechange = function(event)
    {
      // Remove the peer from the list of peers when gets closed
      if(event.target.readyState == 'closed')
      {
        delete peers[uid];

        var event = document.createEvent("Event");
            event.initEvent('peerConnection.disconnected',true,true);
            event.peerConnection = pc;

        self.dispatchEvent(event);

        disconnected()
      }
    };

    applyChannelsShim(pc)

    pc.addEventListener('datachannel', function(event)
    {
      var channel = event.channel

      channel.addEventListener('close', function(event)
      {
        closePeer(pc)
      });

      // Routing DataChannel, just init routing functionality on it
      if(channel.label == self.routingLabel)
        initDataChannel_routing(pc, channel, uid)
    });

//    pc.onopen = function(event)
    {
      var event = document.createEvent("Event");
          event.initEvent('peerconnection',true,true);
          event.peerconnection = pc
          event.uid = uid

      self.dispatchEvent(event);
    }

    return pc;
  }

  /**
   * Initialize a {RTCDataChannel} when gets open and notify it
   * @param {RTCPeerConnection} pc PeerConnection owner of the DataChannel.
   * @param {RTCDataChannel} channel Communication channel with the other peer.
   */
  function initDataChannel_routing(pc, channel, uid)
  {
    channel.addEventListener('error', function(event)
    {
      console.error(event)
    });

    // Adapt DataChannel to be compatible with handshake connectors
    EventTarget.call(channel)

    channel.onmessage = function(event)
    {
      event = JSON.parse(event)
      event.from = channel.uid

      self.dispatchEvent(event);
    }
    channel.sendData = function(data, dest)
    {
      data.dest = dest

      channel.send(JSON.stringify(data));
    }

    Transport_Routing_init(channel, self, uid);
  }


  /**
   * Process the offer to connect to a new peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @return {RTCPeerConnection} The (newly created) peer.
   */
  this.onoffer = function(uid, sdp, incomingChannel, callback)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new channel
    if(!peer)
      peer = createPeerConnection(uid, incomingChannel);

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
        peer.setLocalDescription(answer,
        function()
        {
          callback(null, answer.sdp)
        },
        function(error)
        {
          callback(error, answer.sdp)
        });
      },
      callback)
    },
    callback);
  };

  /**
   * Process the answer received while attempting to connect to the other peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @param {Function} onerror Callback called if we don't have previously
   * wanted to connect to the other peer.
   */
  this.onanswer = function(uid, sdp, callback)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.setRemoteDescription(new RTCSessionDescription(
      {
        sdp: sdp,
        type: 'answer'
      }),
      callback,
      callback);

    else
      callback("PeerConnection '" + uid + "' not found");
  };

  this.oncandidate = function(uid, sdp, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.addIceCandidate(new RTCIceCandidate(sdp));
    else if(onerror)
      onerror(uid);
  }


  // Init handshake manager
  var handshakeManager = new HandshakeManager(this.uid);

  if(handshake_servers)
  {
    if(handshake_servers instanceof Array)
      handshakeManager.addConfigs_byArray(handshake_servers)
    else
      handshakeManager.addConfigs_byUri(handshake_servers)
  };

  handshakeManager.onerror = function(event)
  {
    var event2 = document.createEvent("Event");
        event2.initEvent('error',true,true);
        event2.error = event.error

    self.dispatchEvent(event2);
  };
  handshakeManager.onconnected = function(event)
  {
    var channel = event.channel
    Transport_Presence_init(channel, self)

    var event2 = document.createEvent("Event");
        event2.initEvent('connected',true,true);
        event2.uid = self.uid

    self.dispatchEvent(event2);
  };
  handshakeManager.addEventListener('disconnected', function()
  {
    var event = document.createEvent("Event");
        event.initEvent('handshakeManager.disconnected',true,true);
        event.handshakeManager = handshakeManager;

    self.dispatchEvent(event);

    disconnected();
  });


  this.close = function()
  {
    handshakeManager.close();

    for(var i=0, peer; peer=peers[i]; i++)
      peer.close();
  }


  this.__defineGetter__("status", function()
  {
    if(Object.keys(peers).length)
      return 'connected'

    return handshakeManager.status
  })

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   * @param {UUID} uid Identifier of the other peer to be connected.
   * @param {MessageChannel} incomingChannel Optional channel where to
   * @param {Function(error, channel)} callback Callback
   * send the offer. If not defined send it to all connected peers.
   */
  this.connectTo = function(uid, labels, incomingChannel, callback)
  {
    if(!labels)
      labels = []

    var createOffer = false

    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new one with a routing channel
    if(!peer)
    {
      createOffer = true

      // Create PeerConnection
      peer = createPeerConnection(uid, incomingChannel);

      peer.channels[this.routingLabel] = peer.createDataChannel(this.routingLabel);
      initDataChannel_routing(peer, peer.channels[this.routingLabel], uid);
    }

    // Add channels
    labels = this.commonLabels.concat(labels)

    for(var i=0, label; label=labels[i]; i++)
    {
      var channel = peer.channels[label]

      // Channel doesn't exists, create and initialize it
      if(!channel)
      {
        createOffer = true

        // Create new DataChannel
        channel = peer.createDataChannel(label);
        peer.channels[label] = channel

        // Dispatch new DataChannel to the application
        var event = document.createEvent("Event");
            event.initEvent('datachannel',true,true);
            event.channel = channel
        peer.dispatchEvent(event);
      }
    }

    function onerror(error)
    {
      callback(error)
    }

    // Send offer to new PeerConnection if connection characteristics changed
    if(createOffer)
    {
      var mediaConstraints =
      {
        mandatory:
        {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
        }
      }

      peer.createOffer(function(offer)
      {
        // Send the offer only for the incoming channel
//        if(peer.channels[this.routingLabel])
        if(incomingChannel)
           incomingChannel.sendOffer(uid, offer.sdp);

        // Send the offer throught all the peers
        else
          for(var id in peers)
            peers[id].channels[this.routingLabel].sendOffer(uid, offer.sdp);

        // Set the peer local description
        peer.setLocalDescription(offer, callback, onerror);
      },
      onerror,
      mediaConstraints);
    }

    else
      callback();
  };

  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getPeers = function()
  {
    return peers
  }
}
WebP2P.prototype = new EventTarget();

exports.WebP2P = WebP2P;