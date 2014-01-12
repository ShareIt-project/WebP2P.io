var EventEmitter = require("events").EventEmitter;


function Manager()
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
      if(self.status == 'disconnected')
         self.emit('connected');

      self._connectors.push(connector);
    });
    connector.on('close', function()
    {
      self._connectors.splice(self._connectors.indexOf(connector), 1);
    });
    connector.on('error', function(error)
    {
      connector.close();

      self.emit('error', error);
    });

    connector._messageUnpacked = function(message)
    {
      switch(message.type)
      {
        case 'offer':
        case 'answer':
          self.emit(message.type, message, connector);
        break;

        default:
          console.error("Unknown message type '"+type+"'");
          console.error(message);
      };
    };

    connector.on('message', function(message)
    {
      message = messagepacker.unpack(message);
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


  /**
   * {Object} message - Message to be send
   * {Connector} [incomingConnector] - {Connector} to don't send the message
   */
  this.send = function(message, incomingConnector)
  {
    for(var i=0, peer; peer=this._connectors[i]; i++)
    {
      // Don't send the message to the same connector where we received it
      if(peer === incomingConnector)
        continue;

      peer.send(message);
    };
  };


  /**
   * Close all the connections
   */
  this.close = function()
  {
    for(var i=0, peer; peer=this._connectors[i]; i++)
      peer.close();
  };
};
Manager.prototype.__proto__   = EventEmitter.prototype;
Manager.prototype.constructor = Manager;


module.exports = Manager;