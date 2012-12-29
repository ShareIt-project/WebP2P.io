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
function HandshakeManager(json_uri)
{
    var self = this

    var handshake = null

    var max_connections
    var connections

    /**
     * UUID generator
     */
    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}

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

        switch(type)
        {
            case 'PubNub':
                conf.uuid = conf.uuid || UUIDv4()
                handshake = new Handshake_PubNub(conf)
                break;

            case 'SimpleSignaling':
                conf.uid = conf.uid || UUIDv4()
                handshake = new Handshake_SimpleSignaling(conf)
                break;

            case 'xRTML':
                conf.id = conf.id || UUIDv4()
                handshake = new Handshake_PubNub(conf)
                break;

            default:
                onerror("Invalidad handshake server type '"+type+"'")
                return
        }

        handshake.onopen = function(uid)
        {
            handshake.onmessage = function(uid, data)
            {
                if(data)
                    switch(data[0])
                    {
                        case 'offer':
                            if(self.onoffer)
                                self.onoffer(uid, data[1])
                            break

                        case 'answer':
                            if(self.onanswer)
                                self.onanswer(uid, data[1])
                    }
                else if(self.onsynapse)
                    self.onsynapse(uid)
            }

            // Notify our presence to the other peers on the handshake server
            handshake.send()

            if(self.onopen)
               self.onopen(uid)
        }
        handshake.onclose = function()
        {
            max_connections = undefined
            connections = undefined

            // Go to the next handshake server
            configuration.splice(index, 1)
            getRandomHandshake(configuration)
        }
        handshake.onerror = onerror

        // Count the maximum number of pending connections allowed to be done
        // with this handshake server (undefined == unlimited)
        max_connections = conf.max_connections / 2
        connections = 0
    }

    var http_request = new XMLHttpRequest();
        http_request.open("GET", json_uri);
        http_request.onload = function()
        {
            if(this.status == 200)
            {
                var configuration = JSON.parse(http_request.response)
                getRandomHandshake(configuration)
            }

            else if(self.onerror)
                self.onerror()
        };
        http_request.onerror = function()
        {
            if(self.onerror)
                self.onerror()
        }
        http_request.send();


    /**
     * Send a RTCPeerConnection offer through the active handshake channel
     * @param {UUID} uid Identifier of the other peer
     * @param {String} sdp Content of the SDP object
     */
    this.sendOffer = function(uid, sdp)
    {
        if(handshake && handshake.send)
            handshake.send(uid, ["offer", sdp]);
        else
            console.warn("Handshake channel is not available");
    }

    /**
     * Send a RTCPeerConnection answer through the active handshake channel
     * @param {UUID} uid Identifier of the other peer
     * @param {String} sdp Content of the SDP object
     */
    this.sendAnswer = function(uid, sdp)
    {
        if(handshake)
            handshake.send(uid, ["answer", sdp]);
        else
            console.warn("Handshake channel is not available");
    }

    /**
     * Close the connection with the handshake server (if any)
     */
    this.addConnection = function()
    {
        connections++

        if(connections == max_connections)
           handshake.close()
    }
}