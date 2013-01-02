function Transport_Handshake_init(transport, peersManager)
{
    transport.sendOffer = function(dest, sdp, route)
    {
        transport.emit('offer', dest, sdp, route);
    }

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
        {
            route.push(transport.uid)

            var peer = peersManager.peers[dest]
            if(peer)
                peer.sendOffer(dest, sdp, route)
            else
                peersManager.sendOffer(dest, sdp, route)
        }
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
                console.error("[handshake.answer] PeerConnection '" + uid +
                              "' not found");
            })

        // Answer is not for us, search peers on route that we could send it
        else
        {
            var routed = false

            // Run over all the route peers looking for possible "shortcuts"
            for(var i=0, uid; uid=route[i]; i++)
            {
                var peer = peersManager.peers[uid]
                if(peer)
                {
                    peer.sendAnswer(orig, sdp, route.slice(0, i))

                    routed = true
                }
            }

//            // Answer couldn't be routed (maybe a peer was disconnected?),
//            // try to find the initiator peers
//            if(!routed)
//                peersManager.
        }
    })
}