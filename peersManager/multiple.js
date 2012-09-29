function PeersManager_multiple()
{
    var peers = {}

    this.connectTo = function(uid, onsuccess, onerror)
    {
        // Search the peer between the list of currently connected peers
        var peer = peers[uid]

        // Peer is not connected, create a new channel
        if(!peer)
        {
            // Create PeerConnection
            peer = peers[uid] = _createPeerConnection();
            peer.open = function()
            {
                _initDataChannel(peer, peer.createDataChannel())
            }
            peer.onerror = function()
            {
                if(onerror)
                    onerror()
            }

            // Send offer to new PeerConnection
            var offer = peer.createOffer();

            signaling.emit("offer", offer.toSdp(), uid);

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
        var peer = peers[socketId] = _createPeerConnection()
	        peer.ondatachannel = function(event)
	        {
	            _initDataChannel(peer, event.channel)
	        }

        return peer
    }
}