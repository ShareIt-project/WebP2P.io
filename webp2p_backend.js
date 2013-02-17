var webp2p = new webp2p.Webp2pLocal(db)


self.onmessage = function(event)
{
  var args = event.data.slice(1)

  switch(event.data[0])
  {
    case 'cacheBackup.export':
      webp2p.cacheBackup_export.apply(webp2p, args)
      break;

    case 'cacheBackup.import':
      webp2p.cacheBackup_import.apply(webp2p, args)
      break;

    case 'connectTo':
      webp2p.connectTo.apply(webp2p, args)
      break;

    case 'files.downloading':
      webp2p.files_downloading.apply(webp2p, args)
      break;

    case 'files.sharing':
      webp2p.files_sharing.apply(webp2p, args)
      break;

    case 'numPeers':
      webp2p.numPeers.apply(webp2p, args)
      break;

    case 'sharedpointsManager.addSharedpoint_Folder':
      webp2p.sharedpointsManager_addSharedpoint_Folder.apply(webp2p, args)
      break;

    case 'sharedpointsManager.getSharedpoints':
      webp2p.sharedpointsManager_getSharedpoints.apply(webp2p, args)
      break;

    case 'transfer.begin':
      webp2p.transfer_begin.apply(webp2p, args)
      break;

    default:
  }
};