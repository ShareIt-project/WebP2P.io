function Transport_Routing_init(transport, webp2p, peer_uid)
{
  function orig2dest(event, us_func, fwd_func)
  {
    var from  = event.from;
    var dest  = event.dest;
    var route = event.route || [];
    var sdp   = event.sdp;

    var orig  = route.lenght ? route[0] : from;

    // Message is from ourselves, ignore it
    if(from == webp2p.uid)
      return;

    // If message have been already routed by this peer, ignore it
    for(var i = 0, uid; uid = route[i]; i++)
      if(uid == webp2p.uid)
        return;

    // Message is for us
    if(dest == webp2p.uid)
      us_func(orig, sdp, route);

    // Message is not for us, route it over the other connected peers
    else
    {
      // Add the transport where it was received to the route path
      route.push(peer_uid);

      // Search the peer between the list of currently connected peers
      var peers = webp2p.getPeers();
      var peer = peers[dest]

      // Requested peer is one of the connected, notify directly to it
      if(peer)
         peer._routing[fwd_func](dest, sdp, route);

      // Requested peer is not one of the directly connected, broadcast it
      else
        for(var uid in peers)
        {
          // Don't broadcast message back to the sender peer
          if(uid == peer_uid)
            continue

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
  }

  function dest2orig(event, us_func, fwd_func)
  {
    var from  = event.from;
    var dest  = event.dest;
    var route = event.route || [];
    var sdp   = event.sdp;

    var orig  = route.lenght ? route[0] : from;

    // Answer is from ourselves, ignore it
    if(from == webp2p.uid)
      return;

    // Answer is for us
    if(dest == webp2p.uid)
      us_func(orig, sdp, route)

    // Answer is not for us but we know where it goes, search peers on route
    // where we could send it
    else if(route.length)
    {
      var routed = false;

      // Run over all the route peers looking for possible "shortcuts"
      var peers = webp2p.getPeers();

      for(var i=0, route_uid; uid=route[i]; i++)
        for(var uid in peers)
          if(route_uid == uid)
          {
            peers[uid]._routing[fwd_func](dest, sdp, route.slice(0, i-1));

            // Currently is sending the message to all the shortcuts, but maybe
            // it would be necessary only the first one so some band-width could
            // be saved?
            routed = true;
          }

      // Answer couldn't be routed (maybe a peer was disconnected?), try to find
      // the connection request initiator peer by broadcast
      if(!routed)
      {
        route = route.slice(0, route.length-1)

        for(var uid in peers)
        {
          // Don't broadcast message back to the sender peer
          if(uid == peer_uid)
            continue

          // Ignore peers already on the route path
          var routed = false;

          for(var i=0, route_id; route_id=route[i]; i++)
            if(route_id == uid)
            {
              routed = true;
              break;
            }

          // Notify the offer request to the other connected peers
          if(!routed)
            peers[uid]._routing[fwd_func](dest, sdp, route);
        }
      }
    }

    // route is empty, ignore it
    else
      console.warn("["+fwd_func+"] Wrong destination and route is empty")
  }


  /**
   * Receive and process an 'offer' message
   */
  transport.addEventListener('offer', function(event)
  {
    orig2dest(event, function(orig, sdp, route)
    {
      // Create PeerConnection
      webp2p.onoffer(orig, sdp, route, transport, function(error)
      {
        if(error)
          console.error(error);
      });
    },
    'sendOffer')
  });

  /**
   * Receive and process an 'answer' message
   */
  transport.addEventListener('answer', function(event)
  {
    dest2orig(event, function(orig, sdp, route)
    {
      webp2p.onanswer(orig, sdp, function(error)
      {
        if(error)
          console.error(error);
      });
    },
    'sendAnswer')
  });

  /**
   * Receive and process a 'candidate' message
   */
  transport.addEventListener('candidate', function(event)
  {
    orig2dest(event, function(orig, sdp, route)
    {
      webp2p.oncandidate(orig, sdp, function(uid)
      {
        console.error("[routing.candidate] PeerConnection '" + uid + "' not found");
      });
    },
    'sendCandidate')
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

    // Remove all the later routed peers
    for(var i=0, uid; uid=route[i]; i++)
      if(uid == peer_uid)
      {
        route.length = i;
        break;
      }

    if(route && route.length)
      data.route = route;

    transport.sendData(data, orig);
  };

  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendCandidate = function(dest, sdp, route)
  {
    var data = {type: 'candidate',
                sdp:  sdp}

    if(route && route.length)
      data.route = route;

    transport.sendData(data, dest);
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

    if(route && route.length)
      data.route = route;

    transport.sendData(data, dest);
  };
}