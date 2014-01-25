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


QUnit.log(function( details )
{
  console.log("Log: ", details.result, details.message);
});

module("2 peers - Connect to current peers over PubNub");

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

asyncTest("Connect to current peers over PubNub", function()
{
  conn.addEventListener('peerconnection', function(event)
  {
    var peerconnection = event.peerconnection;

    ok(true, "PeerConnection: "+peerconnection);

    peerconnection.addEventListener('open', function()
    {
  	  var peers = conn.getPeers();

      notDeepEqual(peers, {}, "Peers: "+JSON.stringify(peers));

      start();
    })
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});