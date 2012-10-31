function Signaling_Original(ws_uri, onsuccess)
{
    // Connect a signaling channel to the handshake server and get an ID
    var signaling = new WebSocket(ws_uri)
        signaling.onopen = function()
        {
            Transport_init(signaling)

            signaling.addEventListener('offer', function(event)
            {
                var socketId = event.data[0]
                var sdp = event.data[1]

                if(signaling.onoffer)
                    signaling.onoffer(socketId, sdp)
            })

            signaling.addEventListener('answer', function(event)
            {
                console.log("[signaling.answer]");

                var socketId = event.data[0]
                var sdp = event.data[1]

                if(signaling.onanswer)
                    signaling.onanswer(socketId, sdp)
            })

            signaling.connectTo = function(uid, sdp)
            {
                this.emit("offer", uid, sdp);
            }

            if(onsuccess)
                onsuccess(signaling)
        }
        signaling.onerror = function(error)
        {
            console.error(error)
        }
}