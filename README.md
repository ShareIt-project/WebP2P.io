# WebP2P - Pure Javascript framework for Peer to Peer applications over WebRTC

Jesús Leganés Combarro "[piranna](https://github.com/piranna)" - [piranna@gmail.com]

[![NPM](https://nodei.co/npm/webp2p.png?downloads=true&stars=true)](https://nodei.co/npm/webp2p/)

[WebP2P](http://webp2p.io) is a Peer-to-Peer signaling channel framework mainly focused on the easy development of P2P applications in pure Javascript. This code was formerly part of [ShareIt!](https://github.com/ShareIt-project/ShareIt) pure Javascript P2P filesharing application, winner of the [Universitary Free Software Championship 2013](http://www.concursosoftwarelibre.org/1213), and now it's part as a standalone library of the [ShareIt project](http://shareit.es).

If you fork the project (specially if you want to do modifications) please
send me an email just to let me know about your progress :-)

## About

[WebRTC](http://www.webrtc.org) specification lacks of a signaling channel to interconnect two peers, leaving up to the developer what to use instead, being this an intermediary web server via Ajax or WebSockets, a chat room, or also [pigeons](http://en.wikipedia.org/wiki/IP_over_Avian_Carriers). It needs a signaling channel, it lacks a signaling channel: WebP2P is that missing signaling channel.

WebP2P abstract all this signaling channels used to connect two peers ("handshake" channels), leaving only a simple API that just give you a WebRTC PeerConnection object connected with the other desired peer ready to use. Also, its protocol is capable to connect two peers using another ones as intermediary handshake channels using WebRTC [DataChannels]
(http://dev.w3.org/2011/webrtc/editor/webrtc.html#rtcdatachannel), leaving to you to only need to think what your P2P application will do.

## How to download it

Code is distributed as a [NPM package](https://www.npmjs.org/package/webp2p). You can download it just executing ```npm install webp2p``` from your command line. After that, WebP2P and all its dependencies will be installed. You can also build a browser specific version using [Grunt](http://gruntjs.com), just exec from the root folder ```node_modules/.bin/grunt``` and it will generate a browser ready version on the ```/dist``` folder.

## Basic usage

Using ```require()``` just returns a WebP2P constructor. Calling this one creates a new object that will manage the connections with all the handshake channels and with other peers. For the most basic usage, you'll only need the ```connectTo()``` method and the ```peerconnection``` event. On success, both will give you a connected WebRTC PeerConnection object.

```Javascript
var WebP2p = require('webp2p');

var handshake_servers = <server connection data>;

// Peer 1
var options1 =
{
  sessionID: 'peer 1',
  handshake_servers: handshake_servers
};

var peer1 = new WebP2P(options1);

peer1.on('peerconnection', function(peerConnection)
{
  console.log('Connected to peer 2');
});

// Peer 2
var options2 =
{
  sessionID: 'peer 2',
  handshake_servers: handshake_servers
};

var peer2 = new WebP2P(options2);

peer2.on('connected', function()
{
  peer2.connectTo('peer 1', function(peerConnection)
  {
    console.log('Connected to peer 1');
  });
});

```

## How to test it

WebP2P is heavily tested using [QUnit](http://qunitjs.com). Once you have downloaded all its dependencies and generated the browser version, just open the file ```test/index.html``` on a WebRTC enabled browser connected to internet. This last requeriment is due because tests run against external handshake servers. Currently is being used primarily [PubNub](http://www.pubnub.com), it's being researched to use some more standard and distributed handshake protocols in an annonimous way so this single-point-of-failure could be dropped.

Alternatively, you can test it from command line using ```npm test``` thanks to the [node-webrtc](http://js-platform.github.io/node-webrtc) package, but due to their alpha status, it's not guaranted to work. Node.js support is maintained up to date as future proof, through.

## Mailing List

If you'd like to discuss P2P web applications further, send an email to 

> webp2p@librelist.com

and you'll be part of the discussion mailing list! ([Archives here]
(http://librelist.com/browser/webp2p/)).

## Some related project

* [WebRTC.io](https://github.com/webRTC/webRTC.io)
* [PeerJS](http://peerjs.com)

## License

All this code is under the Affero GNU General Public License. I am willing to relicense it under the BSD/MIT/Apache license, I simply ask that you email me and tell me why. I'll almost certainly agree.

Patches graciously accepted!
