var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Handshake channel connector for SimpleSignaling
 * @param {Object} configuration Configuration object.
 */
_priv.Handshake_SimpleSignaling = function(configuration)
{
  _priv.Transport_init(this);

  this.isPubsub = true;

  var self = this;

  // Connect a handshake channel to the SimpleSignaling server
  var handshake = new SimpleSignaling(configuration);


  /**
   * Receive messages
   */
  handshake.onmessage = function(uid, data)
  {
    if(self.onmessage)
       self.onmessage(uid, data);
  };


  /**
   * Handle the presence of other new peers
   */
  this.addEventListener('presence', function(event)
  {
    var uid = event.data[0];
  
    // Don't try to connect to ourselves
    if(uid != configuration.uid)
    {
      var event = document.createEvent("Event");
          event.initEvent('presence',true,true);
          event.uid = uid

      self.dispatchEvent(event);
    }
  });


  handshake.onopen = function(uid)
  {
    // Notify our presence
    self.emit('presence', peersManager.uid);


    /**
     * Send a message to a peer
     */
    self.send = function(message, uid)
    {
      handshake.send(uid, message);
    };

    // Notify that the connection to this handshake server is open
    if(self.onopen)
       self.onopen(uid);
  };


  /**
   * Handle errors on the connection
   */
  handshake.onerror = function(error)
  {
    if(self.onerror)
       self.onerror(error);
  };


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  this.sendOffer = function(dest, sdp, route)
  {
    if(route == undefined)
       route = [];

    route.push(configuration.uid);

    this.emit('offer', dest, sdp, route);
  };


  /**
   * Send a RTCPeerConnection answer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this answer have circulated.
   */
  this.sendAnswer = function(orig, sdp, route)
  {
    // Run over all the route peers looking for possible "shortcuts"
    for(var i = 0, uid; uid = route[i]; i++)
      if(uid == transport.uid)
      {
        route.length = i;
        break;
      }

    this.emit('answer', orig, sdp, route);
  };
}

return module
})(webp2p || {})