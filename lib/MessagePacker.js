/**
 * Based on code from RPC-Builder
 */


const PRESENCE = 0;
const OFFER    = 1;
const ANSWER   = 2;

const MAX_TTL_DEFAULT = 5;

const BASE_TIMEOUT = 5000;


function MessagePacker(sessionID)
{
  var requestID = 0;

  var requests  = {};
  var responses = {};


  /**
   * Store the response to prevent to process duplicate request later
   */
  function storeResponse(message, dest)
  {
    message.stored = true;

    var response =
    {
      message: message,
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

  this.pack = function(message)
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
      var id = message.id  || requestID++;

      result[2] = message.dest;
      result[3] = id;
      result[4] = Math.min(message.ttl || MAX_TTL_DEFAULT, MAX_TTL_DEFAULT);
      result[5] = message.sdp;
    };

    return result;
  };

  this.unpack = function(message)
  {
    var result = {};

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
    result.from = message[1];

    // Offer & Answer

    if(type != PRESENCE)
    {
      result.dest = message[2];
      result.id   = message[3];
      result.ttl  = message[4];
      result.sdp  = message[5];
    };

    // Dispatch responses callbacks
    var from = result.from;
    var id   = result.id;

    if(result.type == 'offer')
    {
      // Check if it's a re-try
      var response = responses[from];
      if(response)
      {
        var message = response.message;

        // Old message, ignore it
        if(message.id > id)
          return;

        // Updated message (or duplicated one), delete old response
        clearTimeout(response.timeout);
        delete responses[from];

        // Duplicated message, re-send it
        if(message.id == id)
        {
          // Store the response to prevent to process duplicate request later
          storeResponse(message, from);

          // Return the stored response so it can be directly send back
          return message;
        };
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

    // Store callback if defined to be executed when received the response
    if(callback)
    {
      var request_ids = requests[dest] = requests[dest] || {};

      var id = message.id;

      var request_id = request_ids[id] =
      {
        callback: dispatchCallback,
        timeout:  setTimeout(function()
        {
          var error = new Error('Timed Out');
              error.request = message;

          dispatchCallback(error)
        },
        BASE_TIMEOUT)
      };

      function dispatchCallback(error, result)
      {
        clearTimeout(request_id.timeout);

        delete request_ids[id];
        if(!Object.keys(request_ids).length)
          delete requests[dest];

        callback(error, result);
      };
    };

    // Return the packed message
    return message;
  };

  this.answer = function(dest, id, sdp)
  {
    var message = this.pack(
    {
      type: "answer",
      dest: dest,
      id:   id,
      sdp:  sdp
    });

    // Store the response to prevent to process duplicate request later
    storeResponse(message, dest);

    // Return the packed message
    return message;
  };
};


module.exports = MessagePacker;