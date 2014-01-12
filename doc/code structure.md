{} Private procedures, not availables from outside
[] Re-usage of public procedures by others
-> Call to procedures from other components


Connectors
==========

Connector
---------

* Listen to new offers
  * Emit offer(message)

* Listen to new answers
  * Emit answer(message)

* forwardOffer(message)
* forwardAnswer(message)

* ~close()
* ~send(message)


Connector_DataChannel (Connector)
---------------------

* close()
* send(message)


HandshakeConnector (Connector)
------------------

* Listen to new peers
  * If should add a new peer:
    * Emit presence(sessionID)


Connector_PubNub (HandshakeConnector)
----------------

* close()
* send(message)


Connector_XMPP (HandshakeConnector)
--------------

* close()
* send(message)


Managers
========

Manager
-------

* {createPeerConnection}

* {Connector.on("offer", message)}
  * If message is for us:
    * answer = createPeerConnection()
    * Store answer and enable answer timeout
    * Connector.sendAnswer(answer)
    * Emit peerconnection(PeerConnection)
  * Else:
    * Emit forwardOffer(message)

* {Connector.on("answer", message)}
  * If message is for us:
    * Disable offer timeout
    * Emit peerconnection(PeerConnection)
  * Else:
    * Emit forwardAnswer(message)

* forward(message, Connector)
  * Forward message in all connectors, except Connector

* connectTo(peerId)  // Send new PeerConnection request
  * offer = createPeerConnection()
  * Send PeerConnection offer request to all Connectors
  * Enable offer timeout

* disconnect()
  * Close all Connectors


PeersManager (Manager)
------------

* add(PeerConnection)
  * Add PeerConnection to list of peers


HandshakeManager (Manager)
----------------

* {Connect next limited channel}
  * If a limited channel is available:
    * Do the connection
  * Else if there's no connected unlimited channels:
    * Set as disconnected

* {HandshakeConnector.on("presence", sessionID)}
  * If sessionID not in PeersManager.list:
    * offer = createPeerConnection()
    * HandshakeConnector.sendOffer(sessionID, offer)
    * Enable offer timeout

* {HandshakeConnector.on("answer", message)}
  * If message is for us:
    * If > limited peers:
      * HandshakeConnector.disconnect()
      * [Connect next limited channel]

* connect()
  * Get configurations
  * Connect all unlimited channels (no max limit for discovered peers)
  * [Connect next limited channel]


WebP2P
======

* {HandshakeManager.on("peerconnection", PeerConnection)}
  * PeersManager.add(PeerConnection)
  * Emit peerconnection(PeerConnection)

* {HandshakeManager.on("forwardOffer", message, Connector)}
  * If message.dest in PeersManager.list:
    * PeerConnector.forwardOffer(message)
  * Else:
    * PeersManager.forwardOffer(message, Connector)
    * HandshakeManager.forwardOffer(message, Connector)

* {HandshakeManager.on("forwardAnswer", message, Connector)}
  * If message.dest in PeersManager.list:
    * PeerConnector.forwardAnswer(message)
  * Else:
    * PeersManager.forwardAnswer(message, Connector)
    * HandshakeManager.forwardAnswer(message, Connector)

* connect()
  * HandshakeManager.connect()

* connectTo(sessionID)  // Send new PeerConnection request
  * If sessionID in PeersManager.list:
    * return peer
  * PeersManager.connectTo(sessionID)
  * HandshakeManager.connectTo(sessionID)

* disconnect()
  * HandshakeManager.disconnect()
  * PeersManager.disconnect()