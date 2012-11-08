function SignalingManager(configuration)
{
    var type = configuration[2][0]
    var conf = configuration[2][1]

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