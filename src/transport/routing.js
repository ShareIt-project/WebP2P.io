function Transport_Routing_init(transport, webp2p, peer_uid)
{
  /**
   * Receive and process an 'offer' message
   */
  transport.addEventListener('offer', function(event)
  {
    var from  = event.from;
    var sdp   = event.sdp;
    var route = event.route;

//    // If a message have been already routed by this peer, ignore it
//    for(var i = 0, uid; uid = route[i]; i++)
//      if(uid == webp2p.uid)
//        return;

//    // Offer is for us
//    if(dest == webp2p.uid)
//    {

      // Create PeerConnection
      var pc = webp2p.onoffer(from, sdp, function(error)
      {
        if(error)
          console.error(error);
      });

      // Send answer
      pc.createAnswer(function(answer)
      {
        console.log("[createAnswer]: "+from+"\n"+answer.sdp);

        transport.sendAnswer(from, answer.sdp, route);

        pc.setLocalDescription(new RTCSessionDescription(
        {
          sdp: answer.sdp,
          type: 'answer'
        }));
      });

//    }
//
//    // Offer is not for us, route it over the other connected peers
//    else
//    {
//      // Add the transport where it was received to the route path
//      route.push(peer_uid);
//
//      // Search the peer between the list of currently connected peers
//      var peers = webp2p.getPeers();
//      var channel = peers[dest]._routing;
//
//      // Requested peer is one of the connected, notify directly to it
//      if(channel)
//         channel.sendOffer(from, sdp, route);
//
//      // Requested peer is not one of the directly connected, broadcast it
//      else for(var uid in channels)
//      {
//        // Ignore peers already on the route path
//        var routed = false;
//        for(var i = 0, peer; peer = route[i]; i++)
//          if(peer == uid)
//          {
//            routed = true;
//            break;
//          }
//
//          // Notify the offer request to the other connected peers
//          if(!routed)
//            channels[uid].sendOffer(dest, sdp, route);
//      }
//    }
  });

  /**
   * Receive and process an 'answer' message
   */
  transport.addEventListener('answer', function(event)
  {
    var from = event.from;
    var sdp = event.sdp;
    var route = event.route;

//    // Answer is from ourselves or we don't know where it goes, ignore it
//    if(orig == webp2p.uid
//    || !route.length)
//      return;
//
//    // Answer is for us
//    if(route[0] == webp2p.uid)
      webp2p.onanswer(from, sdp, function(uid)
      {
        console.error("[routing.answer] PeerConnection '" + uid + "' not found");
      });

//    // Answer is not for us but we know where it goes, search peers on route
//    // where we could send it
//    else if(route.length > 1)
//    {
//      var routed = false;
//
//      var peers = webp2p.getPeers();
//
//      // Run over all the route peers looking for possible "shortcuts"
//      for(var i = 0, uid; uid = route[i]; i++)
//      {
//        var channel = peers[uid]._routing;
//        if(channel)
//        {
//          channel.sendAnswer(from, sdp, route.slice(0, i - 1));
//
//          // Currently is sending the message to all the shortcuts, but maybe it
//          // would be necessary only the first one so some band-width could be
//          // saved?
//          routed = true;
//        }
//      }
//
//      // Answer couldn't be routed (maybe a peer was disconnected?), try to find
//      // the connection request initiator peer by broadcast
//      if(!routed)
//        for(var uid in channels)
//          if(uid != peer_uid)
//            channels[uid].sendAnswer(orig, sdp, route);
//    }
  });


  /**
   * Receive and process a 'candidate' message
   */
  transport.addEventListener('candidate', function(event)
  {
    var from      = event.from;
    var candidate = event.candidate;
    var route     = event.route;

    webp2p.oncandidate(from, candidate, function(uid)
    {
      console.error("[routing.candidate] PeerConnection '" + uid + "' not found");
    });
  })


  /**
   * Send a RTCPeerConnection answer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this answer have circulated.
   */
  transport.sendAnswer = function(orig, sdp, route)
  {
    var data = {type: 'answer',
                sdp:  sdp}
    if(route)
      data.route = route;

//    // Run over all the route peers looking for possible "shortcuts"
//    for(var i = 0, uid; uid = route[i]; i++)
//      if(uid == peer_uid)
//      {
//        route.length = i;
//        break;
//      }

    transport.send(data, orig);
  };


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendCandidate = function(dest, candidate, route)
  {
    var data = {type: 'candidate',
                candidate:  candidate}
    if(route)
      data.route = route;

    transport.send(data, dest);
  };


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendOffer = function(dest, sdp, route)
  {
    var data = {type: 'offer',
                sdp:  sdp}
    if(route)
      data.route = route;

    transport.send(data, dest);
  };
}