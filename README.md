#HomeySqueezebox
Control your Logitech Squeezebox server and devices with your Athom Homey!

##Getting Started

###Add your Squeezeboxes
As with all devices in Homey, you should add your Squeezeboxes on the **Zones and Devices** page. Just click the **+** in the
appropriate room and choose *Squeezebox* from the device type window. 
Usually, leaving the Server Port at the default port (9000) is fine. 
The Server Address should be specified as the address of the Logitech Media Server: 
A name or IP address can be used

```
Server Address: http://squeezebox.mydomain.co.uk
Server Address: http://squeezebox
Server Address: http://192.168.0.1
```

You can then pick any of the Squeezeboxes that are
registered with your Logitech Media Server.

##App Status
This is an **alpha** release. A lot of people are waiting on the app but unfortunately I do not have time to implement
everything just yet due to personal commitments. I want people to get benefit as early as possible, so here it is in an
early form. There is a _lot_ more that I would like to add. Once I have more time (post 19th September) I will aim to do this.

##Feature Requests
If there is anything you would really like to have sooner rather than later then please raise an issue in the GitHub
repository so that we can track it and others can *+1* their favourites. I will add a few features myself in the next
few weeks so that you can see what I have in mind.

##App Store Ratings
I'd ask you to either rate the app based on the features that are present (not what is missing) or withhold your ratings
until we're out of alpha. Bad ratings now probably won't help when the app does eventually come out of alpha! Having
said that, hopefully you won't find anything to rate badly as what's there should work reasonably well.

##Help
If you need any assistance then please feel free to drop me a message on Slack (in the Athom community) or via Twitter
@marktudor. I'll be happy to help!

##To do
* Better error detection all around the driver
* Better connection management to the server (is initiated again every time info is requested) 
* HTTPS support
* Support for authentication
* Enhance mobile card with basic controls:
    * start/pause - Currently as a picker. I a feature Homey firmware update support for multi state icons is added
    * currently playing - Not supported by current Homey firmware (0.9.3) because there is no mobile card item with a string
* Detect if a Squeezebox is already added while adding new devices
* Create a list of devices in the pairing wizard rather than adding all Squeezeboxes on that server to Homey

## Known bugs
* While searching for a playlist, auto complete isn't working as expected
* Error message while adding devices for the second time (because Homey already knows some)