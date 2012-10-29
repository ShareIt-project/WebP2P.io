function Transport_Signaling_SIP_init(peersManager)
{
    var configuration =
    {
      'outbound_proxy_set': [outbound_proxy_set],
      'uri': sip_uri,
      'display_name': '',
      'password':  sip_password,
      'register_expires': 600,
      'secure_transport': false,
      'stun_server': 'aliax.net',
      'trace_sip': true,
      'hack_ip_in_contact': true,
      'hack_via_tcp': true
    };

    var ua

    try
    {
        ua = new JsSIP.UA(configuration);
    }
    catch(e)
    {
      console.log(e);
      return;
    }

    // Transport connection/disconnection callbacks
    ua.on('connected', ws_connected);
    ua.on('disconnected', ws_disconnected);

    // Call/Message reception callbacks
    ua.on('newSession', function(e)
    {
      GUI.new_session(e)
    });

    ua.on('newMessage', function(e)
    {
      GUI.new_message(e)
    });

    // Registration/Deregistration callbacks
    ua.on('registered', function(e)
    {
      console.info('Registered');
      GUI.setStatus("registered");
    });

    ua.on('unregistered', function(e)
    {
      console.info('Deregistered');
      GUI.setStatus("connected");
    });

    ua.on('registrationFailed', function(e)
    {
      console.info('Registration failure');
      GUI.setStatus("connected");
    });

    // Start
    ua.start();
}