var inherits = require("inherits");

var HandshakeConnector = require("./core/HandshakeConnector");

var ltx    = require('ltx');
var Client = require("node-xmpp-client");


/**
 * Handshake connector for XMPP
 * @param {Object} configuration Configuration object
 */
function Connector_XMPP(config_init, config_mess, max_connections)
{
  HandshakeConnector.call(this, max_connections);

  var self = this;

  var channel = config_mess.channel;


  // Connect a handshake connector to the XMPP server
//  var config_init =
//  {
//    jid: ,
//    preferred: 'ANONYMOUS',
//    boshURL: ,
//    websocketsURL:
//  };
  var client = new Client(config_init);

  client.on('online', self._open)

  client.on('stanza', function(stanza)
  {
    if(stanza.is('message')
    && stanza.attrs.type !== 'error')  // Important: never reply to errors!
      self._message(stanza.getChildText('body'));
  })

  client.on('disconnect', self._close);
  client.on('error',      self._error);


  // Define methods

  /**
   * Close the connection with this handshake server
   */
  this.close = function()
  {
    client.end();
  };

  /**
   * Send the message
   */
  this.send = function(message)
  {
    var stanza = new ltx.Element('message',
    {
      to: channel,
      type: 'groupchat'
    })
    .c('body').t(message);

    client.send(stanza);
  };
}
inherits(Connector_XMPP, HandshakeConnector);


module.exports = Handshake_XMPP;
