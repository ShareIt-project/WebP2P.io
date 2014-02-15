The protocol is mainly focused on WebRTC DataChannels, Javascript and
ArrayBuffers, but it could be implemented over other technology that allow
manipulation and transmission of binary data.


### Authenticate
* timestamp: [8 bytes]
* signature: [256 bytes] = signature with userID over timestamp (digest-like) to
identify & authenticate

Total size: 2+8+256 = 266 bytes
Total message size: 1+266 = 267 bytes


### Candidate
 * sdp: [1192-3 = 1189 bytes]


# Encryption scheme

The encryption scheme is build around public keys, one randomly created for each
session to anonimize data transmission (sessionID), and another one to identify
and authenticate the user between sessions (userID).

The presence message send as payload the new peer sessionID, that 