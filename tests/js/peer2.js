module("2 peers");

asyncTest("Connect to current peers over PubNub", 2, function()
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
    uid: "Peer 2"
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

    notDeepEqual(peers, {}, "Connected to previous peers: "+JSON.stringify(peers));

    start();
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});