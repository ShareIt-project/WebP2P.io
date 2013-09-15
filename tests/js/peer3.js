module("3 peers");

asyncTest("Connect to peers over the mesh network", 3, function()
{
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
    uid: "Peer 3"
  };

  var conn = new WebP2P(options);

  conn.addEventListener('connected', function(event)
  {
    ok(true, "Own UID: "+event.uid);
//    start();
  });

  conn.addEventListener('peerconnection', function(event)
  {
    var peers = conn.getPeers();

    switch(event.uid)
    {
      case "Peer 1":
      {
        notEqual(peers["Peer 1"], undefined, "Connected to Peer 1");
        notEqual(peers["Peer 2"], undefined, "Connected to Peer 2");

        start();
      }
      break;

      case "Peer 2":
      {
        equal   (peers["Peer 1"], undefined, "Not yet connected to Peer 1");
        notEqual(peers["Peer 2"], undefined, "Connected to Peer 2");

        conn.connectTo("Peer 1")
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