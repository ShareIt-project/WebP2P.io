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