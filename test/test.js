QUnit.log(function(details)
{
  if(details.result)
    console.log("Log: ", details.message);
  else
    console.warn("Log: ", details.message);
});


QUnit.module("1 peer");


//test("Internet is connected", function()
//{
//  new WebP2P();
//
//  ok(true, "Passed!");
//});

test("No options", function()
{
  new WebP2P();

  ok(true, "Passed!");
});

/*
test("No handshake servers defined", function()
{
  var options =
  {
    handshake_servers: []
  }

  throws(function()
  {
    new WebP2P(options);
  },
  Error);
});
*/

asyncTest("Connect to PubNub", function()
{
  expect(2);

  var options =
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
    ]
  };

  var conn = new WebP2P(options);

  conn.on('connected', function()
  {
    ok(true, "SessionID: "+conn.sessionID);

    conn.close();
  });

  conn.on('disconnected', function()
  {
    ok(true, "Disconnected");

    start();
  });

  conn.on('error', function(error)
  {
    ok(false, "Error: "+error);

    conn.close();

    start();
  });
});


QUnit.module("2 peers");


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


asyncTest("Connect two peers to PubNub at the same time", function()
{
  var pendingTests = 2;

  expect(pendingTests);
  stop();

  var conn1 = new WebP2P(options1);
  var conn2 = new WebP2P(options2);

  function tearDown()
  {
    if(--pendingTests <= 0)
    {
      conn1.close();
      conn2.close();
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
});

asyncTest("Interconnect two peers", function()
{
  var pendingTests = 2;

  expect(4);
  stop();

  var conn1 = new WebP2P(options1);
  var conn2 = new WebP2P(options2);

  function tearDown()
  {
    if(--pendingTests <= 0)
    {
      conn1.close();
      conn2.close();
    };

    start();
  };

  // Conn 1

  conn1.on('peerconnection', function(peerconnection)
  {
    ok(true, "Conn1 PeerConnection: "+peerconnection.sessionID);

    var peers = conn1.peers;

    notDeepEqual(peers, {}, "Conn1 peers: "+JSON.stringify(peers));

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
    ok(true, "Conn2 PeerConnection: "+peerconnection.sessionID);

    var peers = conn2.peers;

    notDeepEqual(peers, {}, "Conn2 peers: "+JSON.stringify(peers));

    tearDown();
  });

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: "+error);

    tearDown();
  });
});


test("Exchange data between two peers", function()
{
  expect(4);
  stop(4);

  function initChannel(channel, ping, pong)
  {
    if(channel.label == 'test')
    {
      channel.addEventListener('message', function(event)
      {
        var message = event.data;

        equal(message, pong, 'Received message: '+event.data);

        start();
      });

      function send()
      {
        channel.send(ping);

        start();
      };

      if(channel.readyState == 'open')
        send()
      else
        channel.addEventListener('open', send);
    }
  };

  // Conn 1

  options1.commonLabels = ['test'];
  options2.commonLabels = ['test'];

  var conn1 = new WebP2P(options1);

  conn1.on('peerconnection', function(peerconnection)
  {
    ok(true, "Conn1 PeerConnection: "+peerconnection.sessionID);

    var channels = peerconnection.getDataChannels();
    if(channels.length)
    {
      console.log("Conn1 channels",channels);

      for(var i=0, channel; channel=channels[i]; i++)
        initChannel(channel, 'conn1', 'conn2');
    }

    else
      peerconnection.addEventListener('datachannel', function(event)
      {
        var channel = event.channel;
        var label = channel.label;

        console.log("Conn1 datachannel: "+label);

        initChannel(channel, 'conn1', 'conn2');
      });
  });

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);
    start();
  });

  // Conn 2

  var conn2 = new WebP2P(options2);

  conn2.on('peerconnection', function(peerconnection)
  {
    ok(true, "Conn2 PeerConnection: "+peerconnection.sessionID);

    var channels = peerconnection.getDataChannels();
    if(channels.length)
    {
      console.log("Conn2 channels",channels);

      for(var i=0, channel; channel=channels[i]; i++)
        initChannel(channel, 'conn2', 'conn1');
    }

    else
      peerconnection.addEventListener('datachannel', function(event)
      {
        var channel = event.channel;
        var label = channel.label;

        console.log("Conn2 datachannel: "+label);

        initChannel(channel, 'conn2', 'conn1');
      });
  });

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: "+error);
    start();
  });
});
