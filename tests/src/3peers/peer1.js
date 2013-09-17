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

        "max_connections" : 1
      }
    ]
  ],
  uid: "Peer 1"
};

var conn = new WebP2P(options);


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

asyncTest("Connect to peer, disconnect from handshakeManager", function()
{
  conn.addEventListener('peerconnection', function(event)
  {
    var peers = conn.getPeers();

    switch(event.uid)
    {
      case "Peer 2":
      {
        notEqual(peers["Peer 2"], undefined, "Connected to Peer 2");
        equal   (peers["Peer 3"], undefined, "Not yet connected to Peer 3");

        start();
      }
      break;

      default:
      {
        ok(false, "Unknown peer: "+event.uid);
        start();
      }
    }
  });

  conn.addEventListener('handshakeManager.disconnected', function(event)
  {
    ok(true, JSON.stringify(event.handshakeManager));
  });

  conn.addEventListener('error', function(event)
  {
    ok(false, "Error: "+event.error);
    start();
  });
});

asyncTest("Receive connection from Peer 3 over the mesh network", function()
{
  conn.addEventListener('peerconnection', function(event)
  {
    var peers = conn.getPeers();

    switch(event.uid)
    {
      case "Peer 2":
      {
        ok(true, "Peer 2");
      }
      break;

      case "Peer 3":
      {
        notEqual(peers["Peer 2"], undefined, "Connected to Peer 2");
        notEqual(peers["Peer 3"], undefined, "Connected to Peer 3");

        start();
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