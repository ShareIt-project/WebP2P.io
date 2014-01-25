var options =
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

var conn = new WebP2P(options);


QUnit.config.reorder = false;

module("3 peers - Connect to new peers over P2P mesh");

asyncTest("Connect to PubNub", function()
{
  conn.addEventListener('connected', function(event)
  {
    ok(true, "Own UID: "+event.uid);
    start();
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});

asyncTest("Connect to current peers over PubNub", 2, function()
{
  conn.addEventListener('peerconnection', function(event)
  {
    var peers = conn.getPeers();

    switch(event.uid)
    {
      case "Peer 1":
      {
        var peerconnection = event.peerconnection;

        ok(true, "PeerConnection: "+peerconnection);

        peerconnection.addEventListener('open', function()
        {
          notEqual(peers["Peer 1"], undefined, "Connected to Peer 1");
          equal   (peers["Peer 3"], undefined, "Not yet connected to Peer 3");

          start();
        })
      }
      break;

      case "Peer 3":
      {
        ok(true, "Peer 3");
      }
      break;

      default:
      {
        ok(false, "Unknown peer: "+event.uid);
        start();
      }
    }
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});

asyncTest("Connect to new peer", function()
{
  conn.addEventListener('peerconnection', function(event)
  {
    var peers = conn.getPeers();

    switch(event.uid)
    {
      case "Peer 1":
      {
        ok(true, "Peer 1");
      }
      break;

      case "Peer 3":
      {
        var peerconnection = event.peerconnection;

        ok(true, "PeerConnection: "+peerconnection);

        peerconnection.addEventListener('open', function()
        {
          notEqual(peers["Peer 1"], undefined, "Connected to Peer 1");
          notEqual(peers["Peer 3"], undefined, "Connected to Peer 3");

          start();
        })
      }
      break;

      default:
      {
        ok(false, "Unknown peer: "+event.uid);
        start();
      }
    }
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});