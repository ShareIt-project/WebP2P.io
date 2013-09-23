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

  // Internal options
  var handshake_servers = options.handshake_servers;
  var stun_server       = options.stun_server   || 'stun.l.google.com:19302';
  var useTrickleICE     = options.useTrickleICE || true;

  // Read-only options
  var commonLabels = options.commonLabels || []
  var routingLabel = options.routingLabel || "webp2p";
  var ownUid       = options.uid          || UUIDv4();

  this.__defineGetter__("commonLabels", function()
  {
    return commonLabels;
  })

  this.__defineGetter__("routingLabel", function()
  {
    return routingLabel;
  })

  this.__defineGetter__("uid", function()
  {
    return ownUid;
  })


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


  function sendOffer(uid, sdp, incomingChannel)
  {
    console.log("Sending offer to "+uid);

    // Send the offer only over the incoming channel
//    if(peer.channels[routingLabel])
    if(incomingChannel)
       incomingChannel.sendOffer(uid, sdp);

    // Send the offer throught all the peers
    else
      for(var id in peers)
        peers[id].channels[routingLabel].sendOffer(uid, sdp);
  }

  function sendAnswer(dest, sdp, incomingChannel, route)
  {
    console.log("Sending answer to "+dest);

    // Run over all the route peers looking for a possible shortcut
    for(var i=0, route_uid; route_uid=route[i]; i++)
      for(var id in peers)
        if(route_uid == id)
        {
          peers[id]._routing.sendAnswer(dest, sdp, route.slice(0, i-1));
          return;
        }

    // No shortcut was found, send the answer over the incoming channel
    incomingChannel.sendAnswer(dest, sdp, route);
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
    });

    pc.onerror = function(error)
    {
      console.error(error);
    };
    pc.onicecandidate = function(event)
    {
      // There's a candidate, if using Trickle ICE send it
      if(event.candidate)
      {
        if(useTrickleICE)
          incomingChannel.sendCandidate(uid, event.candidate);

        return;
      }

      // There's no candidate and not using Trickle ICE, send the full SDP
      if(!useTrickleICE)
      {
        var type = this.localDescription.type;

        switch(type)
        {
          case 'offer':
            sendOffer(uid, sdp, incomingChannel)
            break;

          case 'answer':
            sendAnswer(uid, sdp, incomingChannel, this._trickleICE_route)
            break;

          default:
            console.error("Unknown description type: "+type);
        }
      }
    };
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
      if(channel.label == routingLabel)
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

    pc._routing = channel;

    Transport_Routing_init(channel, self, uid);
  }


  /**
   * Process the offer to connect to a new peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @return {RTCPeerConnection} The (newly created) peer.
   */
  this.onoffer = function(uid, sdp, incomingChannel, route, callback)
  {
    console.log("Received offer from "+uid);

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
        // Set the peer local description
        peer.setLocalDescription(answer, callback, callback);

        if(useTrickleICE)
          sendAnswer(uid, answer.sdp, incomingChannel, route)
        else
          peer._trickleICE_route = route;
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
    console.log("Received answer from "+uid);

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
  var handshakeManager = new HandshakeManager(ownUid);

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
        event2.uid = ownUid

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


  // Close all connections when user goes out of the page
  if(window)
    window.addEventListener('beforeunload', function(event)
    {
      self.close();
    });


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

      var channel = peer.createDataChannel(routingLabel);
      peer.channels[routingLabel] = channel;
      initDataChannel_routing(peer, channel, uid);
    }

    // Add channels
    labels = commonLabels.concat(labels)

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
        // Set the peer local description
        peer.setLocalDescription(offer, callback, callback);

        // Using Trickle ICE, send offer inmediately
        if(useTrickleICE)
          sendOffer(uid, offer.sdp, incomingChannel);
      },
      callback,
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


  this._forwardRequest = function(fwd_func, dest, sdp, route)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[dest]

    // Requested peer is one of the connected, notify directly to it
    if(peer)
       peer._routing[fwd_func](dest, sdp, route);

    // Requested peer is not one of the directly connected, broadcast it
    else
      for(var uid in peers)
        // Don't broadcast message back to the sender peer
        if(uid != peer_uid)
        {
          // Ignore peers already on the route path
          var routed = false;

          for(var i=0, route_id; route_id=route[i]; i++)
            if(route_id == uid)
            {
              routed = true;
              break;
            }

          // Notify the message request to the other connected peers
          if(!routed)
            peers[uid]._routing[fwd_func](dest, sdp, route);
        }
  }

  this._forwardResponse = function(fwd_func, dest, sdp, route)
  {
    // Run over all the route peers looking for possible "shortcuts"
    for(var i=0, route_uid; route_uid=route[i]; i++)
      for(var id in peers)
        if(route_uid == id)
        {
          peers[id]._routing[fwd_func](dest, sdp, route.slice(0, i-1));
          return
        }

    // Answer couldn't be routed (maybe a peer was disconnected?), try to find
    // the connection request initiator peer by broadcast
    for(var uid in peers)
      // Don't broadcast message back to the sender peer
      if(uid != peer_uid)
        peers[uid]._routing[fwd_func](dest, sdp, route);
  }
}
WebP2P.prototype = new EventTarget();

exports.WebP2P = WebP2P;