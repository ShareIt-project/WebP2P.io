/**
 * Save a {Blob} to the user hard disk
 * @param {Blob} blob {Blob} to be saved
 * @param {String} name Name that will have the saved file
 */
function savetodisk(blob, name)
{
    // Auto-save downloaded file
    var save = document.createElement("A");
        save.href = window.URL.createObjectURL(blob)
        save.target = "_blank"  // This can give problems...
        save.download = name    // This force to download with a filename instead of navigate

    save.click()

    // Hack to remove the ObjectURL after it have been saved and not before
    setTimeout(function()
    {
        window.URL.revokeObjectURL(save.href)
    }, 1000)
}

/**
 * Update the data content of a {Fileentry}
 * @param {Fileentry} fileentry {Fileentry} to be updated
 * @param {Number} chunk Chunk position to be updated
 * @param data Data to be set
 */
function updateFile(fileentry, chunk, data)
{
    fileentry.bitmap.set(chunk, true)

    // Create new FileWriter
    var fw = new FileWriter(fileentry.blob)

    // Calc and set pos, and increase blob size if necessary
    var pos = chunk * chunksize;
    if(fw.length < pos)
        fw.truncate(pos)
    fw.seek(pos)

    // Write data to the blob
    var blob = fw.write(data)

    // This is not standard, but it's the only way to get out the
    // created blob
    if(blob != undefined)
        fileentry.blob = blob
}