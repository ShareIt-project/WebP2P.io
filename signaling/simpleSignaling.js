function Signaling_SimpleSignaling(configuration, manager)
{
    var self = this

    // Connect a signaling channel to the XMPP server
    var signaling = new SimpleSignaling(configuration);
        signaling.onopen = function(uid)
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                signaling.send(uid, data);
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

            // Set signaling as open
            if(self.onopen)
                self.onopen(uid)
        }
        signaling.onerror = function(event)
        {
            console.error(event);
        }
}