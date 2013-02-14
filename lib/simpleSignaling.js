/**
 * Client of the SimpleSignaling protocol
 * @constructor
 * @param {Object} configuration Configuration of the connection
 */
function SimpleSignaling(configuration)
{
    var self = this;

    /**
     * UUID generator
     */
    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};

    var uid = (configuration.uid != undefined) ? configuration.uid : UUIDv4();

    var websocket = new WebSocket(configuration.ws_uri);
        websocket.onopen = function()
        {
            // Message received
            websocket.onmessage = function(message)
            {
                message = JSON.parse(message.data);

                var orig = message[0];
                var room = message[1];
                var data = message[2];

                if(self.onmessage)
                   self.onmessage(data, orig, room);
            };

            // Send our UID
            websocket.send(JSON.stringify([uid, configuration.room]));

            // Set signaling as open
            if(self.onopen)
                self.onopen();
        };

    /**
     * Compose and send message
     * @param message Data to be send
     * @param {String|undefined} uid Identifier of the remote peer. If null,
     * message is send by broadcast to all connected peers
     */
    this.send = function(message, dest, room)
    {
        websocket.send(JSON.stringify([dest, room, message]), function(error)
        {
            if(error && self.onerror)
                self.onerror(error);
        });
    };

    /**
     * Get the current UID
     * @returns {String}
     */
    this.uid = function()
    {
        return uid;
    };
}