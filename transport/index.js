var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Init a channel as an event-based transport layer
 * @param transport
 */
_priv.Transport_init = function(transport)
{
  EventTarget.call(transport);

  /**
   *  Compose and send message
   */
  transport.emit = function()
  {
    var args = Array.prototype.slice.call(arguments, 0);

    transport.send(JSON.stringify(args))
//    transport.send(JSON.stringify(args), function(error)
//    {
//      if(error)
//        console.warn(error);
//    });
  };

  /**
   *  Message received
   */
  transport.onmessage = function(message)
  {
    message = JSON.parse(message.data);

    var event = document.createEvent("Event");
        event.initEvent(message[0],true,true);
        event.data = message.slice(1)

    transport.dispatchEvent(event);
  };
}

return module
})(webp2p || {})