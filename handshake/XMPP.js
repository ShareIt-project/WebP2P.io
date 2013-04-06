var webp2p = (function(module){
var _priv = module._priv = module._priv || {}

/**
 * Signaling channel connector for XMPP
 * @param {Object} configuration Configuration object
 */
_priv.Handshake_XMPP = function(configuration)
{
  EventTarget.call(this);

  var self = this

//  configuration.oDbg = new JSJaCConsoleLogger(1)

  // Connect a handshake channel to the XMPP server
  var connection = new JSJaCHttpBindingConnection(configuration);
      connection.connect(configuration);  // Ugly hack to have only one config object


  /**
   * Receive messages
   */
  connection.registerHandler('message', function(message)
  {
    var from = message.getFromJID().getResource()
    var body = JSON.parse(message.getBody())

    // Don't try to connect to ourselves
    if(from == configuration.uid)
      return

    var event = document.createEvent("Event");
        event.initEvent(body[0],true,true);

        event.from  = from
        event.sdp   = body[1]
        event.route = body[2]

    self.dispatchEvent(event);
  })


  /**
   * Handle the connection to the handshake server
   */
  connection.registerHandler('onconnect', function()
  {
    // Notify our presence
    var presence = new JSJaCPresence();
        presence.setTo(configuration.room+"/"+configuration.uid);

    connection.send(presence);


    // Ugly hack so we can ignore presence messages from previous peers
    setTimeout(function()
    {
      /**
       * Handle the presence of other new peers
       */
      connection.registerHandler('presence', function(presence)
      {
        var from = presence.getFromJID().getResource()

        // Only notify new connections
        if(from != configuration.uid
        && !presence.getType()
        && !presence.getShow())
        {
          var event = document.createEvent("Event");
              event.initEvent('presence',true,true);

              event.from = from

          self.dispatchEvent(event);
        }
      });
    }, 1000)


    // Notify that the connection to this handshake server is open
    if(self.onopen)
       self.onopen()
  });


  /**
   * Handle errors on the connection
   */
  connection.registerHandler('onerror', function(error)
  {
    if(self.onerror)
       self.onerror(error)
  });


  /**
   * Send a message to a peer
   */
  function send(message, uid)
  {
    var oMsg = new JSJaCMessage();
        oMsg.setTo(configuration.room+"/"+uid);
        oMsg.setBody(JSON.stringify(message));

    connection.send(oMsg);
  }


  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    connection.disconnect()
  }


  /**
   * Send a RTCPeerConnection answer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this answer have circulated.
   */
  this.sendAnswer = function(uid, sdp, route)
  {
    var data = ['answer', sdp]
    if(route)
      data.push(route)

    send(data, uid)
  }


  /**
   * Send a RTCPeerConnection offer through the active handshake channel
   * @param {UUID} uid Identifier of the other peer.
   * @param {String} sdp Content of the SDP object.
   * @param {Array} [route] Route path where this offer have circulated.
   */
  this.sendOffer = function(uid, sdp, route)
  {
    var data = ['offer', sdp]
    if(route)
      data.push(route)

    send(data, uid)
  }
}

return module
})(webp2p || {})