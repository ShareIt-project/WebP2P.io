function Signaling_XMPP(configuration, onsuccess)
{
    // Connect a signaling channel to the XMPP server
    var signaling = new JSJaCHttpBindingConnection(configuration);
        signaling.registerHandler('onconnect', function(e)
        {
            // Compose and send message
            signaling.emit = function()
            {
                var args = Array.prototype.slice.call(arguments, 0);
                var peer = args[1]
                args.splice(1,1)

                var oMsg = new JSJaCMessage();
                oMsg.setTo(new JSJaCJID(peer));
                oMsg.setBody(JSON.stringify(args));

                signaling.send(oMsg);
            }

            signaling.registerHandler('message', function(oJSJaCPacket)
            {
                var peer    = oJSJaCPacket.getFromJID()
                var message = JSON.parse(oJSJaCPacket.getBody())

                switch(message[0])
                {
                    case 'offer':
                        if(signaling.onoffer)
                            signaling.onoffer(peer, message[1])
                        break

                    case 'answer':
                        if(signaling.onanswer)
                            signaling.onanswer(peer, message[1])
                }
            })


            signaling.connectTo = function(uid, sdp)
            {
                this.emit("offer", uid, sdp);
            }


            signaling.send(new JSJaCPresence());

            if(onsuccess)
                onsuccess(signaling)
        });
        signaling.registerHandler('onerror', function(event)
        {
            console.error(event);
        });
}