var EventEmitter = require("events").EventEmitter;


function Connector()
{
  EventEmitter.call(this);

  var self = this;


  /**
   * Notify that the connection to this handshake server is open
   */
  this._open = function()
  {
    self.emit('open');
  };

  this._message = function(message)
  {
    self.emit("message", message);
  };

  this._close = function()
  {
    self.emit('close');
  };

  this._error = function(error)
  {
    self.emit('error', error);
  };
};
Connector.prototype.__proto__   = EventEmitter.prototype;
Connector.prototype.constructor = Connector;

Connector.prototype.close = function()
{
  throw new TypeError("Connector.close should be defined in a child class");
};
Connector.prototype.send = function(message)
{
  throw new TypeError("Connector.send should be defined in a child class");
};


module.exports = Connector;