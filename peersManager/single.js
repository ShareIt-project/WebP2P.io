function PeersManager_single()
{
    var peer

    this.getPeer = function()
    {
        return peer
    }

    this.createPeer = function()
    {
        peer = _createPeerConnection()
        peer.ondatachannel = function(event)
        {
            _initDataChannel(peer, event.channel)
        }

        return peer
    }
}