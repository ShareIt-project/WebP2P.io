/**
 * Based on code from RPC-Builder
 */


const ERROR    = 0;
const PRESENCE = 1;
const OFFER    = 2;
const ANSWER   = 3;

const MAX_TTL_DEFAULT = 5;

const BASE_TIMEOUT = 5000;


function MessagePacker(sessionID)
{
  var self = this;

  var requestID = 0;

  var requests  = {};
  var responses = {};


  /**
   * Store the response to prevent to process duplicate request later
   */
  function storeResponse(message, dest, id)
  {
    message.stored = true;

    var response =
    {
      message: message,
      id: id,
      timeout: setTimeout(function()
      {
        clearTimeout(response.timeout);
        delete responses[dest];
      },
      BASE_TIMEOUT)
    };
    responses[dest] = response;
  };


  //
  // Pack & Unpack
  //

  this.pack = function(message, id)
  {
    var result = new Array(6);

    // Type
    var type = message.type;
    switch(type)
    {
      case "presence":
        result[0] = PRESENCE;
      break;

      case "offer":
        result[0] = OFFER;
      break;

      case "answer":
        result[0] = ANSWER;
      break;

      default:
      {
        var error = Error("Unknown message type '"+type+"'");
            error.message = message;

        throw error;
      };
    };

    // From
    result[1] = message.from || sessionID;

    // Offer & Answer

    if(result.type != PRESENCE)
    {
      result[2] = message.dest;
      result[3] = id || requestID++;
      result[4] = Math.min(message.ttl || MAX_TTL_DEFAULT, MAX_TTL_DEFAULT);
      result[5] = message.sdp;
    };

    return result;
  };

  this.unpack = function(message)
  {
    var result = {};

    var from = message[1];
    var id   = message[3];

    // Type
    var type = message[0];
    switch(type)
    {
      case PRESENCE:
        result.type = "presence";
      break;

      case OFFER:
        result.type = "offer";
      break;

      case ANSWER:
        result.type = "answer";
      break;

      default:
      {
        var error = Error("Unknown message type '"+type+"'");
            error.message = message;

        throw error;
      };
    };

    // From
    result.from = from;

    // Offer & Answer

    if(type != PRESENCE)
    {
      result.dest = message[2];
      result.ttl  = message[4];
      result.sdp  = message[5];

      result.pack = function()
      {
        return self.pack(this, id);
      };
    };

    // Dispatch responses callbacks
    if(result.type == 'offer')
    {
      // Check if it's a re-try
      var response = responses[from];
      if(response)
      {
        // Old message, ignore it
        if(response.id > id)
          return;

        // Updated message (or duplicated one), delete old response
        clearTimeout(response.timeout);
        delete responses[from];

        // Duplicated message, re-send it
        if(response.id == id)
        {
          var message = response.message;

          // Store the response to prevent to process duplicate request later
          storeResponse(message, from, id);

          // Return the stored response so it can be directly send back
          return message;
        };
      }
      else
        result.reply = function(dest, sdp)
        {
          var message = self.pack(
          {
            type: "answer",
            dest: dest,
            sdp:  sdp
          }, id);

          // Store the response to prevent to process duplicate request later
          storeResponse(message, dest, id);

          // Return the packed message
          return message;
        };
    };

    if(result.type == 'answer')
    {
      var request_ids = requests[from];
      if(request_ids)
      {
        var request = request_ids[id];
        if(request)
        {
          request.callback(error, result);

          // Return undefined to notify message has been procesed
          return;
        };
      };
    };

    // Return unpacked message
    return result;
  };


  //
  // Application dependent messages
  //

  this.presence = function()
  {
    var message = this.pack(
    {
      type: "presence"
    });

    // Return the packed message
    return message;
  };

  this.offer = function(dest, sdp, callback)
  {
    var message = this.pack(
    {
      type: "offer",
      dest: dest,
      sdp:  sdp
    });

    message.cancel = function(){};

    // Store callback if defined to be executed when received the response
    if(callback)
    {
      var request_ids = requests[dest] = requests[dest] || {};

      var id = message[3];

      var request = request_ids[id] =
      {
        message: message,
        callback: dispatchCallback,
        timeout:  setTimeout(function()
        {
          var error = new Error('Timed Out');
              error.request = message;

          dispatchCallback(error)
        },
        BASE_TIMEOUT)
      };

      message.cancel = function()
      {
        clearTimeout(request.timeout);

        delete request_ids[id];
        if(!Object.keys(request_ids).length)
          delete requests[dest];
      };

      function dispatchCallback(error, result)
      {
        message.cancel();

        callback(error, result);
      };
    };

    // Return the packed message
    return message;
  };
};


module.exports = MessagePacker;