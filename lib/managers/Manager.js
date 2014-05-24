var EventEmitter = require("events").EventEmitter;

var inherits = require('inherits');


function Manager(rpcBuilder)
{
  EventEmitter.call(this);

  var self = this;


  this._connectors = [];

  this.__defineGetter__("status", function()
  {
    return this._connectors.length ? 'connected' : 'disconnected';
  });


  this._initConnector = function(connector)
  {
    connector.on('open', function()
    {
//      for(var i=0, conn; conn=self._connectors[i]; i++)
//        if(conn===connector)
//          console.error('Duplicate connector',connector);

      self._connectors.push(connector);

      if(self._connectors.length == 1)
         self.emit('connected');
    });
    connector.on('close', function()
    {
      self._connectors.splice(self._connectors.indexOf(connector), 1);

      if(self._connectors.length == 0)
         self.emit('disconnected');
    });
    connector.on('error', function(error)
    {
      connector.close();

      self.emit('error', error);
    });

    connector._messageUnpacked = function(message)
    {
      var method = message.method;
      var params = message.params;

      switch(method)
      {
        case 'offer':
          params.reply = function(error, result)
          {
            return message.reply(error, result, connector);
          };

        case 'answer':
        case 'error':
          params.pack = function()
          {
            return message.pack();
          };

          self.emit(method, params, connector);
        break;

        default:
          // This should never be reached
          console.error("Unknown message method '"+method+"'", message);
      };
    };

    connector.on('message', function(message)
    {
      message = rpcBuilder.decode(message);
      if(message)
      {
        // Response was previously stored, send it directly
        if(message.stored)
          connector.send(message)

        // Normal message, process it
        else
          connector._messageUnpacked(message);
      };
    });
  };
};
inherits(Manager, EventEmitter);


/**
 * Close all the connections
 */
Manager.prototype.close = function()
{
  for(var i=0, connector; connector=this._connectors[i]; i++)
    connector.close();
};

/**
 * {Object} message - Message to be send
 * {Connector} [incomingConnector] - {Connector} to don't send the message
 */
Manager.prototype.send = function(message, incomingConnector)
{
  for(var i=0, connector; connector=this._connectors[i]; i++)
  {
    // Don't send the message to the same connector where we received it
    if(connector === incomingConnector)
      continue;

    connector.send(message);
  };
};


module.exports = Manager;
