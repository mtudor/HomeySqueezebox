"use strict";

var devices = {};
var intervals = {};

/**
 * Checks is the variable has a value
 * @param string        Variable to check
 * @returns {boolean}   Returns true if there is a value
 */
function hasValue(string) {
    return !!(typeof string != 'undefined' && string != null);
}

/**
 * Checks the server data array if they are valid
 * @param server_data   Variable to check
 * @returns {boolean}   Returns true if the data checks out
 */
function checkServerData(server_data) {
    var result = true;

    if (!hasValue(server_data.address)) result = false;
    if (!hasValue(server_data.port)) {
        result = false;
    } else if (server_data.port > 65536 || server_data.port < 1) {
        result = false;
    }

    return result;
}

/**
 * Checks if the object is already in Array
 * @param array         Array to check in
 * @param obj           Object to find
 * @returns {boolean}   True if object is array, false otherwise
 */
function contains(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function getPosition(str, text, occurrence) {
    return str.split(text, occurrence).join(text).length;
}

module.exports.init = function(devices_data, callback) {
    Homey.log("init in driver.js started");
    if (devices_data.length > 0) devices_data.forEach(initDevice);
    else Homey.log('No Squeezbox devices in Homey');

    Homey.manager('flow').on('action.off', function (callback, args) {
        Homey.log('flow action off');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.onoff.set(
            args.device,
            false,
            function (err, reply) {
                if (err) callback(err, null);
                else callback(null, reply);
            }
        );
    });

    Homey.manager('flow').on('action.on', function (callback, args) {
        Homey.log('flow action on');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.onoff.set(
            args.device,
            true,
            function (err, reply) {
                if (err) callback(err, null);
                else callback(null, reply);
            }
        );
    });

    Homey.manager('flow').on('action.play', function (callback, args) {
        Homey.log('flow action play');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.play_stop.set(
            args.device,
            true,
            function (err, reply) {
                if (err) callback(err, null);
                else callback(null, reply);
            }
        );
    });

    Homey.manager('flow').on('action.pause', function (callback, args) {
        Homey.log('flow action pause');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.play_stop.set(
            args.device,
            false,
            function (err, reply) {
                if (err) callback(err, null);
                else callback(null, reply);
            }
        );
    });

    Homey.manager('flow').on('action.volume', function (callback, args) {
        Homey.log('flow action volume');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.volume_set.set(
            args.device,
            args.volume/100,
            function (err, reply) {
                if (err) callback(err, null);
                else callback(null, reply);
            }
        );
    });

    Homey.manager('flow').on('action.playPlaylist', function (callback, args) {
        Homey.log('flow action play playlist');
        Homey.log('args: ', args);
        var id = args.device.id;
        var device = devices[id];

        if (device.online == true) {
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            mySqueezeServer.on('register', function () {
                if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                    mySqueezeServer.request(
                        device.id,
                        ["playlistcontrol", "cmd:load", "playlist_id:" + args.playlist.id],
                        function (reply) {
                            if (reply.ok == true) {
                                if (reply.result.count > 0) {
                                    callback(null, true);
                                } else {
                                    callback(__('app.msg_playlistNotFoundOnServer', {
                                        "playlistName": args.playlist.name,
                                        "serverName": device.server
                                    }), false);
                                }
                            } else callback(reply.result, null);
                        }
                    );
                } else {
                    setDeviceAvailable(device, false);
                    Homey.log("Unable to get the status for device", device.id);
                    callback(__('app.msg_unableGetStatus'),null);
                }
            });
        } else {
            Homey.log('device', device.id, 'is offline');
            callback(__('app.msg_deviceOffline'), null);
        }
    });

    Homey.manager('flow').on('action.playPlaylist.playlist.autocomplete', function (callback, args) {
        var id = args.args.device.data.id
        var device = devices[id];
        var url = device.protocol + device.server;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device.port);

        mySqueezeServer.on('register', function () {
            var searchParams = ["playlists", 0, 10];
            if (args.query != '') {
                searchParams.push('search:' + args.query);
            }

            mySqueezeServer.request(
                id,
                searchParams,
                function (reply) {
                    var playlists = [];

                    if (reply.result.count > 0) {
                        playlists = reply.result.playlists_loop.map(function (item) {
                            return {
                                id: item.id,
                                name: item.playlist
                            };
                        });
                    }
                    // TODO: Detect failures.
                    if (typeof callback == 'function') {
                        callback(null, playlists);
                    }
                }
            );
        });
    });

    Homey.manager('flow').on('action.next', function (callback, args) {
        Homey.log('flow action next');
        var id = args.device.id;
        var device = devices[id];
        if (device.online == true) {
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            mySqueezeServer.on('register', function () {
                if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                    mySqueezeServer.players[id].next(function (reply) {
                        if (!reply.ok) callback(reply, null);
                        else callback(null, true);
                    });
                } else {
                    setDeviceAvailable(device, false);
                    Homey.log("Unable to get the status for device", device.id);
                    callback("Unable to get the status of the device", null);
                }
            });
        } else {
            Homey.log('device', device.id, 'is offline');
            callback("Device is offline", null);
        }
    });

    Homey.manager('flow').on('action.previous', function (callback, args) {
        Homey.log('flow action previous');
        var id = args.device.id;
        var device = devices[id];

        if (device.online == true) {
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            mySqueezeServer.on('register', function () {
                if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                    mySqueezeServer.players[id].previous(function (reply) {
                        if (!reply.ok) callback(reply, false);
                        else callback(null, true);
                    });
                } else {
                    setDeviceAvailable(device, false);
                    Homey.log("Unable to get the status for device", device.id);
                    callback(__('app.msg_unableGetStatus'),null);
                }
            });
        } else {
            Homey.log('device', device.id, 'is offline');
            callback(__('app.msg_deviceOffline'), null);
        }
    });

    Homey.manager('flow').on('action.seek', function (callback, args) {
        Homey.log('flow action seek');
        var id = args.device.id;
        var device = devices[id];

        if (device.online == true) {
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            mySqueezeServer.on('register', function () {
                if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                    mySqueezeServer.players[id].seek(args.second, function (reply) {
                        if (!reply.ok) callback(reply, false);
                        else callback(null, true);
                    });
                } else {
                    setDeviceAvailable(device, false);
                    Homey.log("Unable to get the status for device", device.id);
                    callback(__('app.msg_unableGetStatus'),null);
                }
            });
        } else {
            Homey.log('device', device.id, 'is offline');
            callback(__('app.msg_deviceOffline'), null);
        }
    });

    callback(null, true); // Let Homey know init is done.
};

module.exports.pair = function(socket) {

    socket.on('find_servers', function (data, callback) {
        var Client = require('node-ssdp').Client
            , client = new Client();

        Homey.log('find_servers');

        var foundDevices = [];

        client.on('response', function inResponse(headers, code, rinfo) {

            if (headers.SERVER.toLowerCase().indexOf('logitechmediaserver') > 0 && headers.LOCATION.toLowerCase().indexOf('player') < 0) {
                // Only add server, not the players which are also broad casted by the server

                Homey.log('');
                Homey.log('Headers', headers);

                var url = headers.LOCATION;
                var protocol = url.slice(0, url.indexOf('://') + 3);
                var address = url.slice(url.indexOf('://') + 3, getPosition(url, ':', 2));
                var port = url.slice(getPosition(url, ':', 2) + 1, getPosition(url, '/', 3));

                Homey.log('protocol', protocol);
                Homey.log('address', address);
                Homey.log('port', port);

                Homey.log('add device to list');
                foundDevices.push({'protocol': protocol, 'address': address, 'port': port});
            }

        });

        // do ssdp search
        Homey.log('search started');
        client.search('upnp:rootdevice');

        var timeoutScanDone = 10 * 1000;                            // 10 Seconds

        // And after a period of time, you want to stop
        setTimeout(function () {
            // Homey.log('found devices', foundDevices);
            Homey.log('search stopped');
            Homey.log('Found servers', foundDevices);
            client.stop();
            callback(null, foundDevices);
        }, timeoutScanDone);
    });

    // Validate server connection data
    socket.on('validate', function (server_data, callback) {

        validateConnection(server_data, function(error, result) {
            Homey.log('result', result);
            if (!error) {
                Homey.log('Connection to server successful');
                callback(null, result);
            } else {
                Homey.log('Connection to server failed');
                callback(error, null);
            }
        });
    });

    socket.on('list_players', function (server_data, callback) {

        listPlayers(server_data, function(error, devices) {
            
            Homey.log(error);
            Homey.log(devices);

            if (error == false || error == null) {
                Homey.log('Successfully received servers players');
                callback(null, devices);
            } else {
                Homey.log('Error while getting server players');
                callback(error, null);
            }
        });
    });

    socket.on('get_extraData', function (device_data, callback) {
        
        var url = device_data.protocol + device_data.address;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device_data.port);

        mySqueezeServer.on('register', function () {
            if (mySqueezeServer.players[device_data.id]) {
                mySqueezeServer.players[device_data.id].getStatus(function (reply) {
                    if (reply.ok) callback(null, reply.result);
                    else callback(true, reply);
                });
            } else callback(true, 'Something went wrong');
        });
    });

    // Check if device is already known
    socket.on('checkForKnownDevices', function (device, callback) {
        Homey.log('');
        Homey.log('Full list of devices: ', devices);
        try {
            for (var d in devices) {
                Homey.log('Device to check: ', device);
                if (d.id == device.id) {
                    Homey.log('Device already exists in Homey');
                    callback(null, true);
                }
            }
            // Device not in Homey
            callback(null, false);
        } catch(error) {
            callback(true, error);
        }
    });
};

module.exports.added = function(device_data, callback) {
    Homey.log("added device", device_data);
    initDevice( device_data );
    callback( null, true );
};

module.exports.deleted = function(device_data, callback) {
    Homey.log('Deleting device', device_data.id);
    delete devices[device_data.id];
    callback(null, true);
};

module.exports.renamed = function(device_data, new_name) {
    Homey.log(devices[device_data.id].homey_name + ' has been renamed to ' + new_name);
    devices[device_data.id].homey_name = new_name;
};

module.exports.capabilities = {

    onoff: {
        // Retrieve whether the specified Squeezebox is currently on or off.
        get: function( device_data, callback ) {
            Homey.log('capabilities onoff get for device:', device_data.id);

            var device = devices[device_data.id];

            if (device.online == true) {

                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {
                        mySqueezeServer.players[device.id].getStatus(function (reply) {
                            if (reply.ok) {
                                var power = reply.result.power;
                                if (power == 1) {
                                    callback(null, true);
                                    Homey.log('Device is switched on');
                                } else {
                                    Homey.log('Device is switched off');
                                    callback(null, false);
                                }
                            } else {
                                callback(reply, null);
                            }
                        });
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to get the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device is offline')
            }
        },

        set: function( device_data, turnon, callback ) {
            Homey.log('capabilities onoff set for device', device_data.id, 'to', turnon);

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var device = devices[device_data.id];

            if (device.online == true) {
                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                // TODO: Detect failures. Is there a way to send the new play state to Homey.
                // Turn the specified squeezebox on or off.
                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                        mySqueezeServer.players[device_data.id].power(turnon, function (reply) {
                            if (reply.ok) callback(null, true);
                            else callback(null, false);
                        });
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to set the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device', device_data.id, 'is offline');
                callback(__('app.msg_deviceOffline'), null);
            }
        }
    },

    volume_set: {
        // Retrieve the current volume level of the specified Squeezebox.
        get: function (device_data, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities volume get for device:', device_data.id);

            var device = devices[device_data.id];

            if (device.online == true) {
                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                // Get the volume level of the specified SqueezePlayer.
                var volume;
                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device_data.id])) {
                        mySqueezeServer.players[device_data.id].getVolume(function (reply) {
                            if (reply.ok) {
                                var volume = parseFloat(reply.result);
                                if (volume < 0 || volume > 100) volume = 50;
                                volume = volume / 100;                    // Homey slider range is between 0 and 1
                                Homey.log('volume is', volume);
                                callback(null, volume);
                            } else {
                                callback(reply, null);
                            }
                        });
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to get the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device is offline');
            }
        },

        // Set the volume level of the specified Squeezebox.
        set: function (device_data, volume, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities volume set for device', device_data.id, 'to', volume);

            var device = devices[device_data.id];

            if (device.online == true) {
                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                // Set the volume level of the specified Squeezebox.
                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                        mySqueezeServer.players[device_data.id].setVolume(volume * 100);

                        // TODO: Detect failures. Is there a way to return the new volume level and if so should volume level be
                        // read from the Squeezebox, rather than just parroted back?
                        if (typeof callback == 'function') {
                            callback(null, true);
                        }
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to get the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device', device_data.id, 'is offline');
                callback(__('app.msg_deviceOffline'), null);
            }
        }
    },

    play_stop: {
        // Retrieve whether the specified Squeezebox is currently playing.
        get: function (device_data, callback) {
            // TODO: Support retrieving whether a Squeezebox is currently playing. device_data is the object saved
            // during pairing and callback should return the state in the format callback(err, value).
            Homey.log('capabilities play_stop get for device:', device_data.id);
            var device = devices[device_data.id];

            if (device.online == true) {

                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {
                        mySqueezeServer.players[device.id].getStatus(function (reply) {
                            if (reply.ok) {

                                var mode = reply.result.mode;
                                switch (mode) {
                                    case 'play':
                                        Homey.log('Device is playing');
                                        callback(null, "sq_play");
                                        break;
                                    case "stop":
                                    case "pause":
                                        Homey.log('Device is stopped');
                                        callback(null, "sq_stop");
                                        break;
                                    default:
                                        Homey.log('Current mode isn\'t either play, stop or pause!');
                                        callback(reply, null);
                                }
                            } else callback(reply, null);
                        });
                    } else {
                        Homey.log("Unable to get the status for device", device.id);
                        setDeviceAvailable(device_data, false);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device is offline');
            }
        },

        // Start the specified Squeezebox playing whatever is currently in its playlist.
        set: function (device_data, play, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities play_stop set for device', device_data.id, 'to', play);

            var device = devices[device_data.id];

            if (device.online == true) {
                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                // TODO: Detect failures. Is there a way to send the new play state to Homey.
                // Start playing on the specified squeezebox.
                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                        if (play == true || play == "sq_play") {
                            Homey.log('Start playing for device', device_data.id);
                            mySqueezeServer.players[device_data.id].play(function (reply) {
                                if (reply.ok) callback(null, true);
                                else callback(reply, null);             // send reply because of error
                            });
                        } else {
                            Homey.log('Pause playing for device', device_data.id);
                            mySqueezeServer.players[device_data.id].pause(function (reply) {
                                if (reply.ok) callback(null, true);
                                else callback(reply, null);             // send reply because of error
                            });
                            callback(null, true);
                        }
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to get the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device', device_data.id, 'is offline');
                callback(__('app.msg_deviceOffline'), null);
            }
        }
    },

    sq_repeat: {
        // Retrieve the current volume level of the specified Squeezebox.
        get: function (device_data, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities repeat get for device:', device_data.id);
            var device = devices[device_data.id];

            if (device.online == true) {

                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {
                        mySqueezeServer.players[device.id].getPlaylistRepeat(function (reply) {
                            if (reply.ok) {
                                switch (reply.result) {
                                    case 0:
                                        Homey.log('Repeat off');
                                        callback(null, "sq_repeat_off");
                                        break;
                                    case 1:
                                        Homey.log('Repeat song');
                                        callback(null, "sq_repeat_song");
                                        break;
                                    case 2:
                                        Homey.log('Repeat playlist');
                                        callback(null, "sq_repeat_playlist");
                                        break;
                                    default:
                                        Homey.log('Current repeat isn\'t either off, song or playlist!');
                                        callback(reply, null);
                                }
                            } else {
                                Homey.log('reply not ok', reply);
                                callback(reply, null);
                            }
                        });
                    } else {
                        Homey.log("Unable to get the status for device", device.id);
                        setDeviceAvailable(device_data, false);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device is offline');
            }

        },

        // Set the volume level of the specified Squeezebox.
        set: function (device_data, action, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities repeat set for device', device_data.id, 'to', action);

            var device = devices[device_data.id];

            if (device.online == true) {
                
                switch (action) {
                    case 'sq_repeat_song':
                        action = 'song';
                        break;

                    case 'sq_repeat_playlist':
                        action = 'playlist';
                        break;

                    case 'sq_repeat_off':
                        action = 'off';
                        break;
                }
                
                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                // Set the volume level of the specified Squeezebox.
                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                        mySqueezeServer.players[device_data.id].setPlaylistRepeat(action, function (reply) {
                            if (reply.ok) {
                                callback(null, true);
                            } else callback(reply, null);
                        });
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to set the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device', device_data.id, 'is offline');
                callback(__('app.msg_deviceOffline'), null);
            }
        }
    },

    sq_shuffle: {
        // Retrieve the current volume level of the specified Squeezebox.
        get: function (device_data, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities shuffle get for device:', device_data.id);
            var device = devices[device_data.id];

            if (device.online == true) {

                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {
                        mySqueezeServer.players[device.id].getPlaylistShuffle(function (reply) {
                            if (reply.ok) {
                                switch (reply.result) {
                                    case 0:
                                        Homey.log('Shuffle off');
                                        callback(null, "sq_shuffle_off");
                                        break;
                                    case 1:
                                        Homey.log('Shuffle song');
                                        callback(null, "sq_shuffle_song");
                                        break;
                                    case 2:
                                        Homey.log('Shuffle albums');
                                        callback(null, "sq_shuffle_albums");
                                        break;
                                    default:
                                        Homey.log('Current shuffle isn\'t either off, song or album!');
                                        callback(reply, null);
                                }
                            } else {
                                Homey.log('reply not ok', reply);
                                callback(reply, null);
                            }
                        });
                    } else {
                        Homey.log("Unable to get the status for device", device.id);
                        setDeviceAvailable(device_data, false);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device is offline');
            }

        },

        // Set the volume level of the specified Squeezebox.
        set: function (device_data, action, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities shuffle set for device', device_data.id, 'to', action);

            var device = devices[device_data.id];

            if (device.online == true) {

                switch (action) {
                    case 'sq_shuffle_song':
                        action = 'song';
                        break;

                    case 'sq_shuffle_albums':
                        action = 'albums';
                        break;

                    case 'sq_shuffle_off':
                        action = 'off';
                        break;
                }

                var url = device.protocol + device.server;

                var SqueezeServer = require('squeezenode');
                var mySqueezeServer = new SqueezeServer(url, device.port);

                // Set the volume level of the specified Squeezebox.
                mySqueezeServer.on('register', function () {
                    if (hasValue(mySqueezeServer.players[device.id])) {     // Squeezebox module doesn't report if device is offline but crashes
                        mySqueezeServer.players[device_data.id].setPlaylistShuffle(action, function (reply) {
                            if (reply.ok) {
                                callback(null, true);
                            } else callback(reply, null);
                        });
                    } else {
                        setDeviceAvailable(device_data, false);
                        Homey.log("Unable to set the status for device", device.id);
                        callback(__('app.msg_unableGetStatus'),null);
                    }
                });
            } else {
                Homey.log('device', device_data.id, 'is offline');
                callback(__('app.msg_deviceOffline'), null);
            }
        }
    }
};

/**
 * Initializes received device with settings, already stored in Homey
 * @param device_data   Device to initialize
 */
function initDevice(device_data) {
    Homey.log("initDevice for device", device_data.id);

    module.exports.getSettings( device_data, function( err, settings ) {
        if (err) Homey.log("Error retrieving device settings for device", device_data.id);
        else buildDevice(device_data, settings);
    });

    function buildDevice (device_data, settings) {
        devices[device_data.id] = {
            id                      : device_data.id,
            homey_name              : settings.homey_name,
            player_name             : settings.player_name,
            online                  : settings.online,
            protocol                : settings.protocol,
            server                  : settings.server,
            port                    : settings.port,
            mac                     : settings.mac,
            player_ip				: settings.player_ip,
            signalstrength			: settings.signalstrength,
            remote					: settings.remote,
            digital_volume_control	: settings.digital_volume_control
        };

        checkDeviceIsAvailable(device_data);

        //TODO add more places for device availability
        Homey.log("initDevice done for device", device_data.id);
    }

}   //end of initDevice

/**
 * Validates the connection with the server
 * @param server_data   Server to check
 * @param callback      Callback with result. Function(err, result)
 */
function validateConnection(server_data, callback) {  // Validate Smile connection data
    Homey.log('Validating server', server_data);

    // prepare for http and https users setting (not available in GUI, yet)
    var url = server_data.protocol + server_data.address;

    if (!checkServerData(server_data)) {
        callback(__('pair.msg_invalidAddressData'), null);
        return;
    }

    var SqueezeServer = require('squeezenode');
    var mySqueezeServer = new SqueezeServer(
        url,
        server_data.port
    );

    // TODO better detect errors
    try {
        mySqueezeServer.on('register', function() {
            callback(null, 'success');
        });
    } catch (error) {
        callback(error, null);
    }
}

/**
 * Lists all players on the server
 * @param server_data   Server to check for players
 * @param callback      Callback with player data. Function(err, devices){}
 */
function listPlayers(server_data, callback) {  // Validate Smile connection data
    Homey.log('List players on server', server_data);

    // prepare for http and https users setting (not available in GUI, yet)
    var url = server_data.protocol + server_data.address;

    if (!checkServerData(server_data)) {
        callback(__('pair.msg_invalidAddressData'), null);
        return;
    }

    var SqueezeServer = require('squeezenode');
    var mySqueezeServer = new SqueezeServer(
        url,
        server_data.port
    );

    // TODO better detect errors
    try {
        // Retrieve players from the Logitech Media Server.
        // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
        mySqueezeServer.getPlayers(function (reply) {

            if (reply.ok == true) {
                var devices = [];

                for (var id in reply.result) {
                    devices.push({
                        name: reply.result[id].name,
                        data: {
                            id: reply.result[id].playerid
                        }
                    });
                }

                Homey.log('Found players: ', devices);
                // TODO: Detect failures.
                // Send the discovered devices back to the front end.
                if(typeof callback == 'function') {
                    callback(false, devices);
                } else throw new Error('No valid callback in list players method');
            } else {
                if(typeof callback == 'function') {
                    callback(reply, null);
                } else throw new Error('No valid callback in list players method');
            }
        });

        // TODO: This functionality for finding more devices is demonstrated in the documentation - investigate.
        //setTimeout(function(){
        //    socket.emit('list_devices', moreDevices)
        //}, 2000)
    } catch (error) {
        callback(error, null);
    }
}

/**
 * Checks if the device is available on the server. If not then it sets the device as offline in the server
 * @param device_data   Device to check
 */
function checkDeviceIsAvailable(device_data) {

    Homey.log('Check if device', device_data.id, 'is available on server');

    isDeviceAvailableOnServer(device_data, function (error, available) {

        if (!error) {

            if (!available) setDeviceAvailable(device_data, false);
            else setDeviceAvailable(device_data, true);

        } else Homey.log('Unable to check for device', device_data.id, 'availability', error);
    });
}

/**
 * Checks if the device is available on the server
 * @param device_data   Device to check
 * @param callback      Callback with data. Function(err, isAvailable)
 */
function isDeviceAvailableOnServer(device_data, callback) {

    var device = devices[device_data.id];
    var url = device.protocol + device.server;

    var SqueezeServer = require('squeezenode');
    var mySqueezeServer = new SqueezeServer(url, device.port);

    mySqueezeServer.on('register', function () {
        if (hasValue(mySqueezeServer.players[device.id])) {
            mySqueezeServer.players[device.id].getStatus(function (reply) {

                if (reply.ok == true) {
                    if (reply.result.player_connected == 1) callback(null, true); else callback(null, false);
                } else callback(reply, null);

            });
        } else callback(null, false);
    });
}

/**
 * Set's the device offline or available for Homey.
 * If offline will start polling the server periodically if the device becomes available again
 * @param device_data Homey device_data object
 * @param available Set to true if available, false otherwise
 */
function setDeviceAvailable(device_data, available) {

    module.exports.setSettings( device_data, { online: available }, function( err, settings ){
        // Change device settings in Homey
        if (err) Homey.log('Error while saving settings for device', device_data.id);
    });

    devices[device_data.id].online = available;          // Change it's status in device since Homey doesn't keep track

    if (available == true) {
        module.exports.setAvailable(device_data);
        Homey.log('Device', device_data.id, 'is available');
    }    // Notify Homey device is online
    else if (available == false) {
        Homey.log('Device', device_data.id, 'not unavailable');
        module.exports.setUnavailable(device_data, "Offline");          // Notify Homey device is offline
        Homey.log('Schedule check for availability on server for device', device_data.id);
        pollServerForDeviceAvailability(devices[device_data.id]);       // Schedule server polling for this device
    }
}

/**
 * Polls the server periodically if the device is becomes available again
 * @param device to check for on the server
 */
function pollServerForDeviceAvailability(device) {

    if (!contains(intervals, device.id)) {
        //noinspection PointlessArithmeticExpressionJS
        var updateTime = 1 * 60 * 1000;     // Every 1 minute

        //noinspection UnnecessaryLocalVariableJS
        var interval = setInterval(trigger_update.bind(this, device), updateTime);

        // Add device to array of devices to poll
        intervals[device.id] = interval;
    } else Homey.log('Already checking for this device.');

    function trigger_update(device) {

        isDeviceAvailableOnServer(device, function (err, isAvailable) {
            if(err) {
                Homey.log('trigger update - is available on server - error', err);
            } else if(isAvailable) {
                Homey.log('Device', device.id, 'is available on server, clearing interval');
                clearInterval(intervals[device.id]);
                delete intervals[device.id];
                setDeviceAvailable({'id': device.id}, true);       // Mimic a device_data object or else Homey doesn't change device online/offline status
            } else if(!isAvailable) Homey.log('Device', device.id, 'still not available on server');
        });
    }
}