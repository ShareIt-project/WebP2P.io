WebP2P.io: a signaling protocol for WebRTC 

2014, Jesús Leganés Combarro "piranna"
piranna@gmail.com

This document specifies a signaling protocol for WebRTC applications, mainly
focused on P2P architectures. It allows discovering and connection to other
peers, and routing of connection data over this ad-hoc created mesh network
while being anonimous, offering encrypted communications and allowing
authentication of other trusted peers.

The protocol is mainly focused on WebRTC DataChannels, Javascript and
ArrayBuffers, but it could be implemented over other technology that allow
manipulation and transmission of binary data.


# Definitions
 * sessionID: session public-key of a peer. A new one is generated randomly for
   each session and it's the only one that's transmitted on the wire
 * userID: user public-key of a peer. This is created only one time and identify
   and authenticate the peer between sessions
 * Handshake server: third-party channel that allow to interconnect two peers
   externally to the P2P network and bootstrap into this. It can be any medium
   that allow a one-to-many communication (Pub-Sub) so currently connected peers
   can be able to listen to new ones and send to them connection requests.
 * HandshakeManager: 


# Constants

## MTU - Max Transmission Units
 * PubNub: 1800 bytes
 * DataChannels: 1280 bytes (assumed by Chrome)

Max SCTP payload: 1192 to 1320 (https://groups.google.com/d/msg/discuss-webrtc/LZsm-jbP0zA/Tim9ODhWsI8J)


## Length of a public-key
 * 1024 bits = 128 bytes
 * 2048 bits = 256 bytes


# Messages

## Presence message
 * ttl:    [1 byte] = 0
 * from:   [sessionID] = session public-key

Total message size: 1+256 = **257 bytes**

If 'ttl' is zero and 'data' field length is equals to a sessionID length, then
'data' field is in fact the 'from' field containing the sender sessionID in
clear so other peers can be able to send it a connection requests.


## Regular messages
 * ttl:    [1 byte] = 5
 * data:   [encrypted data]

A 'ttl' field greater that zero means it's a valid, cyphered message. The 'data'
field is encrypted with the destination peer sessionID, so only it can decode
the message using its session private-key. Each peer that receive the message
MUST to try to decode it with its session private-key to identify if they are
the receipts, and if so process it accordingly.


## Encrypted data field

### Common fields
 * method: [1 byte] = error=-1 | offer|answer|authenticate|candidate
 * id:     [1 byte] = message ID

Errors are defined by negative numbers (0x80-0xFF) in the 'method' field

Message ID is generated on a per-destination basis, so this way it can be more constrained.

Total size: 1+1 = 2 bytes


### Error
 * data: [1192-(1+2) = 1189 bytes]


### Offer
 * from: [sessionID] = session public-key
 * sdp:  [1192-(1+2)-256 = 933 bytes]


### Answer
 * sdp: [1192-3 = 1189 bytes]

### Authenticate
* timestamp: [8 bytes]
* signature: [256 bytes] = signature with userID over timestamp (digest-like) to identify & authenticate

Total size: 2+8+256 = 266 bytes
Total message size: 1+266 = 267 bytes


### Candidate
 * sdp: [1192-3 = 1189 bytes]


## Map of messages

           | Error     | Presence | Offer    | Answer   | Authenticate  | Candidate |
|----------|===========|==========|==========|==========|===============|===========|
| 0        | ttl=5     | ttl=0    | ttl=5    | ttl=5    | ttl=5         | ttl=5     |
|----------|===========|----------|==========|==========|===============|===========|
| 1        | method=-1 | from     | method=1 | method=2 | method=3      | method=4  |
|----------|-----------| (256)    |----------|----------|---------------|-----------|
| 2        | id        |          | id       | id       | id            | id        |
|----------|-----------|          |----------|----------|---------------|-----------|
| 3-10     | data      |          | from     | sdp      | timestamp (8) | sdp       |
|----------| (1189)    |          | (256)    | (1189)   |---------------| (1189)    |
| 11-256   |           |          |          |          | signature     |           |
|----------|           |==========|          |          | (256)         |           |
| 256-258  |           |          |          |          |               |           |
|----------|           |          |----------|          |               |           |
| 259-266  |           |          | sdp      |          |               |           |
|----------|           |          | (933)    |          |===============|           |
| 267-1192 |           |          |          |          |               |           |
|----------|===========|          |==========|==========|               |===========|


# Encryption scheme

The encryption scheme is build around public keys, one randomly created for each
session to anonimize data transmission (sessionID), and another one to identify
and authenticate the user between sessions (userID).

The presence message send as payload the new peer sessionID, that 
