function Signaling_XMPP(configuration, manager)
{
    var self = this

    // Connect a signaling channel to the XMPP server
    var signaling = new JSJaCHttpBindingConnection(configuration);
        signaling.connect(configuration);   // Ugly hack to have only one config object
        signaling.registerHandler('onconnect', function(e)
        {
            // Compose and send message
            self.emit = function(id, sdp)
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
                        if(manager.onoffer)
                            manager.onoffer(peer, message[1])
                        break

                    case 'answer':
                        if(manager.onanswer)
                            manager.onanswer(peer, message[1])
                }
            })

            signaling.send(new JSJaCPresence());
        });
        signaling.registerHandler('onerror', function(event)
        {
            console.error(event);
        });
}