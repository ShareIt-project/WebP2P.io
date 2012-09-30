// Fallbacks for vendor-specific variables until the spec is finalized.
var PeerConnection = window.PeerConnection || window.webkitPeerConnection00 || window.mozRTCPeerConnection;

// Holds the STUN server to use for PeerConnections.
var STUN_SERVER = "STUN stun.l.google.com:19302";


function _createPeerConnection()
{
    return new PeerConnection(STUN_SERVER, function(){});
}

function _initDataChannel(pc, channel, peersManager, onsuccess)
{
    Transport_init(channel, function(channel)
    {
        pc._channel = channel

        Transport_Peer_init(channel, db, peersManager)
        Transport_Host_init(channel, db)

        if(onsuccess)
            onsuccess(channel)
    })
}