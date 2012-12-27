/**
 * Handshake channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
function Handshake_XMPP(configuration)
{
    var self = this

    // Connect a handshake channel to the XMPP server
    var handshake = new JSJaCHttpBindingConnection(configuration);
        handshake.connect(configuration);   // Ugly hack to have only one config object
        handshake.registerHandler('onconnect', function()
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                var oMsg = new JSJaCMessage();
                    oMsg.setTo(new JSJaCJID(uid));
                    oMsg.setBody(JSON.stringify(data));

                handshake.send(oMsg);
            }

            handshake.registerHandler('message', function(oJSJaCPacket)
            {
                var uid  = oJSJaCPacket.getFromJID()
                var data = JSON.parse(oJSJaCPacket.getBody())

                if(self.onmessage)
                    self.onmessage(uid, data)
            })

            handshake.send(new JSJaCPresence());

            // Set handshake channel as open
            if(self.onopen)
                self.onopen(configuration.username)
        });
        handshake.registerHandler('onerror', function(error)
        {
            if(self.onerror)
               self.onerror(error)
        });
}