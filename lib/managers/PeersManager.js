/**
 * @classdesc Manager of the communications with the other peers
 *
 * @constructor
 */
function PeersManager()
{
  var peers = {};


  /**
   *  Close PeerConnection object if there are no open channels
   */
  function closePeer(peer)
  {
    if(!Object.keys(peer.channels).length)
      peer.close();
  };

  /**
   * Create a new RTCPeerConnection
   * @param {UUID} id Identifier of the other peer so later can be accessed.
   * @return {RTCPeerConnection}
   */
  function createPeerConnection(uid, connector)
  {
    function connectRequest(uid, sdp)
    {
      console.log("Sending offer to "+uid);

      // Send the offer only over the incoming connector
//  	    if(peer.channels[routingLabel])
      if(connector)
         connector.sendOffer(uid, sdp);

      // Send the offer throught all the peers
      else
        for(var id in peers)
          peers[id].channels[routingLabel].sendOffer(uid, sdp);
    };

    function connectResponse(dest, sdp, route)
    {
      console.log("Sending answer to "+dest);

      // Run over all the route peers looking for a possible shortcut
      for(var i=0, route_uid; route_uid=route[i]; i++)
        for(var id in peers)
          if(route_uid == id)
          {
            peers[id]._routing.sendAnswer(dest, sdp, route.slice(0, i-1));
            return;
          };

      // No shortcut was found, send the answer over the incoming connector
      connector.sendAnswer(dest, sdp, route);
    };

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
      // There's a candidate
      if(event.candidate)
        return;

      // There's no candidate, send the full SDP
      var type = this.localDescription.type;

      switch(type)
      {
        case 'offer':
          connectRequest(uid, sdp);
          break;

        case 'answer':
          connectResponse(uid, sdp);
          break;

        default:
          console.error("Unknown description type: "+type);
      }
    };
    pc.onstatechange = function(event)
    {
      // Remove the peer from the list of peers when gets closed
      if(event.target.readyState == 'closed')
      {
        delete peers[uid];

        var event = new Event('peerConnection.disconnected');
            event.peerConnection = pc;

        self.dispatchEvent(event);

        disconnected();
      };
    };

    applyChannelsShim(pc)

    pc.addEventListener('datachannel', function(event)
    {
      var channel = event.channel;

      channel.addEventListener('close', function(event)
      {
        closePeer(pc)
      });

      // Routing DataChannel, just init routing functionality on it
      if(channel.label == routingLabel)
        initDataChannel_routing(pc, channel, uid)
    });

  //  pc.onopen = function(event)
    {
      var event = new Event('peerconnection');
          event.peerconnection = pc;
          event.uid = uid;

      self.dispatchEvent(event);
    }

    return pc;
  };


  this.__defineGetter__("status", function()
  {
    return Object.keys(peers).length ? 'connected' : 'disconnected';
  });


  this.get = function(uid)
  {
    return peers[uid];
  };

  this.create = function(uid, connector, routingLabel)
  {
    var peer = createPeerConnection(uid, connector, peers);

    if(routingLabel)
    {
      var routingChannel = peer.createDataChannel(routingLabel);
          routingChannel = new Routing_DataChannel(routingChannel);

//    peer._routing = routingChannel;

//    peer.channels[this.routingLabel] = routingChannel;
    };

    return peer;
  };

  this.getOrCreate = function(uid, connector)
  {
    // Search the peer between the list of currently connected peers
    var peer = peers[uid];

    // Peer is not connected, create a new one
    if(!peer)
      peer = this.create(uid, connector);

    return peer;
  };


  this.forward = function(message, connector)
  {
    for(var i=0, peer; peer=peers[i]; i++)
    {
      // Don't send the message to the same connector where we received it
      if(peer === connector)
        continue;

      peer.send(message);
    };
  };


  this.close = function()
  {
    for(var i=0, peer; peer=peers[i]; i++)
      peer.close();
  };
};
PeersManager.prototype.__proto__   = Manager.prototype;
PeersManager.prototype.constructor = PeersManager;