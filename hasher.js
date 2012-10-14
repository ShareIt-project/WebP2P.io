function Hasher(db)
{
    var worker = new Worker('js/webp2p/hasher_worker.js');
        worker.onmessage = function(event)
        {
            db.files_add(event.data)

            if(this.onsuccess)
                this.onsuccess()
        }

    this.hash = function(fileslist)
    {
        worker.postMessage(fileslist)

        // Loop through the FileList and add sharedpoints to list.
        for(var i=0, file; file=fileslist[i]; i++)
            db.sharepoints_add(file)
    }

    this.refresh()
    {
        db.sharepoints_getAll(null, function(fileslist)
        {
            worker.postMessage(fileslist)
        })
    }
}