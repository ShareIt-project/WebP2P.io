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