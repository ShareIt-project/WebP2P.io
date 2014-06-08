if(typeof require === 'function')
{
  if(typeof QUnit === 'undefined')
    QUnit = require('qunit-cli');

  var WebP2P = require('..');
};


QUnit.module("1 peer",
{
  setup: function()
  {
//    console.debug('***'+QUnit.config.current.testNumber+'. '+QUnit.config.current.testName+'***');
  },

  teardown: function()
  {
//    console.debug('***'+QUnit.config.current.testNumber+'. '+QUnit.config.current.testName+'***');
  }
});


//test("Internet is connected", function()
//{
//  new WebP2P();
//
//  ok(true, "Passed!");
//});

QUnit.test("No options", function()
{
  var conn = new WebP2P();

  conn.close();

  QUnit.ok(true, "Passed!");
});

/*
QUnit.test("No handshake servers defined", function()
{
  var options =
  {
    handshake_servers: []
  }

  QUnit.throws(function()
  {
    new WebP2P(options);
  },
  Error);
});
*/

QUnit.asyncTest("Connect to PubNub", function()
{
  QUnit.expect(2);

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
    QUnit.ok(true, "SessionID: "+conn.sessionID);

    conn.close();
  });

  conn.on('disconnected', function()
  {
    QUnit.ok(true, "Disconnected");

    QUnit.start();
  });

  conn.on('error', function(error)
  {
    QUnit.ok(false, "Error: "+error);

    conn.close();

    QUnit.start();
  });
});

QUnit.asyncTest("Connect to xRTML", function()
{
  QUnit.expect(2);

  var options =
  {
    handshake_servers:
    [
      {
        type: "xRTML",
        config_init:
        {
          application_key     : 'ESqhZz',
          authentication_token: 'be3501d2896f4b76bd631981896ccb03'
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
    QUnit.ok(true, "SessionID: "+conn.sessionID);

    conn.close();
  });

  conn.on('disconnected', function()
  {
    QUnit.ok(true, "Disconnected");

    QUnit.start();
  });

  conn.on('error', function(error)
  {
    QUnit.ok(false, "Error: "+error);

    conn.close();

    QUnit.start();
  });
});

QUnit.asyncTest("Connect to XMPP", function()
{
  QUnit.expect(2);

  var options =
  {
    handshake_servers:
    [
      {
        type: "XMPP",
        config_init:
        {
          jid: 'anonymous.chatme.im',
//          credentials: true,
          preferred: 'ANONYMOUS',
          bosh:
          {
            url: 'http://bosh.metajack.im:5280/xmpp-httpbind'  // Open BoSH server
          },
      //    websockets:
      //    {
      //      url:
      //    }
        },
        config_mess:
        {
          channel: 'webp2p',
          muc_server: 'conference.chatme.im'  // muc.jappix.org
        }
      }
    ]
  };

  var conn = new WebP2P(options);

  conn.on('connected', function()
  {
    QUnit.ok(true, "SessionID: "+conn.sessionID);

    conn.close();
  });

  conn.on('disconnected', function()
  {
    QUnit.ok(true, "Disconnected");

    QUnit.start();
  });

  conn.on('error', function(error)
  {
    QUnit.ok(false, "Error: "+error);

    conn.close();

    QUnit.start();
  });
});
