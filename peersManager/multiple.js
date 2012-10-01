function PeersManager_multiple(signaling)
{
    EventTarget.call(this)

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
            peer.onopen = function()
            {
                console.log("peer.open")
                _initDataChannel(peer, peer.createDataChannel(), this, onsuccess)
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
        var peer = peers[socketId] = _createPeerConnection()
	        peer.ondatachannel = function(event)
	        {
                console.log("createPeer")
	            _initDataChannel(peer, event.channel, this)
	        }

        return peer
    }
}