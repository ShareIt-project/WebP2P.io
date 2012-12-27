/**
 * Handshake channel connector for SIP
 * @param {Object} configuration Configuration object
 */
function Handshake_SIP(configuration)
{
    var self = this

    // Connect a handshake channel to the SIP server
    var handshake = new JsSIP.UA(configuration);
        handshake.on('registered', function()
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                handshake.sendMessage(uid, JSON.stringify(data), 'text/JSON',
                                      {failed: function(response, error)
                                               {
                                                   console.warn(response);
                                                   console.warn(error);

                                                   if(self.onerror)
                                                       self.onerror(error)
                                               }
                                      })
            }

            handshake.on('newMessage', function(event)
            {
                var uid  = event.data.message.remote_identity
                var data = JSON.parse(event.data.message.body)

                if(self.onmessage)
                    self.onmessage(uid, data)
            })

            // Set handshake channel as open
            if(self.onopen)
                self.onopen(configuration.uri)
        });
        handshake.on('registrationFailed', function(error)
        {
            if(self.onerror)
                self.onerror(error)
        });

    // Start the SIP connection
    handshake.start();
}