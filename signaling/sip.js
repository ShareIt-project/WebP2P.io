function Signaling_SIP(ws_uri, onsuccess)
{
    var sip_uri = ''

    var configuration =
    {
      'outbound_proxy_set': ws_uri,
      'uri': sip_uri,
      'password':  ''
    };

    try
    {
        var signaling = new JsSIP.UA(configuration);
    }
    catch(e)
    {
      console.log(e);
      return;
    }

    // Transport connection/disconnection callbacks
    signaling.on('connected', ws_connected);
    signaling.on('disconnected', ws_disconnected);

    // Call/Message reception callbacks
    signaling.on('newSession', function(e)
    {
      GUI.new_session(e)
    });

    signaling.on('newMessage', function(e)
    {
      GUI.new_message(e)
    });

    // Registration/Deregistration callbacks
    signaling.on('registered', function(e)
    {
      console.info('Registered');
      GUI.setStatus("registered");
    });

    signaling.on('unregistered', function(e)
    {
      console.info('Deregistered');
      GUI.setStatus("connected");
    });

    signaling.on('registrationFailed', function(e)
    {
      console.info('Registration failure');
      GUI.setStatus("connected");
    });

    // Start
    signaling.start();


    signaling.connectTo = function(uid, sdp)
    {
        signaling.call(uid, false, false);
        signaling.sendMessage(uid, sdp)
    }

}