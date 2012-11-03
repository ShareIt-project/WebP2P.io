function Signaling_SIP(configuration, onsuccess)
{
    // Connect a signaling channel to the SIP server
    var signaling = new JsSIP.UA(configuration);
        signaling.on('registered', function(e)
        {
            // Compose and send message
            signaling.emit = function()
            {
                var args = Array.prototype.slice.call(arguments, 0);

                var eventHandlers = {failed: function(response, error)
                                             {
                                                 console.warning(response);
                                                 console.warning(error);
                                             }
                                    }

                signaling.sendMessage(args[1], JSON.stringify(args),
                                      'text/JSON', eventHandlers)
            }

            signaling.on('newMessage', function(event)
            {
                var message = JSON.parse(event.data.message.body)

                switch(message[0])
                {
                    case 'offer':
                        if(signaling.onoffer)
                            signaling.onoffer(message[1], message[2])
                        break

                    case 'answer':
                        if(signaling.onanswer)
                            signaling.onanswer(message[1], message[2])
                }
            })


            signaling.connectTo = function(uid, sdp)
            {
                this.emit("offer", uid, sdp);
            }

            if(onsuccess)
                onsuccess(signaling)
        });
        signaling.on('registrationFailed', function(event)
        {
            console.error(event);
        });

    // Start
    signaling.start();
}