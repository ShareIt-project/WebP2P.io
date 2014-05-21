function melée(numPeers)
{
  function onconnected()
  {
    ok(true, this.sessionID+' connected');

    start()
  };

  function onpeerconnection(peerconnection, channels)
  {
    var self = this;

    if(channels.length)
      channels.forEach(function(channel)
      {
        if(channel.label == 'test')
          channel.addEventListener('message', function(event)
          {
            var message = event.data;
            equal(message, 'ping', self.sessionID+' received PING from '+peerconnection.sessionID);

            this.send('pong');

            start();
          });
      });

    else
      peerconnection.addEventListener('datachannel', function(event)
      {
        var channel = event.channel;
        var label = channel.label;

        if(label == 'test')
        {
          channel.addEventListener('message', function(event)
          {
            var message = event.data;
            equal(message, 'pong', self.sessionID+' received PONG from '+peerconnection.sessionID);

            start();
          });

          channel.addEventListener('open', function()
          {
            channel.send('ping');
          });
        }
      });
  };


  function onerror(error)
  {
    ok(false, this.sessionID+' error: '+error);

    start()
  };


  QUnit.module(numPeers+' peers melée',
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
          }
        }
      ];

      this.conns = new Array(numPeers);

      for(var i=0; i<this.conns.length; i++)
      {
        var option =
        {
          handshake_servers: handshake_servers,
          commonLabels: ['test'],
          sessionID: 'Peer '+i,
        };

        this.conns[i] = new WebP2P(option);
      }
    },

    teardown: function()
    {
      this.conns.forEach(function(conn)
      {
        conn.close();
      });
    }
  });


  test('Connect '+numPeers+' peers to PubNub at the same time', function()
  {
    expect(numPeers);
    stop(numPeers);

    this.conns.forEach(function(conn)
    {
      conn.on('connected', onconnected);
      conn.on('error',     onerror);
    });
  });


  test('Interconnect '+numPeers+' peers', function()
  {
    expect(2*numPeers);
    stop(numPeers);


    var connectedPeers = {};

    function onpeerconnection(peerconnection)
    {
      var sessionID = this.sessionID;

      ok(true, sessionID+' onpeerconnection: '+peerconnection.sessionID);

      var peers = Object.keys(this.peers);

      equal(peers.length, (connectedPeers[sessionID] || []).length+1,
            sessionID+' peers: '+peers);

      connectedPeers[sessionID] = peers;

      start();
    };


    this.conns.forEach(function(conn)
    {
      conn.on('peerconnection', onpeerconnection);
      conn.on('error',          onerror);
    });
  });


  test('Exchange data between '+numPeers+' peers', function()
  {
    var n = numPeers - 1;

    var links = n*(n+1)/2;  // http://en.wikipedia.org/wiki/Triangular_number

    expect(2*links);
    stop(2*links);

    this.conns.forEach(function(conn)
    {
      conn.on('peerconnection', onpeerconnection);
      conn.on('error',          onerror);
    });
  });
};


//for(var i=2; i<=6; i++)
for(var i=2; i<=3; i++)
  melée(i);
