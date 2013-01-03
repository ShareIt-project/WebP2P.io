function Transport_Routing_init(transport, peersManager)
{
    function sendOffer(dest, sdp, route, transport_uid)
    {
        route.push(transport_uid)

        // Search the peer between the list of currently connected peers
        var channels = peersManager.getChannels()
        var channel = channels[dest]

        // Requested peer is one of the connected, notify directly to it
        if(channel)
            channel.sendOffer(dest, sdp, route)

        // Requested peer is not one of the directly connected, broadcast it
        else
            for(var uid in channels)
            {
                // Ignore peers already on the route path
                var routed = false
                for(var i=0, peer; peer=route[i]; i++)
                    if(peer == uid)
                    {
                        routed = true
                        break
                    }

                // Notify the offer request to the other connected peers
                if(!routed)
                    channels[uid].sendOffer(dest, sdp, route)
            }
    }

    function sendAnswer(orig, sdp, route, transport_uid)
    {
        var routed = false

        var channels = peersManager.getChannels()

        // Run over all the route peers looking for possible "shortcuts"
        for(var i=0, uid; uid=route[i]; i++)
        {
            var channel = channels[uid]
            if(channel)
            {
                channel.sendAnswer(orig, sdp, route.slice(0, i-1))

                routed = true
            }
        }

      // Answer couldn't be routed (maybe a peer was disconnected?),
      // try to find the connection request initiator peer by broadcast
      if(!routed)
          for(var uid in channels)
          {
              // Ignore the transport where we got the notification
              if(uid == transport_uid)
                  continue

              // Notify the offer request to the other connected peers
              channels[uid].sendAnswer(dest, sdp, route)
          }
    }

    /**
     * Send a RTCPeerConnection offer through the active handshake channel
     * @param {UUID} uid Identifier of the other peer
     * @param {String} sdp Content of the SDP object
     */
    transport.sendOffer = function(dest, sdp, route)
    {
        transport.emit('offer', dest, sdp, route);
    }

    /**
     * Send a RTCPeerConnection answer through the active handshake channel
     * @param {UUID} uid Identifier of the other peer
     * @param {String} sdp Content of the SDP object
     */
    transport.sendAnswer = function(orig, sdp, route)
    {
        transport.emit('answer', orig, sdp, route);
    }

    transport.addEventListener('offer', function(event)
    {
        var dest  = event.data[0]
        var sdp   = event.data[1]
        var route = Array.prototype.slice.call(event.data, 2)

        // Offer is for us
        if(dest == peersManager.uid)
        {
            // Create PeerConnection
            var pc = peersManager.onoffer(route[0], sdp, function(uid, event)
            {
                console.error("Error creating DataChannel with peer "+uid);
                console.error(event);
            })

            // Send answer
            pc.createAnswer(function(answer)
            {
                transport.sendAnswer(dest, answer.sdp, route)

                pc.setLocalDescription(new RTCSessionDescription({sdp:  answer.sdp,
                                                                  type: 'answer'}))
            });
        }

        // Offer is not for us, route it over the other connected peers
        else
            sendOffer(dest, sdp, route, transport.uid)
    })

    transport.addEventListener('answer', function(event)
    {
        var orig  = event.data[0]
        var sdp   = event.data[1]
        var route = Array.prototype.slice.call(event.data, 2)

        // Answer is for us
        if(route[0] == peersManager.uid)
            peersManager.onanswer(orig, sdp, function(uid)
            {
                console.error("[routing.answer] PeerConnection '" + uid +
                              "' not found");
            })

        // Answer is not for us, search peers on route that we could send it
        else
            sendAnswer(orig, sdp, route, transport.uid)
    })
}