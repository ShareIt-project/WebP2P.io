var webp2p = new webp2p.Webp2pLocal()


self.onmessage = function(event)
{
  function result(err, res)
  {
    // requests without an id are notifications, to which responses are
    // supressed
    if(event.id !== null)
    {
      var response = {id: event.id}

      if(err)
        response.error = err.message

      else
        response.result = res || null

      self.send(response)
    }
  }

  var method

  switch(event.method)
  {
    case 'cacheBackup.export':
      method = webp2p.cacheBackup_export
      break;

    case 'cacheBackup.import':
      method = webp2p.cacheBackup_import
      break;

    case 'connectTo':
      method = webp2p.connectTo
      break;

    case 'files.downloading':
      method = webp2p.files_downloading
      break;

    case 'files.sharing':
      method = webp2p.files_sharing
      break;

    case 'numPeers':
      method = webp2p.numPeers
      break;

    case 'sharedpointsManager.addSharedpoint_Folder':
      method = webp2p.sharedpointsManager_addSharedpoint_Folder
      break;

    case 'sharedpointsManager.getSharedpoints':
      method = webp2p.sharedpointsManager_getSharedpoints
      break;

    case 'transfer.begin':
      method = webp2p.transfer_begin
      break;
  }

  if(typeof method == 'function')
  {
    var params = event.args || [];
    // push result function as the last argument
    params.push(result);

    // invoke the method
    try
    {
      method.apply(webp2p, params);
    }
    catch(err)
    {
      result(err);
    }
  }
  else
    result(new Error('Method Not Found'));
};