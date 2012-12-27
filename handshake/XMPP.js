/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
function Signaling_XMPP(configuration)
{
    var self = this

    // Connect a signaling channel to the XMPP server
    var signaling = new JSJaCHttpBindingConnection(configuration);
        signaling.connect(configuration);   // Ugly hack to have only one config object
        signaling.registerHandler('onconnect', function()
        {
            // Compose and send message
            self.send = function(uid, data)
            {
                var oMsg = new JSJaCMessage();
                    oMsg.setTo(new JSJaCJID(uid));
                    oMsg.setBody(JSON.stringify(data));

                signaling.send(oMsg);
            }

            signaling.registerHandler('message', function(oJSJaCPacket)
            {
                var uid  = oJSJaCPacket.getFromJID()
                var data = JSON.parse(oJSJaCPacket.getBody())

                if(self.onmessage)
                    self.onmessage(uid, data)
            })

            signaling.send(new JSJaCPresence());

            // Set signaling as open
            if(self.onopen)
                self.onopen(configuration.username)
        });
        signaling.registerHandler('onerror', function(error)
        {
            if(self.onerror)
               self.onerror(error)
        });
}