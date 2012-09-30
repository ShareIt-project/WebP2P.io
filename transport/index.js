function Transport_init(transport, onsuccess)
{
    transport.onopen = function()
    {
	    var protocol = {}

	    // EventTarget interface
	    protocol._events = {};

	    protocol.addEventListener = function(type, listener)
	    {
	      protocol._events[type] = protocol._events[type] || [];
	      protocol._events[type].push(listener);
	    };

	    protocol.dispatchEvent = function(type)
	    {
	      var events = protocol._events[type];
	      if(!events)
	        return;

	      var args = Array.prototype.slice.call(arguments, 1);

	      for(var i = 0, len = events.length; i < len; i++)
	        events[i].apply(null, args);
	    };

        protocol.removeEventListener = function(type, listener)
        {
          var events = protocol._events[type];
          if(!events)
            return;

          events.splice(events.indexOf(listener), 1)

          if(!events.length || !listener)
            delete protocol._events[type]
        };

        // Compose and send message
	    protocol.emit = function()
	    {
	        var args = Array.prototype.slice.call(arguments, 0);

	        transport.send(JSON.stringify(args), function(error)
	        {
	            if(error)
	                console.warning(error);
	        });
	    }

	    // Message received
	    transport.onmessage = function(message)
	    {
	        console.log("transport.onmessage = '"+message.data+"'")

            protocol.dispatchEvent.apply(protocol, JSON.parse(message.data))
	    }

	    if(onsuccess)
	        onsuccess(protocol);
    }
}