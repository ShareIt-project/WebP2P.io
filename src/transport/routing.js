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
      // Add the transport where the message was received to the route path
      route.push(peer_uid);

      webp2p._forwardRequest(fwd_func, dest, sdp, route);
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
      route = route.slice(0, route.length-1);

      webp2p._forwardResponse(fwd_func, dest, sdp, route);
    }

    // route is empty, ignore it
    else
      console.warn("Wrong destination and route is empty")
  }


  /**
   * Receive and process an 'offer' message
   */
  transport.addEventListener('offer', function(event)
  {
    orig2dest(event, function(orig, sdp, route)
    {
      webp2p.onoffer(orig, sdp, transport, route);
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
      webp2p.onanswer(orig, sdp);
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
      webp2p.oncandidate(orig, sdp);
    },
    'sendCandidate')
  })


  function sendSDP(type, uid, sdp, route)
  {
    var data = {type: type,
                sdp:  sdp}

    if(route && route.length)
      data.route = route;

    transport.sendData(data, uid);
  }

  /**
   * Send a RTCPeerConnection answer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this answer have circulated.
   */
  transport.sendAnswer = function(uid, sdp, route)
  {
    sendSDP('answer', uid, sdp, route)
  };

  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendCandidate = function(uid, sdp, route)
  {
    sendSDP('candidate', uid, sdp, route)
  };

  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  transport.sendOffer = function(uid, sdp, route)
  {
    sendSDP('offer', uid, sdp, route)
  };
}