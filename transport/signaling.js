function Transport_Signaling_init(signaling, peersManager)
{
    function processOffer(pc, socketId, sdp)
    {
        pc.setRemoteDescription(new RTCSessionDescription({sdp: sdp, type: 'offer'}));

        // Send answer
        pc.createAnswer(function(answer)
        {
            signaling.emit("answer", socketId, answer.sdp)

            pc.setLocalDescription(new RTCSessionDescription({sdp: answer.sdp,
                                                              type: 'answer'}))
        })
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
    })

    signaling.addEventListener('answer', function(event)
    {
        console.log("[signaling.answer]");

        var socketId = event.data[0]
        var sdp = event.data[1]

        // Search the peer on the list of currently connected peers
        var pc = peersManager.getPeer(socketId)
        if(pc)
            pc.setRemoteDescription(new RTCSessionDescription({sdp: sdp,
                                                               type: 'answer'}))
        else
            console.error("[signaling.answer] PeerConnection '" + socketId +
                          "' not found");
    })

    signaling.connectTo = function(uid, sdp)
    {
        this.emit("offer", uid, sdp);
    }
}