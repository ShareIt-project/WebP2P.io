The protocol is mainly focused on WebRTC DataChannels, Javascript and
ArrayBuffers, but it could be implemented over other technology that allow
manipulation and transmission of binary data.


# Encryption scheme

The encryption scheme is build around public keys, one randomly created for each
session to anonimize data transmission (sessionID), and another one to identify
and authenticate the user between sessions (userID).

The presence message send as payload the new peer sessionID, that 