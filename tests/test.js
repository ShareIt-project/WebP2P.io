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

  conn.addEventListener('connected', function(event)
  {
    ok(true, "UID: "+event.uid);

    conn.close();
  });

  conn.addEventListener('disconnected', function(event)
  {
    ok(true, "Disconnected");

    start();
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});


module("2 peers");


//  Connect to only one new peer over PubNub
var options1 =
{
  handshake_servers:
  [
    [
      "PubNub",
      {
        "channel"      : "ShareIt",
        "publish_key"  : "pub-6ee5d4df-fe10-4990-bbc7-c1b0525f5d2b",
        "subscribe_key": "sub-e5919840-3564-11e2-b8d0-c7df1d04ae4a",
        "ssl"          : true,

        "max_connections" : 1
      }
    ]
  ],
  uid: "Peer 1"
};

// Connect to current peers over PubNub
var options2 =
{
  handshake_servers:
  [
    [
      "PubNub",
      {
        "channel"      : "ShareIt",
        "publish_key"  : "pub-6ee5d4df-fe10-4990-bbc7-c1b0525f5d2b",
        "subscribe_key": "sub-e5919840-3564-11e2-b8d0-c7df1d04ae4a",
        "ssl"          : true,

        "max_connections" : 50
      }
    ]
  ],
  uid: "Peer 2"
};


var conn1 = new WebP2P(options1);
var conn2 = new WebP2P(options2);


asyncTest("Connect to PubNub", function()
{
  // Conn 1

  conn1.addEventListener('connected', function(event)
  {
    ok(true, "Conn1 UID: "+event.uid);
    start();
  });

  conn1.addEventListener('error', function(event)
  {
    ok(false, "Conn1 error: "+event.error);
    start();
  });

  // Conn 2

  conn2.addEventListener('connected', function(event)
  {
    ok(true, "Conn2 UID: "+event.uid);
    start();
  });

  conn2.addEventListener('error', function(event)
  {
    ok(false, "Conn2 error: "+event.error);
    start();
  });
});

asyncTest(
"Conn1 connect to current peers over PubNub,"+
"Conn2 connect to new peer and disconnect from handshakeManager",
function()
{
  // Conn 1

  conn1.addEventListener('peerconnection', function(event)
  {
    var peerconnection = event.peerconnection;

    ok(true, "Conn1 PeerConnection: "+peerconnection);

    peerconnection.addEventListener('open', function()
    {
      var peers = conn1.getPeers();

      notDeepEqual(peers, {}, "Conn1 peers: "+JSON.stringify(peers));
    })
  });

  conn1.addEventListener('handshakeManager.disconnected', function(event)
  {
    ok(true, "Conn1: "+JSON.stringify(event.handshakeManager));
    start();
  });

  conn1.addEventListener('error', function(event)
  {
    ok(false, "Conn1 error: "+event.error);
    start();
  });

  // Conn 2

  conn2.addEventListener('peerconnection', function(event)
  {
    var peerconnection = event.peerconnection;

    ok(true, "Conn2 PeerConnection: "+peerconnection);

    peerconnection.addEventListener('open', function()
    {
  	  var peers = conn2.getPeers();

      notDeepEqual(peers, {}, "Conn2 peers: "+JSON.stringify(peers));

      start();
    })
  });

  conn2.addEventListener('error', function(event)
  {
    ok(false, "Conn2 error: "+event.error);
    start();
  });
});