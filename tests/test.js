QUnit.log(function(details)
{
  console.log("Log: ", details.result, details.message);
});


module("1 peer");


test("No options", function()
{
  var conn = new WebP2P();

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
    start();
  });
});


module("2 peers");


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


var conn1 = new WebP2P(options1);
var conn2 = new WebP2P(options2);


asyncTest("Connect to PubNub", function()
{
  // Conn 1

  conn1.on('connected', function()
  {
    ok(true, "Conn1 SessionID: "+conn1.sessionID);
    start();
  });

  conn1.on('error', function(error)
  {
    ok(false, "Conn1 error: "+error);
    start();
  });

  // Conn 2

  conn2.on('connected', function()
  {
    ok(true, "Conn2 SessionID: "+conn2.sessionID);
    start();
  });

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: "+error);
    start();
  });
});

asyncTest(
"Conn1 connect to current peers over PubNub,"+
"Conn2 connect to new peer and disconnect from handshakeManager",
function()
{
  // Conn 1

  conn1.on('peerconnection', function(peerconnection)
  {
    ok(true, "Conn1 PeerConnection: "+peerconnection);

    peerconnection.addEventListener('signalingstatechange', function()
    {
      if(peerconnection.signalingState == 'open')
      {
        var peers = conn1.getPeers();

        notDeepEqual(peers, {}, "Conn1 peers: "+JSON.stringify(peers));
      }
    })
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
    ok(false, "Conn1 error: ", error);
    start();
  });

  // Conn 2

  conn2.on('peerconnection', function(peerconnection)
  {
    ok(true, "Conn2 PeerConnection: ",peerconnection);

    peerconnection.addEventListener('signalingstatechange', function()
    {
      if(peerconnection.signalingState == 'open')
      {
        var peers = conn2.getPeers();

        notDeepEqual(peers, {}, "Conn2 peers: "+JSON.stringify(peers));

        start();
      }
    })
  });

  conn2.on('error', function(error)
  {
    ok(false, "Conn2 error: ", error);
    start();
  });
});