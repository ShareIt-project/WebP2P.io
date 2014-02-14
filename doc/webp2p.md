The protocol is mainly focused on WebRTC DataChannels, Javascript and
ArrayBuffers, but it could be implemented over other technology that allow
manipulation and transmission of binary data.


# Messages


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




# Encryption scheme

The encryption scheme is build around public keys, one randomly created for each
session to anonimize data transmission (sessionID), and another one to identify
and authenticate the user between sessions (userID).

The presence message send as payload the new peer sessionID, that 
