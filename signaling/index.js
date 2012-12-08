function SignalingManager(json_uri)
{
    var self = this

    var signaling = null

    var UUIDv4 = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}

    function getRandomSignaling(configuration)
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

        switch(type)
        {
            case 'PubNub':
                conf.uuid = conf.uuid || UUIDv4()
                signaling = new Signaling_PubNub(conf)
                break;

            case 'SimpleSignaling':
                conf.uid = conf.uid || UUIDv4()
                signaling = new Signaling_SimpleSignaling(conf)
                break;

            case 'SIP':
                conf.uri = conf.uri || UUIDv4()+'@'+conf.outbound_proxy_set
                signaling = new Signaling_SIP(conf)
                break;

            case 'XMPP':
                conf.username = conf.username || UUIDv4()
                signaling = new Signaling_XMPP(conf)
        }

        signaling.onopen = function(uid)
        {
            signaling.onmessage = function(uid, data)
            {
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
            }

            if(self.onopen)
               self.onopen(uid)
        }
        signaling.onerror = function(error)
        {
            console.error(error)

            // Try to get an alternative signaling channel
            configuration.splice(index, 1)
            getRandomSignaling(configuration)
        }
    }

    var http_request = new XMLHttpRequest();
        http_request.open("GET", json_uri);
        http_request.onload = function()
        {
            if(this.status == 200)
                getRandomSignaling(JSON.parse(http_request.response))

            else if(self.onerror)
                self.onerror()
        };
        http_request.onerror = function()
        {
            if(self.onerror)
                self.onerror()
        }
        http_request.send();


    this.sendOffer = function(uid, sdp)
    {
        if(signaling && signaling.send)
            signaling.send(uid, ["offer", sdp]);
        else
            console.warn("signaling is not available");
    }

    this.sendAnswer = function(uid, sdp)
    {
        if(signaling)
            signaling.send(uid, ["answer", sdp]);
        else
            console.warn("signaling is not available");
    }
}