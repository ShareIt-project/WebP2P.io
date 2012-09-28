// Holds the STUN server to use for PeerConnections.
var STUN_SERVER = "STUN stun.l.google.com:19302";


function _createPeerConnection()
{
    return new PeerConnection(STUN_SERVER, function(){});
}

function _initDataChannel(pc, channel)
{
    Transport_init(channel, function(channel)
    {
        pc._channel = channel

        Transport_Peer_init(channel, db, host)
        Transport_Host_init(channel, db)
    })
}


function Transport_Signaling_init(transport)
{
    function processOffer(pc, sdp, socketId)
    {
        pc.setRemoteDescription(pc.SDP_OFFER, new SessionDescription(sdp));

        // Send answer
        var answer = pc.createAnswer(pc.remoteDescription.toSdp());

        signaling.emit("answer", socketId, answer.toSdp());

        pc.setLocalDescription(pc.SDP_ANSWER, answer);
    }


    signaling.addEventListener('connectTo', function(socketId, sdp)
    {
        console.debug('connectTo() is called')

        // Search the peer between the list of currently connected peers
        var pc = peers[socketId]

        // Peer is not connected, create a new channel
        if(!pc)
        {
            pc = _createPeerConnection();
            pc.ondatachannel = function(event)
            {
                _initDataChannel(pc, event.channel)
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
}