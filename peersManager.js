// Fallbacks for vendor-specific variables until the spec is finalized.
var PeerConnection = window.PeerConnection || window.webkitPeerConnection00 || window.mozRTCPeerConnection;

// Holds the STUN server to use for PeerConnections.
var STUN_SERVER = "STUN stun.l.google.com:19302";


function PeersManager(signaling, db)
{
    EventTarget.call(this)

    var peers = {}

    var self = this


	function createPeerConnection()
	{
	    return new PeerConnection(STUN_SERVER, function(){});
	}
	
	function initDataChannel(pc, channel, onsuccess)
	{
	    Transport_init(channel, function(channel)
	    {
	        pc._channel = channel

	        Transport_Peer_init(channel, db, self)
	        Transport_Host_init(channel, db)

	        if(onsuccess)
	            onsuccess(channel)
	    })
	}


    this.connectTo = function(uid, onsuccess, onerror)
    {
        // Search the peer between the list of currently connected peers
        var peer = peers[uid]

        // Peer is not connected, create a new channel
        if(!peer)
        {
            // Create PeerConnection
            peer = peers[uid] = createPeerConnection();
            peer.onopen = function()
            {
                console.log("peer.open")
                initDataChannel(peer, peer.createDataChannel(), onsuccess)
            }
            peer.onerror = function()
            {
                if(onerror)
                    onerror()
            }

            // Send offer to new PeerConnection
            var offer = peer.createOffer();

            signaling.emit("offer", uid, offer.toSdp());

            peer.setLocalDescription(peer.SDP_OFFER, offer);
        }

        // Peer is connected and we have defined an 'onsucess' callback
        else if(onsuccess)
            onsuccess(peer._channel)
    }

    this.getPeer = function(socketId)
    {
        return peers[socketId]
    }

    this.createPeer = function(socketId)
    {
        var peer = peers[socketId] = createPeerConnection()
	        peer.ondatachannel = function(event)
	        {
                console.log("createPeer")
	            initDataChannel(peer, event.channel)
	        }

        return peer
    }
}