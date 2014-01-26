QUnit.module("3 peers");


//  Connect to only one new peer over PubNub
var options1 =
{
  handshake_servers:
  [
    {
      type: "PubNub",
      config_init:
      {
        publish_key  : "pub-6ee5d4df-fe10-4990-bbc7-c1b0525f5d2b",
        subscribe_key: "sub-e5919840-3564-11e2-b8d0-c7df1d04ae4a",
        ssl          : true,

        "max_connections" : 1
      },
      config_mess:
      {
        channel: "ShareIt"
      }
    }
  ],
  uid: "Peer 1"
};

// Connect to current peers over PubNub
var options2 =
{
  handshake_servers:
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
      }
    }
  ],
  uid: "Peer 2"
};

// Connect to current peers over PubNub
var options3 =
{
  handshake_servers:
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
      }
    }
  ],
  uid: "Peer 3"
};


test("Connect three peers to PubNub at the same time", function()
{
  var pendingTests = 3;

  expect(pendingTests);
  stop(pendingTests);

  var conn1 = new WebP2P(options1);
  var conn2 = new WebP2P(options2);
  var conn3 = new WebP2P(options3);

  function tearDown()
  {
    if(--pendingTests <= 0)
    {
      conn1.close();
      conn2.close();
      conn3.close();
    };

    start();
  };

  // Conn 1

  conn1.on('connected', function()
  {
    ok(true, "Conn1 SessionID: "+conn1.sessionID);

    tearDown()
  });

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);

    tearDown()
  });

  // Conn 2

  conn2.on('connected', function()
  {
    ok(true, "Conn2 SessionID: "+conn2.sessionID);

    tearDown()
  });

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: "+error);

    tearDown()
  });

  // Conn 3

  conn3.on('connected', function()
  {
    ok(true, "Conn2 SessionID: "+conn3.sessionID);

    tearDown()
  });

  conn3.on('error', function(error)
  {
    ok(false, "Conn3 error: "+error);

    tearDown()
  });
});

test("Interconnect three peers", function()
{
  var pendingTests = 6;

  expect(pendingTests);
  stop(pendingTests);

  var conn1 = new WebP2P(options1);
  var conn2 = new WebP2P(options2);
  var conn3 = new WebP2P(options3);

  function tearDown()
  {
    if(--pendingTests <= 0)
    {
      conn1.close();
      conn2.close();
      conn3.close();
    };

    start();
  };

  // Conn 1

  conn1.on('peerconnection', function(peerconnection)
  {
    var peers = conn1.peers;

    notDeepEqual(peers, {}, "Conn1 peers: "+Object.keys(peers));

    tearDown();
  });

/*
  conn1.on('handshakeManager.disconnected', function(event)
  {
    ok(true, "Conn1: "+JSON.stringify(event.handshakeManager));
    start();
  });
*/

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);

    tearDown();
  });

  // Conn 2

  conn2.on('peerconnection', function(peerconnection)
  {
    var peers = conn2.peers;

    notDeepEqual(peers, {}, "Conn2 peers: "+Object.keys(peers));

    tearDown();
  });

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: "+error);

    tearDown();
  });

  // Conn 3

  conn3.on('peerconnection', function(peerconnection)
  {
    var peers = conn3.peers;

    notDeepEqual(peers, {}, "Conn3 peers: "+Object.keys(peers));

    tearDown();
  });

  conn3.on('error', function(error)
  {
    ok(false, "Conn3 error: "+error);

    tearDown();
  });
});


test("Exchange data between three peers", function()
{
  var pendingTests = 6;

  expect(pendingTests);
  stop(pendingTests);

  options1.commonLabels = ['test'];
  options2.commonLabels = ['test'];
  options3.commonLabels = ['test'];

  var conn1 = new WebP2P(options1);
  var conn2 = new WebP2P(options2);
  var conn3 = new WebP2P(options3);


  function tearDown()
  {
    if(--pendingTests <= 0)
    {
      conn1.close();
      conn2.close();
      conn3.close();
    };

    start();
  };


  function initPeerConnection(peerconnection)
  {
//    console.log('PeerConnection', peerconnection);

    var channels = peerconnection.getDataChannels();
    if(channels.length)
    {
//      console.log(channels);

      function initDataChannel(channel)
      {
        if(channel.label == 'test')
          channel.addEventListener('message', function(event)
          {
            var message = event.data;

            equal(message, 'ping', 'Received message: '+event.data);

            this.send('pong');

            tearDown();
          });
      };

      for(var i=0, channel; channel=channels[i]; i++)
        initDataChannel(channel);
    }

    else
      peerconnection.addEventListener('datachannel', function(event)
      {
        var channel = event.channel;
        var label = channel.label;

        if(label == 'test')
        {
          channel.addEventListener('message', function(event)
          {
            var message = event.data;

            equal(message, 'pong', 'Received message: '+event.data);

            tearDown();
          });

          channel.addEventListener('open', function()
          {
            channel.send('ping');
          });
        }
      });
  };


  // Conn 1

  conn1.on('peerconnection', initPeerConnection);

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);
    tearDown();
  });


  // Conn 2

  conn2.on('peerconnection', initPeerConnection);

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: "+error);
    tearDown();
  });


  // Conn 3

  conn3.on('peerconnection', initPeerConnection);

  conn3.on('error', function(error)
  {
    ok(false, "Conn3 error: "+error);
    tearDown();
  });
});
