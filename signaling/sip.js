function Signaling_SIP(ws_uri, onsuccess)
{
    var sip_uri = ''

    var configuration =
    {
      'outbound_proxy_set': ws_uri,
      'uri': sip_uri,
//      'password': ''
    };

    // Connect a signaling channel to the SIP server
    var signaling = new JsSIP.UA(configuration);
        signaling.on('registered', function(e)
        {
            // Compose and send message
            signaling.emit = function()
            {
                var args = Array.prototype.slice.call(arguments, 0);

                var messageSender = signaling.sendMessage(args[1], JSON.stringify(args))
                    messageSender.onFailure = function(response, error)
                    {
                        console.warning(response);
                        console.warning(error);
                    });
            }

            signaling.onmessage = function(display_name, uri, message)
            {
                message = JSON.parse(message)

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
            }


            signaling.connectTo = function(uid, sdp)
            {
                this.emit("offer", uid, sdp);
            }

            if(onsuccess)
                onsuccess(signaling)
        });
        signaling.on('registrationFailed', function(error)
        {
            console.error(error);
        });

    // Start
    signaling.start();
}