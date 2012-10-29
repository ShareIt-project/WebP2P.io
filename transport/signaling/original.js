function Transport_Signaling_Original_init(signaling, peersManager)
{
    function processOffer(pc, socketId, sdp)
    {
        pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(sdp));

        // Send answer
        var answer = pc.createAnswer(pc.remoteDescription.toSdp());

        signaling.emit("answer", socketId, answer.toSdp());

        pc.setLocalDescription(pc.SDP_ANSWER, answer);
    }


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
