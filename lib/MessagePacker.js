var RpcBuilder = require('rpc-builder');

var packer = require('./packer');


const MAX_TTL_DEFAULT = 5;


function MessagePacker(sessionID)
{
  var options =
  {
    max_retries: 3,
    peerID: sessionID
  };

  var rpcBuilder = new RpcBuilder(packer, options);


  this.unpack = function(message)
  {
    return rpcBuilder.decode(message);
  };

  this.cancel = function(message)
  {
    rpcBuilder.cancel(message);
  }


  //
  // WebP2P.io requests
  //

  this.presence = function()
  {
    return rpcBuilder.encode('presence');
  };

  this.offer = function(dest, sdp, ttl, callback)
  {
    if(ttl instanceof Function)
    {
      if(callback)
        throw new SyntaxError("Nothing can be defined after the callback");

      callback = ttl;
      ttl = undefined;
    };

    var message =
    {
      dest: dest,
      sdp:  sdp,
      ttl:  Math.min(ttl || MAX_TTL_DEFAULT, MAX_TTL_DEFAULT)
    };

    // Return the packed message
    return rpcBuilder.encode('offer', message, dest, callback);
  };
};


module.exports = MessagePacker;
