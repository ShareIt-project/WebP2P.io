QUnit.module("3 peers chained");


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
  }
];


asyncTest("connect two peers using a third one as intermediaries",
function()
{
  expect(27);

  createPeer_connect([], 0, 2)
});


//asyncTest("connect two peers using a third one as intermediary",
//function()
//{
//  expect(24);

//  var conns = new Array(3);


//  conns[0] = new WebP2P(options[0]);

//  conns[0].on('error', function(error)
//  {
//    ok(false, "conns[0] error: "+error);

//    tearDown(conns);
//  });

//  conns[0].on('peerconnection', function(peerconnection)
//  {
//    ok(true, "conns[0] Peerconnection: "+peerconnection.sessionID);

//    if(conns[2] && conns[2].sessionID == peerconnection.sessionID)
//    {
//      ok(true, 'conns[0] connected to conns[2]');

//      var peers = Object.keys(conns[0].peers);
//      equal(peers.length, 2, "conns[0] peers: "+peers);
//    };
//  });

//  conns[0].on('handshakeManager.connected', function()
//  {
//    ok(true, "conns[0] handshakeManager.connected. SessionID: "+conns[0].sessionID);


//    conns[1] = new WebP2P(options[1]);

//    conns[1].on('error', function(error)
//    {
//      ok(false, "conns[1] error: "+error);

//      tearDown(conns);
//    });

//    conns[1].on('peerconnection', function(peerconnection)
//    {
//      ok(true, "conns[1] Peerconnection: "+peerconnection.sessionID);
//    });

//    conns[1].on('handshakeManager.connected', function()
//    {
//      ok(true, "conns[1] handshakeManager.connected. SessionID: "+conns[1].sessionID);
//    });

//    conns[1].on('handshakeManager.disconnected', function()
//    {
//      ok(true, 'conns[1] handshakeManager.disconnected');
//    });

//    conns[1].on('peersManager.connected', function(_peersManager)
//    {
//      ok(true, 'conns[1] peersManager.connected');

//      var peers = Object.keys(conns[1].peers);
//      equal(peers.length, 1, "conns[1] peers: "+peers);

//      var _connectors = _peersManager._connectors;
//      equal(_connectors.length, 1, "conns[1] _connectors: "+_connectors.length);
//      console.log(_connectors);
//    });
//  });

//  conns[0].on('handshakeManager.disconnected', function()
//  {
//    ok(true, 'conns[0] handshakeManager.disconnected');
//  });

//  conns[0].on('peersManager.connected', function(_peersManager)
//  {
//    ok(true, 'conns[0] peersManager.connected');

//    var peers = Object.keys(conns[0].peers);
//    equal(peers.length, 1, "conns[0] peers: "+peers);

//    var _connectors = _peersManager._connectors;
//    equal(_connectors.length, 1, "conns[0] _connectors: "+_connectors.length);
//    console.log(_connectors);


//    conns[2] = new WebP2P(options[2]);

//    conns[2].on('error', function(error)
//    {
//      ok(false, "conns[2] error: "+error.message);
//      console.error(error);

//      tearDown(conns);
//    });

//    conns[2].on('peerconnection', function(peerconnection)
//    {
//      ok(true, "conns[2] Peerconnection: "+peerconnection.sessionID);

//      if(conns[0].sessionID == peerconnection.sessionID)
//      {
//        // Test successful
//        console.info('* Success *');
//        tearDown(conns);
//      }
//    });

//    conns[2].on('handshakeManager.connected', function()
//    {
//      ok(true, "conns[2] handshakeManager.connected. SessionID: "+conns[2].sessionID);
//    });

//    conns[2].on('peersManager.connected', function(_peersManager)
//    {
//      ok(true, 'conns[2] peersManager.connected');

//      var peers = Object.keys(conns[2].peers);
//      equal(peers.length, 1, "conns[2] peers: "+peers);

//      var _connectors = _peersManager._connectors;
//      equal(_connectors.length, 1, "conns[2] _connectors: "+_connectors.length);
//      console.log(_connectors);


//      conns[2].connectTo(conns[0].sessionID, function(error, peer)
//      {
//        if(error) return ok(false, error);

//        equal(conns[0].sessionID, peer.sessionID,
//              'conns[2] connected to conns[0]: '+peer.sessionID);

//        var peers = Object.keys(conns[2].peers);
//        equal(peers.length, 2, "conns[2] peers: "+peers);
//      });
//    });
//  });
//});


asyncTest("Exchange data between two peers connected using a another one as intermediary",
function()
{
  expect(15);

  options[0].commonLabels = ['test'];
  options[1].commonLabels = ['test'];
  options[2].commonLabels = ['test'];

  var conns = new Array(3);


  // conns 1

  conns[0] = new WebP2P(options[0]);

  conns[0].on('error', function(error)
  {
    ok(false, "conns[0] error: "+error);

    tearDown(conns);
  });

  conns[0].on('peerconnection', function(peerconnection, channels)
  {
    ok(true, "conns[0] Peerconnection: "+peerconnection.sessionID);

    if(conns[2] && conns[2].sessionID == peerconnection.sessionID)
    {
      ok(true, 'conns[0] connected to conns[2]');

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

  conns[0].on('handshakeManager.connected', function()
  {
    ok(true, "conns[0] handshakeManager.connected. SessionID: "+conns[0].sessionID);


    // conns 2

    conns[1] = new WebP2P(options[1]);

    conns[1].on('error', function(error)
    {
      ok(false, "conns[1] error: "+error);

      tearDown(conns);
    });

//    conns[1].on('peersManager.connected', function(_peersManager)
//    {
//      ok(true, 'conns[1] peersManager.connected');
//
//      var peers = Object.keys(conns[1].peers);
//      equal(peers.length, 1, "conns[1] peers: "+peers);
//
//      var _connectors = _peersManager._connectors;
//      equal(_connectors.length, 1, "conns[1] _connectors: "+_connectors.length);
//      console.log(_connectors);
//    });
  });

  conns[0].on('peersManager.connected', function(_peersManager)
  {
    ok(true, 'conns[0] peersManager.connected');

    var peers = Object.keys(conns[0].peers);
    equal(peers.length, 1, "conns[0] peers: "+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, "conns[0] _connectors: "+_connectors.length);
    console.log(_connectors);


    // conns 3

    conns[2] = new WebP2P(options[2]);

    conns[2].on('error', function(error)
    {
      ok(false, "conns[2] error: "+error.message);
      console.error(error);

      tearDown(conns);
    });

    conns[2].on('peersManager.connected', function(_peersManager)
    {
      ok(true, 'conns[2] peersManager.connected');

      var peers = Object.keys(conns[2].peers);
      equal(peers.length, 1, "conns[2] peers: "+peers);

      var _connectors = _peersManager._connectors;
      equal(_connectors.length, 1, "conns[2] _connectors: "+_connectors.length);
      console.log(_connectors);


      conns[2].connectTo(conns[0].sessionID, function(error, peerconnection, channels)
      {
        if(error) return ok(false, error);

        equal(conns[0].sessionID, peerconnection.sessionID,
              'conns[2] connected to conns[0]: '+peerconnection.sessionID);

        var peers = Object.keys(conns[2].peers);
        equal(peers.length, 2, "conns[2] peers: "+peers);


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
                // Test successful
                console.info('* Success *');
                tearDown(conns);
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
