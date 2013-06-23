/**
 * @classdesc Manager of the communications with the other peers
 * @constructor
 * @param {String} [stun_server="stun.l.google.com:19302"] URL of the server
 * used for the STUN communications.
 */
function PeersManager(handshake_servers_file, stun_server)
{
  //Fallbacks for vendor-specific variables until the spec is finalized.
  var RTCPeerConnection = RTCPeerConnection || webkitRTCPeerConnection || mozRTCPeerConnection;

  // Set a default STUN server if none is specified
  if(stun_server == undefined)
     stun_server = 'stun.l.google.com:19302';

  var peers = {};

  var self = this;


  /**
   * UUID generator
   */
  var UUIDv4 = function b(a)
  {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
  };

  this.uid = UUIDv4();


  /**
   * Create a new RTCPeerConnection
   * @param {UUID} id Identifier of the other peer so later can be accessed.
   * @return {RTCPeerConnection}
   */
  function createPeerConnection(uid, incomingChannel, cb)
  {
    var pc = peers[uid] = new RTCPeerConnection(
    {
      iceServers: [{url: 'stun:'+stun_server}]
    },
    {
      optional: [{RtpDataChannels: true}]
    });

    pc.onicecandidate = function(event)
    {
      if(event.candidate)
        incomingChannel.sendCandidate(uid, event.candidate);
    }
    pc.onstatechange = function(event)
    {
      console.warn("PeerConnection "+event.target.readyState)
      console.warn("PeerConnection "+event.target.iceConnectionState)

      // Remove the peer from the list of peers when gets closed
      if(event.target.readyState == 'closed')
        delete peers[uid];
    };

    pc._channels2 = {}

    var dispatchEvent = pc.dispatchEvent;
    pc.dispatchEvent = function(event)
    {
      var channel = event.channel

      if(event.type == 'datachannel' && channel.label == 'webp2p')
        initDataChannel(pc, channel, uid)

      else
      {
        pc._channels2[channel.label] = channel
        dispatchEvent.call(this, event)
      }
    };

    pc.channels = function()
    {
      return pc._channels2
    }

//    pc.onopen = function(event)
    {
      var event = document.createEvent("Event");
          event.initEvent('peerconnection',true,true);
          event.peerconnection = pc
          event.uid = uid

      self.dispatchEvent(event);
    }

    if(cb)
      pc.onerror = function(event)
      {
        cb({uid: uid, peer:pc});
      };

    return pc;
  }

  /**
   * Initialize a {RTCDataChannel} when gets open and notify it
   * @param {RTCPeerConnection} pc PeerConnection owner of the DataChannel.
   * @param {RTCDataChannel} channel Communication channel with the other peer.
   */
  function initDataChannel(pc, channel, uid)
  {
//    pc._routing = channel;

    channel.addEventListener('close', function(event)
    {
//      delete pc._routing;

      pc.close();
    });

    Transport_Routing_init(channel, self, uid);
  }


  /**
   * Process the offer to connect to a new peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @return {RTCPeerConnection} The (newly created) peer.
   */
  this.onoffer = function(uid, sdp, incomingChannel, cb)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new channel
    if(!peer)
      peer = createPeerConnection(uid, incomingChannel, cb);

    // Process offer
    peer.setRemoteDescription(new RTCSessionDescription(
    {
      sdp: sdp,
      type: 'offer'
    }));

    return peer;
  };

  /**
   * Process the answer received while attempting to connect to the other peer
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Session Description Protocol data of the other peer.
   * @param {Function} onerror Callback called if we don't have previously
   * wanted to connect to the other peer.
   */
  this.onanswer = function(uid, sdp, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.setRemoteDescription(new RTCSessionDescription(
      {
        sdp: sdp,
        type: 'answer'
      }));
    else if(onerror)
      onerror(uid);
  };

  this.oncandidate = function(uid, candidate, onerror)
  {
    // Search the peer on the list of currently connected peers
    var peer = peers[uid];
    if(peer)
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    else if(onerror)
      onerror(uid);
  }


  // Init handshake manager
  var handshakeManager = new HandshakeManager(handshake_servers_file, this);
  handshakeManager.onerror = function(error)
  {
    console.error(error);
    alert(error);
  };
  handshakeManager.onopen = function()
  {
    var event = document.createEvent("Event");
        event.initEvent('handshake.open',true,true);
        event.uid = self.uid

    self.dispatchEvent(event);
  };


  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   * @param {UUID} uid Identifier of the other peer to be connected.
   * @param {MessageChannel} incomingChannel Optional channel where to
   * @param {Function(error, channel)} cb Callback
   * send the offer. If not defined send it to all connected peers.
   */
  this.connectTo = function(uid, labels, incomingChannel, cb)
  {
    var createOffer = false

    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new one with a routing channel
    if(!peer)
    {
      createOffer = true

      // Create PeerConnection
      peer = createPeerConnection(uid, incomingChannel, cb);

      peer._routing = peer.createDataChannel('webp2p');
      initDataChannel(peer, peer._routing, uid);
    }

    // Add requested channels
    for(var i=0, label; label=labels[i]; i++)
    {
      var channel = peer._channels2[label]

      // Channel doesn't exists, create and initialize it
      if(!channel)
      {
        createOffer = true

        // Create new DataChannel
        channel = peer.createDataChannel(label);
        peer._channels2[label] = channel

        // Dispatch new DataChannel to the application
        var event = document.createEvent("Event");
            event.initEvent('datachannel',true,true);
            event.channel = channel
        peer.dispatchEvent(event);
      }
    }

    // Send offer to new PeerConnection if connection characteristics changed
    if(createOffer)
      peer.createOffer(function(offer)
      {
        console.log("[createOffer]: "+uid+"\n"+offer.sdp);

        // Send the offer only for the incoming channel
//        if(peer._routing)
        if(incomingChannel)
           incomingChannel.sendOffer(uid, offer.sdp);

        // Send the offer throught all the peers
        else
        {
          var channels = self.getChannels();
  //        var channels = self.getPeers();

          // Send the connection offer to the other connected peers
          for(var channel_id in channels)
            channels[channel_id].sendOffer(uid, offer.sdp);
        }

        // Set the peer local description
        peer.setLocalDescription(offer);
      });

    if(cb)
      cb();
  };

  this.getPeers = function()
  {
    return peers
  }

  /**
   * Get the channels of all the connected peers and handshake servers
   */
  this.getChannels = function()
  {
    var channels = {};

    // Peers channels
    for(var uid in peers)
    {
      var channel = peers[uid]._channel;
      if(channel)
        channels[uid] = channel;
    }

    // Handshake servers channels
    var handshakeChannels = handshakeManager.getChannels();

    for(var uid in handshakeChannels)
      if(handshakeChannels.hasOwnProperty(uid))
        channels[uid] = handshakeChannels[uid];

      return channels;
  };


  this.handshakeDisconnected = function()
  {
    if(!Object.keys(peers).length)
    {
      var event = document.createEvent("Event");
          event.initEvent('error.noPeers',true,true);

      this.dispatchEvent(event);
    }
  };
}
PeersManager.prototype = new EventTarget();

exports.PeersManager = PeersManager;