/**
 * Handshake channel connector for PubNub
 * @param {Object} configuration Configuration object
 */
function Handshake_PubNub(configuration)
{
    Transport_init(this)
    Transport_Handshake_init(this)

    var self = this

    // Connect a handshake channel to the PubNub server
    var pubnub = PUBNUB.init(configuration);
        pubnub.subscribe(
        {
            channel: configuration.channel,

            // Receive messages
            callback: function(message)
            {
                self.onmessage(message)

//                var uid  = message[0]
//                var dest = message[1]
//
//                // Only launch callback if message is not from ours
//                // and it's a broadcast or send directly to us
//                if( uid  != configuration.uuid
//                &&(!dest || dest == configuration.uuid))
//                {
//                    var data = message[2]
//
//                    self.onmessage(uid, data)
//                }
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

                        message: removeLeadingFalsy(message)
                    })
                }

                self.presence = function()
                {
                    self.emit('presence', configuration.uuid)
                }

                // Set handshake as open
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