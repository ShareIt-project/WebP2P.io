QUnit.module("5 peers chained");


var handshake_servers =
[
  {
    type: "PubNub",
    config_init:
    {
      publish_key  : "pub-6ee5d4df-fe10-4990-bbc7-c1b0525f5d2b",
      subscribe_key: "sub-e5919840-3564-11e2-b8d0-c7df1d04ae4a",
      ssl          : true
    },
    config_mess:
    {
      channel: "ShareIt"
    },
    max_connections: 1
  }
];

var options =
[
  {
    handshake_servers: handshake_servers,
    sessionID: "Peer 1"
  },
  {
    handshake_servers: handshake_servers,
    sessionID: "Peer 2"
  },
  {
    handshake_servers: handshake_servers,
    sessionID: "Peer 3"
  },
  {
    handshake_servers: handshake_servers,
    sessionID: "Peer 4"
  },
  {
    handshake_servers: handshake_servers,
    sessionID: "Peer 5"
  }
];


asyncTest("Connect two peers using another three as intermediaries",
function()
{
  expect(44);

  createPeer_connect([], 0, 4)
});


/*
asyncTest("Exchange data between two peers connected using a another three as intermediaries",
function()
{
  expect(21);

  options[0].commonLabels = ['test'];
  options[1].commonLabels = ['test'];
  options[2].commonLabels = ['test'];
  options[3].commonLabels = ['test'];

  var conns[0], conns[1], conns[2], conns[3];


  // Conn 1

  conns[0] = new WebP2P(options1);

  conns[0].on('error', function(error)
  {
    ok(false, "conns[0] error: "+error);

    conns[0].close();
    start();
  });

  conns[0].on('handshakeManager.connected', function()
  {
    ok(true, "conns[0] handshakeManager.connected. SessionID: "+conns[0].sessionID);


    // Conn 2

    conns[1] = new WebP2P(options2);

    conns[1].on('error', function(error)
    {
      ok(false, "conns[1] error: "+error);

      tearDown()
    });

    conns[1].on('peersManager.connected', function(_peersManager)
    {
      ok(true, 'conns[1] peersManager.connected');

      var peers = Object.keys(conns[1].peers);
      equal(peers.length, 1, "conns[1] peers: "+peers);

      var _connectors = _peersManager._connectors;
      equal(_connectors.length, 1, "conns[1] _connectors: "+_connectors.length);
      console.log(_connectors);


      // Conn 3

      conns[2] = new WebP2P(options3);

      conns[2].on('error', function(error)
      {
        ok(false, "conns[2] error: "+error.message);
        console.error(error);

        tearDown()
      });

      conns[2].on('peersManager.connected', function(_peersManager)
      {
        ok(true, 'conns[2] peersManager.connected');

        var peers = Object.keys(conns[2].peers);
        equal(peers.length, 1, "conns[2] peers: "+peers);

        var _connectors = _peersManager._connectors;
        equal(_connectors.length, 1, "conns[2] _connectors: "+_connectors.length);
        console.log(_connectors);


        // Conn 4

        conns[3] = new WebP2P(options4);

        conns[3].on('error', function(error)
        {
          ok(false, "conns[3] error: "+error.message);
          console.error(error);

          tearDown()
        });

        conns[3].on('peersManager.connected', function(_peersManager)
        {
          ok(true, 'conns[3] peersManager.connected');

          var peers = Object.keys(conns[3].peers);
          equal(peers.length, 1, "conns[3] peers: "+peers);

          var _connectors = _peersManager._connectors;
          equal(_connectors.length, 1, "conns[3] _connectors: "+_connectors.length);
          console.log(_connectors);


          conns[3].connectTo(conns[0].sessionID, function(error, peerconnection, channels)
          {
            if(error) return ok(false, error);

            equal(conns[0].sessionID, peerconnection.sessionID,
                  'conns[3] connected to conns[0]: '+peerconnection.sessionID);

            var peers = Object.keys(conns[3].peers);
            equal(peers.length, 2, "conns[3] peers: "+peers);


            // Send message to conns[0]

            function initDataChannel(channel)
            {
              if(channel.label == 'test')
              {
                function open()
                {
                  channel.send('ping');
                };

                if(channel.readyState == 'open')
                  open();
                else
                  channel.addEventListener('open', open);

                channel.addEventListener('message', function(event)
                {
                  var message = event.data;
                  equal(message, 'pong', 'Received message: '+message);

                  if(message == 'pong')
                  {
                    ok(true, 'Test successful');

                    tearDown()
                  }
                });
              }
            };

            if(channels.length)
              for(var i=0, channel; channel=channels[i]; i++)
                initDataChannel(channel);
            else
              peerconnection.addEventListener('datachannel', function(event)
              {
                initDataChannel(event.channel);
              });
          });
        });
      });
    });
  });

  conns[0].on('peerconnection', function(peerconnection, channels)
  {
    ok(true, conns[0].sessionID+' peerconnection: '+peerconnection.sessionID);

    if(conns[3] && conns[3].sessionID == peerconnection.sessionID)
    {
      ok(true, conns[0].sessionID+' connected to '+conns[3].sessionID);

      var peers = Object.keys(conns[0].peers);
      equal(peers.length, 2, "conns[0] peers: "+peers);


      // Answer message from conns[2]

      function initDataChannel(channel)
      {
        if(channel.label == 'test')
          channel.addEventListener('message', function(event)
          {
            var message = event.data;
            equal(message, 'ping', 'Received message: '+message);

            if(message == 'ping')
              this.send('pong');
          });
      };

      if(channels.length)
        for(var i=0, channel; channel=channels[i]; i++)
          initDataChannel(channel);
      else
        peerconnection.addEventListener('datachannel', function(event)
        {
          initDataChannel(event.channel);
        });
    };
  });

  conns[0].on('peersManager.connected', function(_peersManager)
  {
    ok(true, conns[0].sessionID+' peersManager.connected');

    var peers = Object.keys(conns[0].peers);
    equal(peers.length, 1, conns[0].sessionID+' peers: '+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, conns[0].sessionID+' _connectors: '+_connectors.length);
    console.log(_connectors);
  });
});
 */