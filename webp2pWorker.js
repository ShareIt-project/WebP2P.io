// Based on code from https://github.com/jaredhanson/jsonrpc-postmessage

webp2p.Webp2pWorker = function(channel)
{
  EventTarget.call(this);

  var self = this

  var timeout = 5000
  var handlers = {}
  var requestID = 1


  channel.onmessage = function(event)
  {
    var id = event.id
    if(id === null || id === undefined) return

    var handler = handlers[id];
    if(handler)
      handler.call(self, event.error, event.result);

    delete handlers[id];
  }


  function call(method)
  {
    var args = Array.prototype.slice.call(arguments, 1)
    var sb = (args.length && typeof args[args.length - 1] == 'function') ? args.pop() : null;

    var request =
    {
      id: requestID++,
      method: method,
      args: args
    }

    handlers[request.id] = cb

    setTimeout(function()
    {
      var handler = handlers[request.id];
      if(handler)
        handler.call(self, new Error('Timed Out'));

      delete handlers[request.id];
    }, timeout);

    channel.send(request);
  }


  this.cacheBackup_export = function(onfinish, onprogress, onerror)
  {
  }

  this.cacheBackup_import = function(blob, onerror)
  {
  }

  /**
   * Connects to another peer based on its UID. If we are already connected,
   * it does nothing.
   * @param {UUID} uid Identifier of the other peer to be connected.
   * @param {Function} onsuccess Callback called when the connection was done.
   * @param {Function} onerror Callback called when connection was not possible.
   * @param {MessageChannel} incomingChannel Optional channel where to
   * send the offer. If not defined send it to all connected peers.
   */
  this.connectTo = function(uid, incomingChannel, cb)
  {
    call('connectTo', uid, incomingChannel, cb)
  }

  this.files_downloading = function(onsuccess)
  {
  }

  this.files_sharing = function(onsuccess)
  {
  }

  this.numPeers = function(onsuccess)
  {
  }

  this.sharedpointsManager_addSharedpoint_Folder = function(files, cb)
  {
  }

  this.sharedpointsManager_getSharedpoints = function(onsuccess)
  {
  }

  /**
   * Start the download of a file
   * @param {Fileentry} Fileentry of the file to be downloaded.
   */
  this.transfer_begin = function(fileentry)
  {
  }


  function forwardEvent(event)
  {
    self.dispatchEvent(event);
  }

  peersManager.addEventListener('error.noPeers', forwardEvent);

  peersManager.addEventListener('file.added',   forwardEvent);
  peersManager.addEventListener('file.deleted', forwardEvent);

  peersManager.addEventListener('sharedpoints.update', forwardEvent);

  peersManager.addEventListener('transfer.begin', forwardEvent);
  peersManager.addEventListener('transfer.end', forwardEvent);
  peersManager.addEventListener('transfer.update', forwardEvent);

  peersManager.addEventListener('uid', forwardEvent);
}