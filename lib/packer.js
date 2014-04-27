const ERROR    = 0;
const PRESENCE = 1;
const OFFER    = 2;
const ANSWER   = 3;


function pack(message, id)
{
  var result = new Array(6);
  var params = message.params || {};

  // Method
  var method = message.method;
  switch(method)
  {
    case "error":
      result[0] = ERROR;
    break;

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
      var error = new Error("Unknown message method '"+method+"'");
          error.message = message;

      throw error;
    };
  };

  // From
  result[1] = params.from;

  // Offer & Answer

  if(method != 'presence')
  {
    result[2] = params.dest;
    result[3] = id;
    result[4] = params.ttl;
    result[5] = params.sdp || params.message;
  };

  return JSON.stringify(result);
};

function unpack(message)
{
  var result = {};
  var params = {};

  message = JSON.parse(message);

  // Method
  var method = message[0];
  switch(method)
  {
    case ERROR:
      result.method = "error";
    break;

    case PRESENCE:
      result.method = "presence";
    break;

    case OFFER:
      result.method = "offer";
    break;

    case ANSWER:
      result.method = "answer";
    break;

    default:
    {
      var error = Error("Unknown message method '"+method+"'");
          error.message = message;

      throw error;
    };
  };

  // From
  params.from = message[1];

  // Offer & Answer

  if(method != PRESENCE)
  {
    params.dest = message[2];
    result.id   = message[3];
    params.ttl  = message[4];

    if(method == ERROR)
      params.message = message[5];
    else
      params.sdp = message[5];
  };

  // Return unpacked message
  result.params = params;

  return result;
};


var responseMethods =
{
  'presence': 'offer',

  'offer':
  {
    error:    'error',
    response: 'answer'
  }
};


exports.pack   = pack;
exports.unpack = unpack;

exports.responseMethods = responseMethods;
