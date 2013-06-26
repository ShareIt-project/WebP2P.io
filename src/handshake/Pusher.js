/**
 * Handshake channel connector for Pusher
 * @param {Object} configuration Configuration object
 */
function Handshake_Pusher(configuration)
{
    var self = this

    // Connect a handshake channel to the Pusher server
    var pusher = new Pusher(configuration.appKey, configuration);
    var channel = pusher.subscribe(configuration.channel);

    // Receive messages
    callback: function(message)
    {
        var uid  = message[0]
        var dest = message[1]

        // Only launch callback if message is not from ours
        // and it's a broadcast or send directly to us
        if( uid  != configuration.uuid
        &&(!dest || dest == configuration.uuid))
        {
            var data = message[2]

            if(self.onmessage)
                self.onmessage(uid, data)
        }
    },

    connect: function()
    {
        // Compose and send message
        self.send = function(dest, data)
        {
            var message = [configuration.uuid, dest, data]

            pubnub.publish(
            {
                channel: configuration.channel,

                message: message
            })
        }

        // Set handshake as open
        var event = document.createEvent("Event");
            event.initEvent('open',true,true);

        self.dispatchEvent(event);
    },

    error: function(error)
    {
        if(self.onerror)
            self.onerror(error)
    }

    this.close = function()
    {
//        pusher.unsubscribe(configuration.channel);
        pusher.disconnect();
    }
}
Handshake_Pusher.prototype = new EventTarget();

HandshakeManager.registerConstructor('Pusher', Handshake_Pusher);