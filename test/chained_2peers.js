QUnit.module("2 peers chained",
{
  setup: function()
  {
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
        },
        max_connections: 1
      }
    ];

    this.options =
    [
      {
        handshake_servers: handshake_servers,
        commonLabels: ['test'],
        sessionID: "Peer 1"
      },
      {
        handshake_servers: handshake_servers,
        commonLabels: ['test'],
        sessionID: "Peer 2"
      }
    ];

    this.conns = [];
  },

  teardown: function()
  {
    this.conns.forEach(function(conn)
    {
      conn.close();
    });
  }
});


asyncTest("Connect two peers with no intermediaries",
function()
{
  expect(16);

  createPeer_connect.call(this, 0, 1)
});


asyncTest("Exchange data between two peers with no intermediaries",
function()
{
  expect(14);

  createPeer_exchange.call(this, 0, 1)
});
