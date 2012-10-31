// Fallbacks for vendor-specific variables until the spec is finalized.
var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;


function PeersManager(signaling, db, stun_server)
{
    // Set a default STUN server if none is specified
    if(stun_server == undefined)
		stun_server = "stun.l.google.com:19302";

    EventTarget.call(this)

    var peers = {}

    var self = this


    // Get the channel of one of the peers that have the file from its hash.
    // Since the hash and the tracker system are currently not implemented we'll
    // get just the channel of the peer where we got the file that we added
    // ad-hoc before
    this.getChannel = function(file)
    {
        return file.channel
    }

    this._transferbegin = function(fileentry)
    {
        // Calc number of necesary chunks to download
        var chunks = fileentry.size/chunksize;
        if(chunks % 1 != 0)
            chunks = Math.floor(chunks) + 1;

        // Add a blob container and a bitmap to our file stub
        fileentry.blob = new Blob([''], {"type": fileentry.type})
        fileentry.bitmap = Bitmap(chunks)

        // Insert new "file" inside IndexedDB
        db.files_add(fileentry,
        function()
        {
            self.dispatchEvent({type: "transfer.begin", data: [fileentry]})
            console.log("Transfer begin: '"+fileentry.name+"' = "+JSON.stringify(fileentry))

            // Demand data from the begining of the file
            self.getChannel(fileentry).emit('transfer.query', fileentry.hash,
                                                              getRandom(fileentry.bitmap))
        },
        function(errorCode)
        {
            console.error("Transfer begin: '"+fileentry.name+"' is already in database.")
        })
    }

	function createPeerConnection(id)
	{
	    var pc = peers[id] = new RTCPeerConnection({"iceServers": [{"url": 'stun:'+stun_server}]});

		return pc
	}

	function initDataChannel(pc, channel)
	{
        pc._channel = channel

        Transport_init(channel)

        Transport_Peer_init(channel, db, self)
        Transport_Host_init(channel, db)

		channel.onclose = function()
		{
			delete pc._channel
		}
	}


    this.connectTo = function(uid, onsuccess, onerror)
    {
        // Search the peer between the list of currently connected peers
        var peer = peers[uid]

        // Peer is not connected, create a new channel
        if(!peer)
        {
            // Create PeerConnection
            peer = createPeerConnection(uid);
            peer.onopen = function()
            {
                var channel = peer.createDataChannel()
                channel.onopen = function()
                {
	                initDataChannel(peer, channel)

	                if(onsuccess)
	                    onsuccess(channel)
                }
                channel.onerror = function()
                {
                    if(onerror)
                        onerror(uid, peer, channel)
                }
            }

            // Send offer to new PeerConnection
            peer.createOffer(function(offer)
            {
                signaling.connectTo(uid, offer.sdp)

                peer.setLocalDescription(new RTCSessionDescription({sdp: offer.sdp,
                                                                   type: 'offer'}))
            });
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
        var peer = createPeerConnection(socketId)
	        peer.ondatachannel = function(event)
	        {
                console.log("createPeer")
	            initDataChannel(peer, event.channel)
	        }

        return peer
    }
}
