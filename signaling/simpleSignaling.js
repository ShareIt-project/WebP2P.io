function Signaling_SimpleSignaling(configuration, manager)
{
    var self = this

    // Connect a signaling channel to the XMPP server
    var signaling = new SimpleSignaling(configuration);
        signaling.onopen = function(e)
        {
            // Compose and send message
            self.emit = function(uid, sdp)
            {
                signaling.send(uid, sdp);
            }

            signaling.onmessage = function(uid, data)
            {
                switch(data[0])
                {
                    case 'offer':
                        if(manager.onoffer)
                            manager.onoffer(uid, data[1])
                        break

                    case 'answer':
                        if(manager.onanswer)
                            manager.onanswer(uid, data[1])
                }
            }

            // Register the UID
            signaling.send(configuration.uid);
        }
        signaling.onerror = function(event)
        {
            console.error(event);
        }
}