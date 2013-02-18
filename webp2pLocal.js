webp2p.Webp2pLocal = function()
{
  EventTarget.call(this);

  var self = this


  function forwardEvent(event)
  {
    self.dispatchEvent(event);
  }


  // Init database
  DB_init(function(db)
  {
    var peersManager = new PeersManager(db)

    // Init cache backup system
    var cacheBackup = new CacheBackup(db, peersManager)

    // Init sharedpoints manager
    var sharedpointsManager = new SharedpointsManager(db, peersManager)


    self.cacheBackup_export = function(onfinish, onprogress, onerror)
    {
      cacheBackup.export(onfinish, onprogress, onerror)
    }

    self.cacheBackup_import = function(blob, onerror)
    {
      cacheBackup.import(blob, onerror)
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
    self.connectTo = function(uid, incomingChannel, cb)
    {
      peersManager.connectTo(uid, incomingChannel, cb)
    }

    self.files_downloading = function(onsuccess)
    {
      peersManager.files_downloading(onsuccess)
    }

    self.files_sharing = function(onsuccess)
    {
      peersManager.files_sharing(onsuccess)
    }

    self.numPeers = function(onsuccess)
    {
      onsuccess(Object.keys(peersManager.getChannels()).length);
    }

    self.sharedpointsManager_addSharedpoint_Folder = function(files, cb)
    {
      sharedpointsManager.addSharedpoint_Folder(files, cb)
    }

    self.sharedpointsManager_getSharedpoints = function(onsuccess)
    {
      sharedpointsManager.getSharedpoints(onsuccess)
    }

    /**
     * Start the download of a file
     * @param {Fileentry} Fileentry of the file to be downloaded.
     */
    self.transfer_begin = function(fileentry)
    {
      peersManager.transfer_begin(fileentry)
    }


    peersManager.addEventListener('error.noPeers', forwardEvent);

    peersManager.addEventListener('file.added',   forwardEvent);
    peersManager.addEventListener('file.deleted', forwardEvent);

    peersManager.addEventListener('sharedpoints.update', forwardEvent);

    peersManager.addEventListener('transfer.begin',  forwardEvent);
    peersManager.addEventListener('transfer.end',    forwardEvent);
    peersManager.addEventListener('transfer.update', forwardEvent);

    peersManager.addEventListener('uid', forwardEvent);
  })
}