function SignalingManager(configuration)
{
    var self = this

    var signaling = null

    function getRandomSignaling(configuration)
    {
        var index = Math.floor(Math.random()*configuration.length)

        var type = configuration[index][0]
        var conf = configuration[index][1]

        switch(type)
        {
            case 'SimpleSignaling':
                signaling = new Signaling_SimpleSignaling(conf)
                break;

            case 'SIP':
                signaling = new Signaling_SIP(conf)
                break;

            case 'XMPP':
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

            if(self.onUID)
               self.onUID(uid)
        }
        signaling.onerror = function(error)
        {
            console.error(error)

            // Try to get an alternative signaling channel
            configuration.splice(index, 1)
            getRandomSignaling(configuration)
        }
    }

    getRandomSignaling(configuration)

    this.sendOffer = function(uid, sdp)
    {
        if(signaling)
            signaling.send(uid, ["offer", sdp]);
        else
            console.warning("signaling is not available");
    }

    this.sendAnswer = function(uid, sdp)
    {
        if(signaling)
            signaling.send(uid, ["answer", sdp]);
        else
            console.warning("signaling is not available");
    }
}