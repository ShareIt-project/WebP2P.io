function PeersManager_single()
{
    var peer

    this.getPeer()
    {
        return peer
    }

    this.createPeer()
    {
        peer = _createPeerConnection()
        peer.ondatachannel = function(event)
        {
            _initDataChannel(peer, event.channel)
        }

        return peer
    }
}