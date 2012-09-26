function Transport_Signaling_init(transport)
{
    // Holds the STUN server to use for PeerConnections.
    var STUN_SERVER = "STUN stun.l.google.com:19302";

    var peers = {}

    function processOffer(pc, sdp, socketId)
    {
        pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(sdp));

        // Send answer
        var answer = pc.createAnswer(pc.remoteDescription.toSdp());

        signaling.emit("answer", socketId, answer.toSdp());

        pc.setLocalDescription(pc.SDP_ANSWER, answer);
    }

    function createPeerConnection()
    {
        var pc = new PeerConnection(STUN_SERVER, function(){});
        peers[uid] = pc

        return pc
    }

    function initDataChannel(pc, channel)
    {
        Transport_init(channel, function(channel)
        {
            pc._channel = channel

            Transport_Peer_init(channel, db, host)

            if(onsuccess)
                onsuccess(channel)
        })
    }

    signaling.addEventListener('connectTo', function(socketId, sdp)
    {
        console.debug('connectTo() is called')

        // Search the peer between the list of currently connected peers
        var pc = peers[socketId]

        // Peer is not connected, create a new channel
        if(!pc)
        {
            pc = createPeerConnection();
            pc.ondatachannel = function(event)
            {
                initDataChannel(pc, event.channel)
            }
        }

        processOffer(pc, sdp, socketId)
    })

    signaling.addEventListener('offer', function(socketId, sdp)
    {
        console.debug('offer() is called')

        // Search the peer between the list of currently connected peers
        var pc = peers[socketId];

        processOffer(pc, sdp, socketId)
    })

    signaling.addEventListener('answer', function(socketId, sdp)
    {
        // Search the peer between the list of currently connected peers
        var pc = peers[socketId];

        pc.setRemoteDescription(pc.SDP_ANSWER, new SessionDescription(sdp));
    })

    signaling.connectTo = function(uid, onsuccess, onerror)
    {
        // Search the peer between the list of currently connected peers
        var peer = peers[uid]

        // Peer is not connected, create a new channel
        if(!peer)
        {
            // Create PeerConnection
            var pc = createPeerConnection();
                pc.open = function()
                {
                    initDataChannel(pc, pc.createDataChannel())
                }
                pc.onerror = function()
                {
                    if(onerror)
                        onerror()
                }

            // Send offer to new PeerConnection
            var offer = pc.createOffer();

            signaling.emit("connectTo", uid, offer.toSdp());

            pc.setLocalDescription(pc.SDP_OFFER, offer);
        }

        // Peer is connected and we have defined an 'onsucess' callback
        else if(onsuccess)
            onsuccess(peer._channel)
    }
}