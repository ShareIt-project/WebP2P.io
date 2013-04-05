var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for PubNub (adapter to Message Channel interface)
 * @param {Object} configuration Configuration object.
 */
_priv.Handshake_PubNub = function(configuration)
{
  EventTarget.call(this);

  this.isPubsub = true;

  var self = this;

  // Connect a handshake channel to the PubNub server
  var pubnub = PUBNUB(configuration);


  pubnub.subscribe(
  {
    channel: configuration.channel,


    /**
     * Receive messages
     */
    callback: function(message)
    {
      var event = JSON.parse(message)

      var from = event.from;
      var sdp  = event.sdp;

      // Don't try to connect to ourselves
      if(from == configuration.uid)
        return

//      console.log(event)
//      self.dispatchEvent(event);

      switch(event.type)
      {
        case 'offer':
          self.dispatchEvent(event);
        break;

        case 'answer':
          self.onanswer(from, sdp);
        break;

        /**
         * Handle the presence of other new peers
         */
        case 'presence':
        {
          var event = document.createEvent("Event");
              event.initEvent('presence',true,true);

              event.uid = from

          self.dispatchEvent(event);
        };
      }
    },

    /**
     * Handle the connection to the handshake server
     */
    connect: function()
    {
      // Notify our presence
      send({type: 'presence', from: configuration.uid});

      // Notify that the connection to this handshake server is open
      if(self.onopen)
         self.onopen();
    },


    /**
     * Handle errors on the connection
     */
    error: function(error)
    {
      if(self.onerror)
         self.onerror(error)
    }
  });


  /**
   * Send a message to a peer
   */
  function send(message)
  {
    pubnub.publish(
    {
      channel: configuration.channel,
      message: JSON.stringify(message)
    });
  };


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    pubnub.unsubscribe(
    {
      channel: configuration.channel
    });
  }


  /**
   * Send a RTCPeerConnection answer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this answer have circulated.
   */
  this.sendAnswer = function(orig, sdp, route)
  {
    var data = {type: 'answer',
                from: configuration.uid,
                to:   orig,
                sdp:  sdp,
                route: route}

//    // Run over all the route peers looking for possible "shortcuts"
//    for(var i = 0, uid; uid = route[i]; i++)
//      if(uid == transport.uid)
//      {
//        data.route.length = i;
//        break;
//      }

    send(data);
  };


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  this.sendOffer = function(dest, sdp, route)
  {
    var data = {type: 'offer',
                from: configuration.uid,
                to:   dest,
                sdp:  sdp}

    if(route)
       data.route = route;

    send(data);
  };
}

return module
})(webp2p || {})