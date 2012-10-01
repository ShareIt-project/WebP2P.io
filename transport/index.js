function Transport_init(transport, onsuccess)
{
    transport.onopen = function()
    {
        EventTarget.call(transport)

        // Compose and send message
	    transport.emit = function()
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

            message = JSON.parse(message.data)
            var event = {'type': message[0], 'data': message.slice(1)}

            transport.dispatchEvent(event)
	    }

	    if(onsuccess)
	        onsuccess(transport);
    }
}