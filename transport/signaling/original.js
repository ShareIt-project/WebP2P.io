function Transport_Signaling_Original(ws_uri)
{
    // Connect a signaling channel to the handshake server and get an ID
//    var signaling = new WebSocket('ws://localhost:8001')
    var signaling = new WebSocket(ws_uri)
        signaling.onopen = function()
        {
            Transport_init(signaling)
        }
        signaling.onerror = function(error)
        {
            console.error(error)
        }

    function processOffer(pc, socketId, sdp)
    {
        pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(sdp));

        // Send answer
        var answer = pc.createAnswer(pc.remoteDescription.toSdp());

        signaling.emit("answer", socketId, answer.toSdp());

        pc.setLocalDescription(pc.SDP_ANSWER, answer);
    }


    this.setPeersManager(peersManager)
    {
        signaling.addEventListener('offer', function(event)
        {
            var socketId = event.data[0]
            var sdp = event.data[1]

            // Search the peer between the list of currently connected peers
            var pc = peersManager.getPeer(socketId)

            // Peer is not connected, create a new channel
            if(!pc)
                pc = peersManager.createPeer(socketId);

            processOffer(pc, socketId, sdp)

            console.log("offer.local: "+pc.localDescription.toSdp())
            console.log("offer.remote: "+pc.remoteDescription.toSdp())
        })

        signaling.addEventListener('answer', function(event)
        {
            console.log("[signaling.answer]");

            var socketId = event.data[0]
            var sdp = event.data[1]

            // Search the peer on the list of currently connected peers
            var pc = peersManager.getPeer(socketId)
            if(pc)
                pc.setRemoteDescription(pc.SDP_ANSWER, new SessionDescription(sdp))
            else
                console.error("[signaling.answer] PeerConnection '" + socketId +
                              "' not found");

            console.log("answer.local: "+pc.localDescription.toSdp())
            console.log("answer.remote: "+pc.remoteDescription.toSdp())
        })
    }
}