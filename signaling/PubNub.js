function Signaling_PubNub(configuration)
{
    var self = this

    // Connect a signaling channel to the PubNub server
    var pubnub = PUBNUB.init(configuration);
        pubnub.subscribe(
        {
            channel: configuration.channel,

            // Receive messages
            callback: function(message)
            {
                if(message[1] == configuration.uuid)
                {
                    var uid  = message[0]
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
                    pubnub.publish(
                    {
                        channel: configuration.channel,

                        message: [configuration.uuid, dest, data]
                    })
                }

                // Set signaling as open
                if(self.onopen)
                    self.onopen(configuration.uuid)
            },

            error: function(error)
            {
                if(self.onerror)
                    self.onerror(error)
            }
        })
}