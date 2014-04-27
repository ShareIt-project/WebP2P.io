function tearDown(conns)
{
  for(var i=0, conn; conn=conns[i]; i++)
    conn.close();

  start();
};


function createPeer_connect(conns, index, lastIndex)
{
  var conn = conns[index] = new WebP2P(options[index]);


  // Common events

  conn.on('error', function(error)
  {
    ok(false, conn.sessionID+' error: '+error.message);
    console.error(error);

    tearDown(conns);
  });

  conn.on('handshakeManager.connected', function()
  {
    ok(true, conn.sessionID+' handshakeManager.connected');
  });

  conn.on('peerconnection', function(peerconnection)
  {
    ok(true, conn.sessionID+' peerconnection: '+peerconnection.sessionID);
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
      createPeer_connect(conns, 1, lastIndex);
    });

    conn.on('peerconnection', function(peerconnection)
    {
      if(conns[lastIndex])
      {
        equal(conns[lastIndex].sessionID, peerconnection.sessionID,
              conn.sessionID+' connected to '+conns[lastIndex].sessionID);

        var peers = Object.keys(conn.peers);
        equal(peers.length, 2, conn.sessionID+' peers: '+peers);
      };
    });
  };


  // Intermediary peers events

  if(0 < index && index < lastIndex)
  {
    conn.on('peerconnection', function(peerconnection)
    {
      if(conns[index-1].sessionID != peerconnection.sessionID)
      {
        if(conns[index+1]
        && conns[index+1].sessionID == peerconnection.sessionID)
          return;

        ok(false, conn.sessionID+' connected to '+peerconnection.sessionID);

        tearDown(conns)
      };
    });

    conn.on('peersManager.connected', function(_peersManager)
    {
      createPeer_connect(conns, index+1, lastIndex);
    });
  }


  // Last peer events

  if(index == lastIndex)
  {
    conn.on('peerconnection', function(peerconnection)
    {
      if(conns[0].sessionID == peerconnection.sessionID)
      {
        ok(true, conn.sessionID+' connected to '+peerconnection.sessionID);

        var peers = Object.keys(conns[index].peers);
        equal(peers.length, 2, conn.sessionID+' peers: '+peers);

        tearDown(conns)
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
        equal(peers.length, 2, conn.sessionID+' peers: '+peers);
      });
    });
  };
};
