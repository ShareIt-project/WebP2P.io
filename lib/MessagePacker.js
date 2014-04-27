var RpcBuilder = require('rpc-builder');

var packer = require('./packer');


const MAX_TTL_DEFAULT = 5;


function MessagePacker(sessionID)
{
  var rpcBuilder = new RpcBuilder(packer);


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
    var message =
    {
      from: sessionID
    };

    return rpcBuilder.encode('presence', message);
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
      from: sessionID,
      sdp:  sdp,
      ttl:  Math.min(ttl || MAX_TTL_DEFAULT, MAX_TTL_DEFAULT)
    };

    // Return the packed message
    return rpcBuilder.encode('offer', message, dest, callback);
  };
};


module.exports = MessagePacker;
