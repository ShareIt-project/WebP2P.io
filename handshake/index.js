/**
 * Remove leading 'falsy' items (null, undefined, '0', {}...) from an array
 * @param {Array} array {Array} where to remove the leading 'falsy' items
 * @returns {Array} The cleaned {Array}
 */
function removeLeadingFalsy(array)
{
    var end = array.length
    while(!array[end-1])
        end--
    return array.slice(0, end)
}

/**
 * Manage the handshake channel using several servers
 * @constructor
 * @param {String} json_uri URI of the handshake servers configuration
 */
function HandshakeManager(json_uri, peersManager)
{
    var self = this
    var channels = {}


    /**
     * Get a random handshake channel or test for the next one
     * @param {Object} configuration Handshake servers configuration
     */
    function getRandomHandshake(configuration)
    {
        if(!configuration.length)
        {
            if(self.onerror)
                self.onerror()
            return
        }

        var index = Math.floor(Math.random()*configuration.length)
        var index = 0   // Forced until redirection works

        var type = configuration[index][0]
        var conf = configuration[index][1]

        function onerror(error)
        {
            console.error(error)

            // Try to get an alternative handshake channel
            configuration.splice(index, 1)
            getRandomHandshake(configuration)
        }

        var channel
        switch(type)
        {
            case 'PubNub':
                conf.uuid = peersManager.uid
                channels['PubNub'] = channel = new Handshake_PubNub(conf)
                channel.uid = 'PubNub'
                break;

            case 'SimpleSignaling':
                conf.uid = peersManager.uid
                channels['SimpleSignaling'] = channel = new Handshake_SimpleSignaling(conf)
                channel.uid = 'SimpleSignaling'
                break;

            default:
                onerror("Invalidad handshake server type '"+type+"'")
                return
        }

        channel.onopen = function()
        {
            Transport_init(channel)
            Transport_Routing_init(channel, peersManager)

            // Count the maximum number of pending connections allowed to be
            // done with this handshake server (undefined == unlimited)
            channel.connections = 0
            channel.max_connections = conf.max_connections

            channel.presence = function()
            {
                channel.emit('presence', peersManager.uid)
            }

            channel.addEventListener('presence', function(event)
            {
                var uid = event.data[0]

                // Don't try to connect to ourselves
                if(uid != peersManager.uid)
                {
                    // Check if we should ignore this peer to increase entropy
                    // in the network mesh

                    // Do the connection with the new peer
                    peersManager.connectTo(uid, function()
                    {
                        // Increase the number of connections reached throught
                        // this handshake server
                        channel.connections++

                        // Close connection with handshake server if we got its
                        // quota of peers
                        if(channel.connections == channel.max_connections)
                           channel.close()
                    },
                    function(uid, peer, channel)
                    {
                        console.error(uid, peer, channel)
                    })
                }
            })

            // Notify our presence to the other peers on the handshake server
            channel.presence()

            if(self.onopen)
               self.onopen()
        }
        channel.onclose = function()
        {
            delete channels[channel.uid]

            // Notify the close on PeersManager

            configuration.splice(index, 1)
            getRandomHandshake(configuration)
        }
        channel.onerror = onerror
    }


    /**
     * Get the channels of all the connected peers and handshake servers
     */
    this.getChannels = function()
    {
        return channels
    }


    var http_request = new XMLHttpRequest();
        http_request.open("GET", json_uri);
        http_request.onload = function()
        {
            if(this.status == 200)
                getRandomHandshake(JSON.parse(http_request.response))

            else if(self.onerror)
                self.onerror()
        };
        http_request.onerror = function()
        {
            if(self.onerror)
                self.onerror()
        }
        http_request.send();
}