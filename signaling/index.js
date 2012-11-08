function SignalingManager(configuration)
{
    var index = Math.floor(Math.random()*configuration.length)
    var index = 2   // Fixed value until I get SIP and/or XMPP to work

    var type = configuration[index][0]
    var conf = configuration[index][1]

    switch(type)
    {
        case 'SimpleSignaling':
            var signaling = new Signaling_SimpleSignaling(conf)
            break;

        case 'SIP':
            var signaling = new Signaling_SIP(conf)
            break;

        case 'XMPP':
            var signaling = new Signaling_XMPP(conf)
    }

    var self = this

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
    }

    this.sendOffer = function(uid, sdp)
    {
        signaling.send(uid, ["offer", sdp]);
    }

    this.sendAnswer = function(uid, sdp)
    {
        signaling.send(uid, ["answer", sdp]);
    }
}