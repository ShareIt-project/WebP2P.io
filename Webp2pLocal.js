webp2p.Webp2pLocal = function(db)
{
  var peersManager = new PeersManager(db)

  /**
   * Start the download of a file
   * @param {Fileentry} Fileentry of the file to be downloaded.
   */
  this.transfer_begin = function(fileentry)
  {
    peersManager.transfer_begin(fileentry)
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
  this.connectTo = function(uid, onsuccess, onerror, incomingChannel)
  {
    peersManager.connectTo(uid, onsuccess, onerror, incomingChannel)
  }

  this.files_downloading = function(onsuccess)
  {
    peersManager.files_downloading(onsuccess)
  }

  this.files_sharing = function(onsuccess)
  {
    peersManager.files_sharing(onsuccess)
  }

  // Init cache backup system
  var cacheBackup = new CacheBackup(db, peersManager)

  this.cacheBackup_export = function(onfinish, onprogress, onerror)
  {
    cacheBackup.export(onfinish, onprogress, onerror)
  }

  this.cacheBackup_import = function(blob, onerror)
  {
    cacheBackup.export(blob, onerror)
  }

  // Init sharedpoints manager
  var sharedpointsManager = new SharedpointsManager(db, peersManager)

  this.sharedpointsManager_getSharedpoints = function(onsuccess)
  {
    sharedpointsManager.getSharedpoints(onsuccess)
  }

  this.sharedpointsManager_addSharedpoint_Folder = function(files, onsuccess, onerror)
  {
    sharedpointsManager.addSharedpoint_Folder(files, onsuccess, onerror)
  }
}