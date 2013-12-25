function HandshakeConnector()
{
  var requests  = HandshakeConnector.requests;
  var responses = HandshakeConnector.responses;

  this._processMessage = function(message)
  {
    if(message.jsonrpc != "2.0")
    {
      console.error("Not valid version of json-rpc object")
      console.error(message)
      return true;
    };

    var dest = message.dest;

    // Message is not for us or it's broadcast (undefined), forward it
    if(dest != configuration.uid)
    {
      if(--message.ttl > 0)
      {
        var event = new Event('forward');
            event.connector = this;
            event.message = message;

        self.onforward(event);
      };

      // Message was not for us, return as processed
      if(dest != undefined)
        return true;
    };

    return false;
  };


  //
  // Connection request and response proccessors
  //

  this._connectRequest = function(request)
  {
    var id     = request.id;
    var params = request.params;

    var from = request.from;

    // Check if it's a re-try
    var response = responses[from];
    if(response)
    {
      // Old message, ignore it
      if(response.id > id)
        return

      // Updated message (or duplicated one), delete old response
      clearTimeout(response.timeout);
      delete responses[from];

      // Duplicated message, re-send it
      if(response.id == id)
      {
        sendResponse(response.message, from)
        return
      }
    }

    // It's not a re-try
    var event = new Event('connect');
        event.from      = from;
        event.sdp       = params[0];
        event.requestID = id;

    self.onconnect(event)
  };

  this._connectResponse = function(response)
  {
    var id     = response.id;
    var error  = response.error;
    var result = response.result;

    var from = response.from;

    var request_ids = requests[from];
    if(request_ids)
    {
      var request = request_ids[id];
      if(request)
         request.callback(error, result);
    }
  };


  //
  // Send connect request and response messages
  //

  /**
   * Send a request to try to connect to another peer
   */
  this.connectRequest = function(sdp, dest, callback)
  {
    var request =
    {
      method: 'connect',
      params: [sdp]
    };

    this._sendRequest(request, dest, callback);
  };

  /**
   * Send a response to a peer trying to connect to us
   */
  this.connectResponse = function(sdp, requestID, dest)
  {
    var response =
    {
      result: sdp,

      id: requestID
    };

    // Send the response
    sendResponse(response, dest);
  };


  //
  // JsonRPC 2.0 + routing extension messages
  //

  function send(message, dest)
  {
    // Set this message as a valid Json-RPC 2.0 one
    message.jsonrpc = "2.0";

    // Routing extension for Json-RPC 2.0
    message.from = configuration.uid;
    message.ttl = message.ttl || HandshakeConnector.MAX_TTL_DEFAULT;

    self._send(request, dest);
  };

  /**
   * Send a request to try to connect to another peer
   */
  this._sendRequest = function(request, dest, callback)
  {
    // Store the response to prevent duplicates
    if(callback)
    {
      var id = request.id = HandshakeConnector.requestID++;

      var request_ids = requests[dest] = requests[dest] || {};

      var request_id = request_ids[id] =
      {
        request: request,
        callback: dispatchCallback,
        error_tries: 0
      };

      function dispatchCallback(error, result)
      {
        clearTimeout(request_id.timeout);

        delete request_ids[id];
        if(!Object.keys(request_ids).length)
          delete requests[dest];

        callback(error, result);
      }

      function dispatchRequest()
      {
        request_id.timeout = setTimeout(function()
        {
          request_id.error_tries++;

          if(request_id.error_tries < HandshakeConnector.MAX_ALLOWED_ERROR_TRIES)
          {
            dispatchRequest();
            send(request, dest);
          }

          // Max number of re-try achieved, raise error
          else
            dispatchCallback(new Error('Timed Out'))
        },
        HandshakeConnector.BASE_TIMEOUT * Math.pow(2, request_id.error_tries));
      }

      dispatchRequest();
    }

    // Send request
    send(request, dest);
  };

  /**
   * Send a response to a peer trying to connect to us
   */
  function sendResponse(response, dest)
  {
    // Store the response to prevent duplicates
    responses[dest] = {message: response};
    responses[dest].timeout = setTimeout(function()
    {
      delete responses[dest];
    },
    HandshakeConnector.BASE_TIMEOUT * Math.pow(2, HandshakeConnector.MAX_ALLOWED_ERROR_TRIES));

    // Send response
    send(response, dest);
  };
};
HandshakeConnector.prototype =
{
  close: function()
  {
    throw new TypeError("Should be defined in a child class");
  },

  _send: function(message, dest)
  {
    throw new TypeError("Should be defined in a child class");
  }
};
HandshakeConnector.MAX_ALLOWED_ERROR_TRIES = 3;
HandshakeConnector.MAX_TTL_DEFAULT = 5;
HandshakeConnector.BASE_TIMEOUT = 5000;
HandshakeConnector.requestID = 0;
HandshakeConnector.requests = {};
HandshakeConnector.responses = {};