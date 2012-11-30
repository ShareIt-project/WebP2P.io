function Signaling_PubNub(configuration)
{
    var self = this

    var channel = ""

    // INIT PubNub
    var pubnub = PUBNUB.init(
    {
        publish_key   : 'pub-6ee5d4df-fe10-4990-bbc7-c1b0525f5d2b',
        subscribe_key : 'sub-e5919840-3564-11e2-b8d0-c7df1d04ae4a',
        ssl           : true,
        uuid          : configuration.uuid
    });

 // LISTEN
    pubnub.subscribe(
    {
        channel: channel,

        // Receive messages
        callback: function(message)
        {
            if(self.onmessage && message.to == configuration.uuid)
                self.onmessage(message.from, message.data)
        },

        connect: function()
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                pubnub.publish(
                {
                    channel: channel,

                    message:
                    {
                        from: configuration.uuid,
                        to: uid,
                        data: data
                    }
                })
            }

            // Set signaling as open
            if(self.onopen)
                self.onopen(configuration.uid)
        },

        error: function(error)
        {
            if(self.onerror)
                self.onerror(error)
        }
    })
}