function Signaling_Original(ws_uri, onsuccess)
{
    // Connect a signaling channel to the handshake server and get an ID
    var signaling = new WebSocket(ws_uri)
        signaling.onopen = function()
        {
            Transport_init(signaling)

            function processOffer(pc, socketId, sdp)
            {
                pc.setRemoteDescription(new RTCSessionDescription({sdp: sdp,
                                                                   type: 'offer'}));

                // Send answer
                pc.createAnswer(function(answer)
                {
                    signaling.emit("answer", socketId, answer.sdp)

                    pc.setLocalDescription(new RTCSessionDescription({sdp: answer.sdp,
                                                                      type: 'answer'}))
                });
            }

            signaling.setPeersManager = function(peersManager)
            {
                signaling.addEventListener('offer', function(event)
                {
                    var socketId = event.data[0]
                    var sdp = event.data[1]

                    // Search the peer between the list of currently connected peers
                    var pc = peersManager.getPeer(socketId)

                    // Peer is not connected, create a new channel
                    if(!pc)
                        pc = peersManager.createPeer(socketId);

                    processOffer(pc, socketId, sdp)
                })

                signaling.addEventListener('answer', function(event)
                {
                    var socketId = event.data[0]
                    var sdp = event.data[1]

                    // Search the peer on the list of currently connected peers
                    var pc = peersManager.getPeer(socketId)
                    if(pc)
                        pc.setRemoteDescription(new RTCSessionDescription({sdp: sdp,
                                                                           type: 'answer'}))
                    else
                        console.error("[signaling.answer] PeerConnection '" + socketId +
                                      "' not found");
                })
            }

            if(onsuccess)
                onsuccess(signaling)
        }
        signaling.onerror = function(error)
        {
            console.error(error)
        }
}