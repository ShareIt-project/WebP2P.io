window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;

function DB_init(onsuccess)
{
	var version = 2

	function upgradedb(db)
	{
	    // Create an objectStore to hold information about the share points.
	    db.createObjectStore("sharepoints", { keyPath: "name" });
	
	    // Create an objectStore to hold information about the shared files.
	    // We're going to use "hash" as our key path because it's guaranteed to
	    // be unique.
	    db.createObjectStore("files", { keyPath: "hash" });
	
	    console.debug("upgradedb");
	}

	var request = indexedDB.open("ShareIt", version);
	    request.onerror = function(event)
	    {
	        alert("Why didn't you allow my web app to use IndexedDB?!");
	    };
	    request.onsuccess = function(event)
	    {
	        var db = request.result;
	
	        // Hack for old versions of Chrome/Chromium
	        if(version != db.version)
	        {
	            var setVrequest = db.setVersion(version);
	                setVrequest.onsuccess = function(e)
	                {
	                    upgradedb(db);
	                };
	        }

	        db._add = function(objectStore, data, onsuccess, onerror)
	        {
	            var transaction = db.transaction(objectStore, "readwrite");
	            var objectStore = transaction.objectStore(objectStore);
	
	            // [To-Do] Check current objectStore and update files on duplicates
	
	            var request = objectStore.add(data);
	            if(onsuccess != undefined)
	                request.onsuccess = function(event)
	                {
	                    onsuccess(request.result)
	                };
	            if(onerror != undefined)
	                request.onerror = function(event)
	                {
	                    onerror(event.target.errorCode)
	                }
	        }

	        db._get = function(objectStore, key, onsuccess, onerror)
	        {
	            var transaction = db.transaction(objectStore);
	            var objectStore = transaction.objectStore(objectStore);

		        var request = objectStore.get(key);
                    request.onsuccess = function(event)
                    {
                        onsuccess(request.result);
                    };
                if(onerror != undefined)
                    request.onerror = function(event)
                    {
                        onerror(event.target.errorCode)
                    };
	        }

	        db._getAll = function(objectStore, range, onsuccess, onerror)
	        {
	            var result = [];

	            var transaction = db.transaction(objectStore);
	            var objectStore = transaction.objectStore(objectStore);

		        var cursor = objectStore.openCursor(range)
                    cursor.onsuccess = function(event)
                    {
                        var cursor = event.target.result;
                        if(cursor)
                        {
                            result.push(cursor.value);
                            cursor.continue();
                        }
                        else
                            onsuccess(result);
                    };
                if(onerror != undefined)
                    cursor.onerror = function(event)
                    {
                        onerror(event.target.errorCode);
                    };
	        }

	        db._put = function(objectStore, data, onsuccess, onerror)
	        {
	            var transaction = db.transaction(objectStore, "readwrite");
	            var objectStore = transaction.objectStore(objectStore);
	
	            // [To-Do] Check current sharepoints and update files on duplicates
	
	            var request = objectStore.put(data);
	            if(onsuccess != undefined)
	                request.onsuccess = function(event)
	                {
	                    onsuccess(request.result)
	                };
	            if(onerror != undefined)
	                request.onerror = function(event)
	                {
	                    onerror(event.target.errorCode)
	                }
	        }

            db.sharepoints_add = function(file, onsuccess, onerror)
            {
                db._add("sharepoints", file, onsuccess, onerror);
            }

            db.sharepoints_get = function(key, onsuccess, onerror)
            {
                db._get("sharepoints", key, onsuccess, onerror);
            }

            db.sharepoints_getAll = function(range, onsuccess, onerror)
            {
                db._getAll("sharepoints", range, onsuccess, onerror);
            }

            db.sharepoints_put = function(file, onsuccess, onerror)
            {
                db._put("sharepoints", file, onsuccess, onerror);
            }

            db.files_add = function(file, onsuccess, onerror)
            {
                db._add("files", file, onsuccess, onerror);
            }

            db.files_get = function(key, onsuccess, onerror)
            {
                db._get("files", key, onsuccess, onerror);
            }

            db.files_getAll = function(range, onsuccess, onerror)
            {
                db._getAll("files", range, onsuccess, onerror);
            }

            db.files_put = function(file, onsuccess, onerror)
            {
                db._put("files", file, onsuccess, onerror);
            }

			if(onsuccess)
				onsuccess(db);
	    };
	    request.onupgradeneeded = function(event)
	    {
	        upgradedb(event.target.result);
	    };
}