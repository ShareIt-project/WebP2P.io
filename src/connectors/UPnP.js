/**
 * Handshake connector for UPnP
 * @param {Object} configuration Configuration object.
 */
function Handshake_UPnP(configuration)
{
  HandshakeConnector.call(this);

  var self = this;

  var peers = {};


  var serviceImplementation = new NSDPlusPlus.ServiceImplementation();

  serviceImplementation.uid = function()
  {
    return {result: configuration.uid};
  };


  // Connect a handshake connector to the NSD service
  NSDPlusPlus.connect();


  // Configure handshake connector
  NSDPlusPlus.addEventListener("connected", function()
  {
    // Notify our presence
    NSDPlusPlus.expose("webp2p", "upnp", serviceImplementation);

    // Notify that the connection to this handshake server is open
    self.onopen(new Event('open'));
  });


  //
  // Process incoming messages
  //

  // Presence
  NSDPlusPlus.discover("webp2p",
  function(services)
  {
    for(var i=0, service; service=services[0]; i++)
    {
      var id = service.id;
      console.log("UPnP ID: "+id);

      var peer = NSDPlusPlus.bindService(id);
      var from = peer.uid();
      peers[from] = peer;

      var event = new Event('presence');
          event.from = from;

      self.onpresence(event);
    }
  },
  self.onerror);

  // Connect
  serviceImplementation.connectRequest = function(request)
  {
    if(self._processMessage(request))
      return;

    self._connectRequest(request);
  };

  // Response
  serviceImplementation.connectResponse = function(request)
  {
    if(self._processMessage(request))
      return;

    self._connectResponse(request);
  };


  // Disconnect
  NSDPlusPlus.addEventListener("disconnected", function()
  {
    self.onclose(new Event('close'));
  });


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    NSDPlusPlus.removeService("webp2p");

//    self.disconnect();
  }


  this._send = function(message, dest)
  {
    if(dest)
    {
      var peer = peers(dest);
      if(peer)
      {
        peer.connectRequest(message);
        return;
      }
    }

    // Broadcast
    message.dest = dest;  // If not defined, it's send as broadcast

    for(var i, peer; peer=peers[i]; i++)
      peer.connectRequest(message);
  };
}
Handshake_UPnP.prototype.__proto__   = HandshakeConnector.prototype;
Handshake_UPnP.prototype.constructor = Handshake_UPnP;

HandshakeManager.registerConstructor('UPnP', Handshake_UPnP);