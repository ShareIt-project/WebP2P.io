QUnit.module("2 peers",
{
  setup: function()
  {
    this.conns = new Array(2);
  },

  teardown: function()
  {
    this.conns.forEach(function(conn)
    {
      conn.close();
    });
  }
});


asyncTest("Disconnect a peer from handshake channel after connecting to other peer",
function()
{
  var self = this;

  expect(7);


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
      }
    }
  ];

  var options =
  [
    {
      handshake_servers: handshake_servers,
      commonLabels: ['test'],
      sessionID: 'Peer 0'
    },
    {
      handshake_servers: handshake_servers,
      commonLabels: ['test'],
      sessionID: 'Peer 1'
    }
  ];

  options[0].handshake_servers[0].max_connections = 1;



  function onerror(error)
  {
    ok(false, this.sessionID+' error: '+error);

    start()
  };


  // Conn 1
  var conn1 = this.conns[0] = new WebP2P(options[0]);

  conn1.on('error', onerror);

  conn1.on('handshakeManager.connected', function()
  {
    ok(true, this.sessionID+' handshakeManager.connect');

    conn1.on('handshakeManager.disconnected', function()
    {
      ok(true, this.sessionID+' handshakeManager.disconnected');

      var peers = Object.keys(this.peers);

      equal(peers.length, 1, this.sessionID+' peers: '+peers);

      var status = this.status;
      equal(status, 'disconnected', this.sessionID+' status: '+status);

      start();
    });


    // Conn 2
    var conn2 = self.conns[1] = new WebP2P(options[1]);

    conn2.on('error', onerror);

    conn2.on('peerconnection', function(peerconnection)
    {
      equal(peerconnection.sessionID, self.conns[0].sessionID,
            this.sessionID+' connected to '+peerconnection.sessionID);

      var peers = Object.keys(this.peers);

      equal(peers.length, 1, this.sessionID+' peers: '+peers);

      var status = this.status;
      equal(status, 'connected', this.sessionID+' status: '+status);
    });
  });
});
