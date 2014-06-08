var inherits = require('inherits');

var HandshakeConnector = require('./core/HandshakeConnector');

var ltx    = require('ltx');
var Client = require('node-xmpp-client');


/**
 * Handshake connector for XMPP
 * @param {Object} configuration Configuration object
 */
function Connector_XMPP(config_init, config_mess, max_connections)
{
  HandshakeConnector.call(this, max_connections);

  var self = this;

  var room_jid  = config_mess.channel+'@'+config_mess.muc_server;
  var room_nick = Math.random();


  // Connect a handshake connector to the XMPP server
  var client = new Client(config_init);

  client.on('online', function()
  {
    var stanza = new ltx.Element('presence',
    {
//      to: room_jid
      to: room_jid+'/'+room_nick
    })
    .c('x', { xmlns: 'http://jabber.org/protocol/muc' });

    client.send(stanza);
  });

  client.on('stanza', function(stanza)
  {
    if(stanza.attrs.from == room_jid+'/'+room_nick)
    {
      // We are registered on the chat channel
      if(stanza.is('presence'))
        self._open();

      return;
    };

    // Normal message
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
  this.close = client.end.bind(client);

  /**
   * Send the message
   */
  this.send = function(message)
  {
    var stanza = new ltx.Element('message',
    {
      to: room_jid,
      type: 'groupchat'
    })
    .c('body').t(message);

    client.send(stanza);
  };
}
inherits(Connector_XMPP, HandshakeConnector);


module.exports = Connector_XMPP;
