function Dropbox(options)
{
    var driver = new Dropbox.Drivers.Popup({receiverFile: "oauth_receiver.html"})

    var client = new Dropbox.Client(options);
        client.authDriver(driver);

}