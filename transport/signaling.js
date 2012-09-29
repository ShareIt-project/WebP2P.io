function Transport_Signaling_init(signaling, peersManager)
{
    function processOffer(pc, sdp, socketId)
    {
        pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(sdp));

        // Send answer
        var answer = pc.createAnswer(pc.remoteDescription.toSdp());

        signaling.emit("answer", answer.toSdp(), socketId);

        pc.setLocalDescription(pc.SDP_ANSWER, answer);
    }


    signaling.addEventListener('offer', function(sdp, socketId)
    {
        // Search the peer between the list of currently connected peers
        var pc = peersManager.getPeer(socketId)

        // Peer is not connected, create a new channel
        if(!pc)
            pc = peersManager.createPeer(socketId);

        processOffer(pc, sdp, socketId)
    })

    signaling.addEventListener('answer', function(sdp, socketId)
    {
        // Search the peer between the list of currently connected peers
        var pc = peersManager.getPeer(socketId)
        if(pc)
            pc.setRemoteDescription(pc.SDP_ANSWER, new SessionDescription(sdp));
    })
}