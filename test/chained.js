var conns = new Array(4);
//var index = 0;


function createPeer(index)
{
  function tearDown()
  {
    for(var i=0, conn; conn=conns[i]; i++)
      conn.close();

    start();
  };

  conns[index] = new WebP2P(options3);

  conns[index].on('error', function(error)
  {
    ok(false, "Conn"+index+" error: "+error.message);
    console.error(error);

    tearDown();
  });

  conns[index].on('peersManager.connected', function(_peersManager)
  {
    ok(true, 'Conn'+index+' peersManager.connected');

    var peers = Object.keys(conns[index].peers);
    equal(peers.length, 1, "Conn"+index+" peers: "+peers);

    var _connectors = _peersManager._connectors;
    equal(_connectors.length, 1, "Conn"+index+" _connectors: "+_connectors.length);
    console.log(_connectors);


    // Create next connection on row

    createPeer(index++);

  });
};