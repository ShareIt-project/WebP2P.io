/**
 * Signaling channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object
 */
function Signaling_SimpleSignaling(configuration)
{
    var self = this

    // Connect a signaling channel to the XMPP server
    var signaling = new SimpleSignaling(configuration);
        signaling.onopen = function(uid)
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                signaling.send(uid, data);
            }

            signaling.onmessage = function(uid, data)
            {
                if(self.onmessage)
                    self.onmessage(uid, data)
            }

            // Set signaling as open
            if(self.onopen)
                self.onopen(uid)
        }
        signaling.onerror = function(error)
        {
            if(self.onerror)
                self.onerror(error)
        }
}