function Signaling_SIP(configuration)
{
    var self = this

    // Connect a signaling channel to the SIP server
    var signaling = new JsSIP.UA(configuration);
        signaling.on('registered', function(e)
        {
            // Compose and send message
            signaling.send = function(uid, data)
            {
                var eventHandlers = {failed: function(response, error)
                                             {
                                                 console.warning(response);
                                                 console.warning(error);
                                             }
                                    }

                signaling.sendMessage(uid, JSON.stringify(data),
                                      'text/JSON', eventHandlers)
            }

            signaling.on('newMessage', function(event)
            {
                var uid  = event.data.message.remote_identity
                var data = JSON.parse(event.data.message.body)

                if(self.onmessage)
                    self.onmessage(uid, data)
            })

            // Set signaling as open
            if(self.onopen)
                self.onopen(configuration.uri)
        });
        signaling.on('registrationFailed', function(event)
        {
            console.error(event);
        });

    // Start the SIP connection
    signaling.start();
}