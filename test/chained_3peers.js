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

var options1 =
{
  handshake_servers: handshake_servers,
  sessionID: "Peer 1"
};

var options2 =
{
  handshake_servers: handshake_servers,
  sessionID: "Peer 2"
};

var options3 =
{
  handshake_servers: handshake_servers,
  sessionID: "Peer 3"
};


asyncTest("Connect two peers using a third one as intermediary",
function()
{
  expect(24);

  var conn1, conn2, conn3;


  // Conn 1

  conn1 = new WebP2P(options1);

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);

    conn1.close();
    start();
  });

  conn1.on('peerconnection', function(peerconnection)
  {
    ok(true, "Conn1 PeerConnection: "+peerconnection.sessionID);

    if(conn3 && conn3.sessionID == peerconnection.sessionID)
    {
      ok(true, 'Conn1 connected to Conn3');

      var peers = Object.keys(conn1.peers);
      equal(peers.length, 2, "Conn1 peers: "+peers);
    };
  });

  conn1.on('handshakeManager.connected', function()
  {
    ok(true, "Conn1 handshakeManager.connected. SessionID: "+conn1.sessionID);


    // Conn 2

    conn2 = new WebP2P(options2);

    conn2.on('error', function(error)
    {
      ok(false, "Conn2 error: "+error);

      conn1.close();
      conn2.close();
      start();
    });

    conn2.on('peerconnection', function(peerconnection)
    {
      ok(true, "Conn2 PeerConnection: "+peerconnection.sessionID);
    });

    conn2.on('handshakeManager.connected', function()
    {
      ok(true, "Conn2 handshakeManager.connected. SessionID: "+conn2.sessionID);
    });

    conn2.on('handshakeManager.disconnected', function()
    {
      ok(true, 'Conn2 handshakeManager.disconnected');
    });

    conn2.on('peersManager.connected', function(_peersManager)
    {
      ok(true, 'Conn2 peersManager.connected');

      var peers = Object.keys(conn2.peers);
      equal(peers.length, 1, "Conn2 peers: "+peers);

      var _connectors = _peersManager._connectors;
      equal(_connectors.length, 1, "Conn2 _connectors: "+_connectors.length);
      console.log(_connectors);
    });
  });

  conn1.on('handshakeManager.disconnected', function()
  {
    ok(true, 'Conn1 handshakeManager.disconnected');
  });

  conn1.on('peersManager.connected', function(_peersManager)
  {
    ok(true, 'Conn1 peersManager.connected');

    var peers = Object.keys(conn1.peers);
    equal(peers.length, 1, "Conn1 peers: "+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, "Conn1 _connectors: "+_connectors.length);
    console.log(_connectors);


    // Conn 3

    conn3 = new WebP2P(options3);

    conn3.on('error', function(error)
    {
      ok(false, "Conn3 error: "+error.message);
      console.error(error);

      conn1.close();
      conn2.close();
      conn3.close();
      start();
    });

    conn3.on('peerconnection', function(peerconnection)
    {
      ok(true, "Conn3 PeerConnection: "+peerconnection.sessionID);

      if(conn1.sessionID == peerconnection.sessionID)
      {
        conn1.close();
        conn2.close();
        conn3.close();
        start();
      }
    });

    conn3.on('handshakeManager.connected', function()
    {
      ok(true, "Conn3 handshakeManager.connected. SessionID: "+conn3.sessionID);
    });

    conn3.on('peersManager.connected', function(_peersManager)
    {
      ok(true, 'Conn3 peersManager.connected');

      var peers = Object.keys(conn3.peers);
      equal(peers.length, 1, "Conn3 peers: "+peers);

      var _connectors = _peersManager._connectors;
      equal(_connectors.length, 1, "Conn3 _connectors: "+_connectors.length);
      console.log(_connectors);


      conn3.connectTo(conn1.sessionID, function(error, peer)
      {
        if(error) return ok(false, error);

        equal(conn1.sessionID, peer.sessionID,
              'Conn3 connected to Conn1: '+peer.sessionID);

        var peers = Object.keys(conn3.peers);
        equal(peers.length, 2, "Conn3 peers: "+peers);
      });
    });
  });
});


asyncTest("Exchange data between two peers connected using a another one as intermediary",
function()
{
  expect(15);

  options1.commonLabels = ['test'];
  options2.commonLabels = ['test'];
  options3.commonLabels = ['test'];

  var conn1, conn2, conn3;


  // Conn 1

  conn1 = new WebP2P(options1);

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);

    conn1.close();
    start();
  });

  conn1.on('peerconnection', function(peerconnection, channels)
  {
    ok(true, "Conn1 PeerConnection: "+peerconnection.sessionID);

    if(conn3 && conn3.sessionID == peerconnection.sessionID)
    {
      ok(true, 'Conn1 connected to Conn3');

      var peers = Object.keys(conn1.peers);
      equal(peers.length, 2, "Conn1 peers: "+peers);


      // Answer message from conn3

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

  conn1.on('handshakeManager.connected', function()
  {
    ok(true, "Conn1 handshakeManager.connected. SessionID: "+conn1.sessionID);


    // Conn 2

    conn2 = new WebP2P(options2);

    conn2.on('error', function(error)
    {
      ok(false, "Conn2 error: "+error);

      conn1.close();
      conn2.close();
      start();
    });

//    conn2.on('peersManager.connected', function(_peersManager)
//    {
//      ok(true, 'Conn2 peersManager.connected');
//
//      var peers = Object.keys(conn2.peers);
//      equal(peers.length, 1, "Conn2 peers: "+peers);
//
//      var _connectors = _peersManager._connectors;
//      equal(_connectors.length, 1, "Conn2 _connectors: "+_connectors.length);
//      console.log(_connectors);
//    });
  });

  conn1.on('peersManager.connected', function(_peersManager)
  {
    ok(true, 'Conn1 peersManager.connected');

    var peers = Object.keys(conn1.peers);
    equal(peers.length, 1, "Conn1 peers: "+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, "Conn1 _connectors: "+_connectors.length);
    console.log(_connectors);


    // Conn 3

    conn3 = new WebP2P(options3);

    conn3.on('error', function(error)
    {
      ok(false, "Conn3 error: "+error.message);
      console.error(error);

      conn1.close();
      conn2.close();
      conn3.close();
      start();
    });

    conn3.on('peersManager.connected', function(_peersManager)
    {
      ok(true, 'Conn3 peersManager.connected');

      var peers = Object.keys(conn3.peers);
      equal(peers.length, 1, "Conn3 peers: "+peers);

      var _connectors = _peersManager._connectors;
      equal(_connectors.length, 1, "Conn3 _connectors: "+_connectors.length);
      console.log(_connectors);


      conn3.connectTo(conn1.sessionID, function(error, peerconnection, channels)
      {
        if(error) return ok(false, error);

        equal(conn1.sessionID, peerconnection.sessionID,
              'Conn3 connected to Conn1: '+peerconnection.sessionID);

        var peers = Object.keys(conn3.peers);
        equal(peers.length, 2, "Conn3 peers: "+peers);


        // Send message to conn1

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
                conn1.close();
                conn2.close();
                conn3.close();
                start();
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