function SignalingManager(configuration)
{
    var type = configuration[2][0]
    var conf = configuration[2][1]

    switch(type)
    {
        case 'SimpleSignaling':
            var signaling = new Signaling_SimpleSignaling(conf, this)
            break;

        case 'XMPP':
            var signaling = new Signaling_XMPP(conf, this)
    }

    var self = this

    signaling.onopen = function(uid)
    {
        if(self.onUID)
           self.onUID(uid)
    }

    this.connectTo = function(uid, sdp)
    {
        signaling.send(uid, ["offer", sdp]);
    }
}