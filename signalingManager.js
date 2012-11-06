function SignalingManager(configuration)
{
    var signaling = new Signaling_XMPP(configuration, this)

    this.connectTo = function(uid, sdp)
    {
        signaling.emit("offer", uid, sdp);
    }

//    signaling.addEventListener('sessionId', function(event)
}