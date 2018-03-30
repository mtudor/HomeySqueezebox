# HomeySqueezebox
Control your Logitech Squeezebox server and devices with your Athom Homey!  Current functionality is restricted to 
cards for the **then** column of the flow builder.  Currently you cannot manually control Squeezeboxes from the devices 
page. Homey Music integration is not yet available.

Please read the Getting Started instructions carefully, and do feel free to drop me a message if you have any issues.

## Getting Started

### Configure the App
Please follow these instructions carefully. Whilst this app is in ALPHA, missing steps can result in unexpected 
behaviour.

1. Install HomeySqueezebox from the App Store.
2. Once installed, the app **must** be configured from the new `Squeezebox` item in the `Settings` section of Homey.
    1. Open the `Settings > Squeezebox` page and enter the address and port number of the Logitech Media Server.
    2. The Server Address should be specified as the address of the Logitech Media Server, including the `http://` part.
    A name _or_ IP Address can be used.
    3. Usually, leaving the Server Port at the default 9000 is fine. It may, however, be a different port; for example,
    Logitech Media Server installed on a Synology NAS uses port 9002 by default.
3. With the app configured, you can now add your individual Squeezeboxes. In the `Devices` section of Homey, click the
plus symbol in the appropriate room / zone and choose **Squeezebox** from the device type window. You can then pick any
of the Squeezeboxes that are registered with your Logitech Media Server.
4. Once your Squeezeboxes have been added, you will find that they can be used in the **then** column of flows for 
basic functionality such as pause, play, volume, start playlist. More functionality will follow.

##### Example Server Addresses
````
Server Address: http://squeezebox.mydomain.co.uk
Server Address: http://squeezebox
Server Address: http://192.168.0.1
````



## WARNING
If you do not configure HomeySqueezebox in `Settings` before attempting to add devices, the app will always fail when 
searching for Squeezeboxes with the message "There were no new devices found!". If you specify the wrong server 
address, or if the server is not reachable, the app will search for new Squeezeboxes forever, finding nothing!


## App Status
This is an **alpha** release. A lot of people are waiting on the app but unfortunately I do not have time to implement
everything just yet due to personal commitments. I want people to get benefit as early as possible, so here it is in an
early form. There is a _lot_ more that I would like to add. Once I have more time I will aim to do this.

## Feature Requests
If there is anything you would really like to have sooner rather than later then please raise an issue in the GitHub
repository so that we can track it and others can *+1* their favourites.

## App Store Ratings
I'd ask you to either rate the app based on the features that are present (not what is missing) or withhold your
ratings until we're out of alpha. Bad ratings now probably won't help when the app does eventually come out of alpha!
Having said that, hopefully you won't find anything to rate badly as what's there should work reasonably well.

## Help
If you need any assistance then please feel free to drop me a message on Slack (in the athom community) or via Twitter
@marktudor. I'll be happy to help!
