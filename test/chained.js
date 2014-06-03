function createPeer_connect(index, lastIndex)
{
  var self = this;

  var conns = this.conns;
  var conn  = conns[index] = new WebP2P(this.options[index]);


  // Common events

  conn.on('error', function(error)
  {
    ok(false, conn.sessionID+' error: '+error.message);
    console.error(error);

    start();
  });

  conn.on('handshakeManager.connected', function()
  {
    ok(true, conn.sessionID+' handshakeManager.connected');
  });

  conn.on('handshakeManager.disconnected', function()
  {
    ok(true, conn.sessionID+' handshakeManager.disconnected');
  });

  conn.on('peersManager.connected', function(_peersManager)
  {
    ok(true, conn.sessionID+' peersManager.connected');

    var peers = Object.keys(conn.peers);
    equal(peers.length, 1, conn.sessionID+' peers: '+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, conn.sessionID+' _connectors: '+_connectors.length);
    console.log(_connectors);
  });


  // First peer events

  if(index == 0)
  {
    conn.on('handshakeManager.connected', function()
    {
      createPeer_connect.call(self, 1, lastIndex);
    });

    conn.on('peerconnection', function(peerconnection, channels)
    {
      if(conns[lastIndex])
      {
        equal(conns[lastIndex].sessionID, peerconnection.sessionID,
              conn.sessionID+' connected to '+conns[lastIndex].sessionID);

        var peers = Object.keys(conn.peers);
        var expected = (lastIndex == 1) ? 1 : 2;
        equal(peers.length, expected, conn.sessionID+' peers: '+peers);
      };
    });
  };


  // Intermediary peers events

  if(0 < index && index < lastIndex)
  {
    conn.on('peerconnection', function(peerconnection, channels)
    {
      if(conns[index-1].sessionID != peerconnection.sessionID)
      {
        if(conns[index+1]
        && conns[index+1].sessionID == peerconnection.sessionID)
          return;

        ok(false, conn.sessionID+' connected to '+peerconnection.sessionID);

        start();
      };
    });

    conn.on('peersManager.connected', function(_peersManager)
    {
      createPeer_connect.call(self, index+1, lastIndex);
    });
  }


  // Last peer events

  if(index == lastIndex)
  {
    conn.on('peerconnection', function(peerconnection, channels)
    {
      if(conns[0].sessionID == peerconnection.sessionID)
      {
        ok(true, conn.sessionID+' connected to '+peerconnection.sessionID);

        var peers = Object.keys(conns[index].peers);
        var expected = (lastIndex == 1) ? 1 : 2;
        equal(peers.length, expected, conn.sessionID+' peers: '+peers);
      }
    });

    conn.on('peersManager.connected', function(_peersManager)
    {
      conn.connectTo(conns[0].sessionID, function(error, peerconnection)
      {
        if(error) return ok(false, error);

        equal(conns[0].sessionID, peerconnection.sessionID,
              conn.sessionID+' connected to '+peerconnection.sessionID);

        var peers = Object.keys(conn.peers);
        var expected = (lastIndex == 1) ? 1 : 2;
        equal(peers.length, expected, conn.sessionID+' peers: '+peers);

        start();
      });
    });
  };
};


function initDataChannel_first(channel)
{
  if(channel.label == 'test')
    channel.addEventListener('message', function(event)
    {
      var message = event.data;
      equal(message, 'ping', 'Received message: '+message);

      if(message == 'ping')
        this.send('pong');
    });
};

function initDataChannel_last(channel)
{
  function open()
  {
    channel.send('ping');
  };

  if(channel.label == 'test')
  {
    if(channel.readyState == 'open')
      open();
    else
      channel.addEventListener('open', open);

    channel.addEventListener('message', function(event)
    {
      var message = event.data;
      equal(message, 'pong', 'Received message: '+message);

      if(message == 'pong')
      {
        // Test successful
        console.info('* Success *');
        start();
      }
    });
  }
};


function createPeer_exchange(index, lastIndex)
{
  var self = this;

  var conns = this.conns;
  var conn  = conns[index] = new WebP2P(this.options[index]);


  // Common events

  conn.on('error', function(error)
  {
    ok(false, conn.sessionID+' error: '+error.message);
    console.error(error);

    start();
  });

  conn.on('handshakeManager.connected', function()
  {
    ok(true, conn.sessionID+' handshakeManager.connected.');
  });

  conn.on('peersManager.connected', function(_peersManager)
  {
    ok(true, conn.sessionID+' peersManager.connected');

    var peers = Object.keys(conn.peers);
    equal(peers.length, 1, conn.sessionID+' peers: '+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, conn.sessionID+' _connectors: '+_connectors.length);
    console.log(_connectors);
  })


  // First peer events

  if(index == 0)
  {
    conn.on('handshakeManager.connected', function()
    {
      createPeer_exchange.call(self, index+1, lastIndex);
    });

    conn.on('peerconnection', function(peerconnection, channels)
    {
      if(conns[lastIndex])
      {
        equal(conns[lastIndex].sessionID, peerconnection.sessionID,
              conn.sessionID+' connected to '+conns[lastIndex].sessionID);

        var peers = Object.keys(conn.peers);
        var expected = (lastIndex == 1) ? 1 : 2;
        equal(peers.length, expected, conn.sessionID+' peers: '+peers);


        // Answer message from last peer

        if(channels.length)
          channels.forEach(initDataChannel_first);
        else
          peerconnection.addEventListener('datachannel', function(event)
          {
            initDataChannel_first(event.channel);
          });
      };
    });
  };


  // Intermediary peers events

  if(0 < index && index < lastIndex)
    conn.on('peersManager.connected', function(_peersManager)
    {
      createPeer_exchange.call(self, index+1, lastIndex);
    });


  // Last peer events

  if(index == lastIndex)
    conn.on('peersManager.connected', function(_peersManager)
    {
      conn.connectTo(conns[0].sessionID, function(error, peerconnection, channels)
      {
        if(error) return ok(false, error);

        equal(conns[0].sessionID, peerconnection.sessionID,
              conn.sessionID+' connected to '+peerconnection.sessionID);

        var peers = Object.keys(conn.peers);
        var expected = (lastIndex == 1) ? 1 : 2;
        equal(peers.length, expected, conn.sessionID+' peers: '+peers);


        // Send message to conns[0]

        if(channels.length)
          channels.forEach(initDataChannel_last);
        else
          peerconnection.addEventListener('datachannel', function(event)
          {
            initDataChannel_last(event.channel);
          });
      });
    });
};


function chained(numPeers)
{
  QUnit.module(numPeers+' peers chained',
  {
    setup: function()
    {
      console.debug('***'+QUnit.config.current.testNumber+'. '+QUnit.config.current.testName+'***');

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

      this.options = new Array(numPeers);
      for(var i=0; i<numPeers; i++)
        this.options[i] =
        {
          handshake_servers: handshake_servers,
          commonLabels: ['test'],
          sessionID: 'Peer '+QUnit.config.current.testNumber+'.'+i
        };

      this.conns = [];
    },

    teardown: function()
    {
      this.conns.forEach(function(conn)
      {
        conn.close();
      });

      console.debug('***'+QUnit.config.current.testNumber+'. '+QUnit.config.current.testName+'***');
    }
  });


  asyncTest('Connect '+numPeers+' peers with '+(numPeers-2)+' intermediaries',
  function()
  {
    expect(6+numPeers*5);

    createPeer_connect.call(this, 0, numPeers-1)
  });


  asyncTest('Exchange data between two peers with '+(numPeers-2)+' intermediaries',
  function()
  {
    expect(6+numPeers*4);

    createPeer_exchange.call(this, 0, numPeers-1)
  });
};


for(var i=2; i<=6; i++)
  chained(i);
