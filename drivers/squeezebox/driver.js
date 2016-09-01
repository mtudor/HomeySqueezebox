"use strict";

var devices = {};
var defaultTimout = 3000;

function hasValue(string) {
    if (typeof string != 'undefined' && string != null) return true;
    else return false;
}

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

module.exports.init = function(devices_data, callback) {
    Homey.log("init in driver.js started");
    devices_data.forEach(initDevice);

    Homey.manager('flow').on('action.off', function (callback, args) {
        Homey.log('flow action off');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.onoff.set(
            args.device,
            false,
            function (err, success) {
                // Notify Homey of success of failure, respectively.
                if (typeof callback == 'function') {
                    callback(null, !err && success);
                }
            }
        );
    });

    Homey.manager('flow').on('action.on', function (callback, args) {
        Homey.log('flow action on');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.onoff.set(
            args.device,
            true,
            function (err, success) {
                // Notify Homey of success of failure, respectively.
                if (typeof callback == 'function') {
                    callback(null, !err && success);
                }
            }
        );
    });

    Homey.manager('flow').on('action.play', function (callback, args) {
        Homey.log('flow action play');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.play_stop.set(
            args.device,
            true,
            function (err, success) {
                // Notify Homey of success of failure, respectively.
                if (typeof callback == 'function') {
                    callback(null, !err && success);
                };
            }
        );
    });

    Homey.manager('flow').on('action.pause', function (callback, args) {
        Homey.log('flow action pause');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.play_stop.set(
            args.device,
            false,
            function (err, success) {
                // Notify Homey of success of failure, respectively.
                if (typeof callback == 'function') {
                    callback(null, !err && success);
                };
            }
        );
    });

    Homey.manager('flow').on('action.volume', function (callback, args) {
        Homey.log('flow action volume');
        Homey.manager('drivers').getDriver('squeezebox').capabilities.volume_set.set(
            args.device,
            args.volume/100,
            function (err, success) {
                if (typeof callback == 'function') {
                    callback(null, !err && success);
                }
            }
        );
    });

    Homey.manager('flow').on('action.playPlaylist', function (callback, args) {
        Homey.log('flow action play playlist');
        var device = devices[args.device.id];
        var url = device.protocol + device.server;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device.port);

        mySqueezeServer.on('register', function () {
            mySqueezeServer.request(
                device.id,
                ["playlistcontrol", "cmd:load", "playlist_id:" + args.playlist.id],
                function (reply) {
                    if (reply.ok == true) {
                        if (reply.result.count > 0) {
                            callback(null, true);
                        } else {
                            callback(__('app.msg_playlistNotFoundOnServer', {"playlistName" : args.playlist.name, "serverName" : device.server} ), false);
                        }
                    } else {
                        if (typeof callback == 'function') {
                            callback(reply.result, false);
                        }
                    }
                }
            );
        });
    });

    Homey.manager('flow').on('action.playPlaylist.playlist.autocomplete', function (callback, args) {
        var device = devices[args.device.id];
        var url = device.protocol + device.server;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device.port);

        mySqueezeServer.on('register', function () {
            var searchParams = ["playlists", 0, 10];
            if (args.query != '') {
                searchParams.push('search:' + args.query);
            }

            mySqueezeServer.request(
                args.device.id,
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
        var device = devices[args.device.id];
        var url = device.protocol + device.server;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device.port);

        mySqueezeServer.on('register', function () {
            mySqueezeServer.players[args.device.id].next(function (reply) {
                if (!reply.ok) callback(reply, false);
                else callback(null, true);
            });
        });
    });

    Homey.manager('flow').on('action.previous', function (callback, args) {
        Homey.log('flow action previous');
        var device = devices[args.device.id];
        var url = device.protocol + device.server;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device.port);

        mySqueezeServer.on('register', function () {
            mySqueezeServer.players[args.device.id].previous(function (reply) {
                if (!reply.ok) callback(reply, false);
                else callback(null, true);
            });
        });
    });

    Homey.manager('flow').on('action.seek', function (callback, args) {
        Homey.log('flow action seek');
        var device = devices[args.device.id];
        var url = device.protocol + device.server;

        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(url, device.port);

        mySqueezeServer.on('register', function () {
            mySqueezeServer.players[args.device.id].seek(args.second, function (reply) {
                if (!reply.ok) callback(reply, false);
                else callback(null, true);
            });
        });
    });
};

module.exports.pair = function (socket) {

    // Validate server connection data
    socket.on('validate', function (server_data, callback) {

        validateConnection(server_data, function(error, result) {
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

        listPlayers(server_data, function(error, reply) {

            if (!error) {
                Homey.log('Successfully retreived servers players');
                callback(null, reply);
            } else {
                Homey.log('Error while getting server players');
                callback(reply, null);
            }
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

module.exports.added = function( device_data, callback ) {
    Homey.log("initializing device: ", device_data);
    initDevice( device_data );
    callback( null, true );
};

module.exports.deleted = function(device_data, callback) {
    Homey.log('Deleting device with ID: ' + device_data.id);
    delete devices[device_data.id];
    callback(null, true);
};

module.exports.renamed = function( device_data, new_name ) {
    Homey.log(devices[device_data.id].homey_name + ' has been renamed to ' + new_name);
    devices[device_data.id].homey_name = new_name;
//    Homey.log(devices[device_data.id].name);
};

module.exports.capabilities = {

    onoff: {
        // Retrieve whether the specified Squeezebox is currently on or off.
        get: function( device_data, callback ) {
            Homey.log('capabilities onoff get for device:', device_data.id);

            var device = devices[device_data.id];
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            mySqueezeServer.on('register', function () {
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
                        callback(true, null);
                    }
                });
            });
        },

        set: function( device_data, turnon, callback ) {
            Homey.log('capabilities onoff set for device:', device_data.id);

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var device = devices[device_data.id];
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            // TODO: Detect failures. Is there a way to send the new play state to Homey.
            // Turn the specified squeezebox on or off.
            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device_data.id].power(turnon, function (reply) {
                    if(reply.ok) callback(null, true);
                    else callback(null, false);
                });
            });
        }
    },

    volume_set: {
        // Retrieve the current volume level of the specified Squeezebox.
        get: function (device_data, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities volume get for device:', device_data.id);

            var device = devices[device_data.id];
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            // Get the volume level of the specified SqueezePlayer.
            var volume;
            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device_data.id].getVolume(function (reply) {
                    if (reply.ok) {
                        var volume = parseFloat(reply.result);
                        volume = volume/100;                    // Homey range is between 0 and 1
                        Homey.log('volume is', volume);
                        callback(null, volume);
                    } else {
                        callback(true, null);
                    }
                });
            });
        },

        // Set the volume level of the specified Squeezebox.
        set: function (device_data, volume, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities volume set for device:', device_data.id, 'to', volume);

            var device = devices[device_data.id];
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            // Set the volume level of the specified Squeezebox.
            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device_data.id].setVolume(volume*100);

                // TODO: Detect failures. Is there a way to return the new volume level and if so should volume level be
                // read from the Squeezebox, rather than just parroted back?
                if (typeof callback == 'function') {
                    callback(null, true);
                }
            });
        }
    },

    play_stop: {
        // Retrieve whether the specified Squeezebox is currently playing.
        get: function (device_data, callback) {
            // TODO: Support retrieving whether a Squeezebox is currently playing. device_data is the object saved
            // during pairing and callback should return the state in the format callback(err, value).
            Homey.log('capabilities play_stop get for device:', device_data.id);

            var device = devices[device_data.id];
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device.id].getStatus(function (reply) {
                    if (reply.ok) {
                        Homey.log(reply);
                    } else {
                        callback(true, reply);
                    }
                });
            });
        },

        // Start the specified Squeezebox playing whatever is currently in its playlist.
        set: function (device_data, play, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            Homey.log('capabilities play_stop set for device:', device_data.id);

            var device = devices[device_data.id];
            var url = device.protocol + device.server;

            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(url, device.port);

            // TODO: Detect failures. Is there a way to send the new play state to Homey.
            // Start playing on the specified squeezebox.
            mySqueezeServer.on('register', function () {

                if (play) {
                    Homey.log('Start playing for device:', device_data.id);
                    mySqueezeServer.players[device_data.id].play(function (reply) {
                        if (reply.ok) callback(null, true);
                        else callback(true, reply);             // send reply because of error
                    });
                } else {
                    Homey.log('Pause playing for device:', device_data.id);
                    mySqueezeServer.players[device_data.id].pause(function (reply) {
                        if (reply.ok) callback(null, true);
                        else callback(true, reply);             // send reply because of error
                    });
                    callback(null, true);
                }
            });
        }
    }
};

function initDevice(device_data) {

    Homey.log("");
    Homey.log("initDevice for device: ", device_data);

    //initDevice: retrieve device settings, buildDevice and start polling it
    module.exports.getSettings( device_data, function( err, settings ) {
        if (err) {
            Homey.log("Error retrieving device settings");
        } else {    // after settings received build the new device object
            buildDevice(device_data, settings);
        }
    });

    function buildDevice (device_data, settings) {
        devices[device_data.id] = {
            id              : device_data.id,
            homey_name      : settings.homey_name,
            player_name     : settings.player_name,
            protocol        : settings.protocol,
            server          : settings.server,
            port            : settings.port,
            mac             : settings.mac
        };
    }
    Homey.log("initDevice done for device");

}   //end of initDevice

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
        callback(true, error);
    }
};

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
                            id: reply.result[id].playerid,
                        }
                    });
                }

                Homey.log('Found players: ', devices);
                // TODO: Detect failures.
                // Send the discovered devices back to the front end.
                if(typeof callback == 'function') {
                    callback(false, devices);
                }
            } else {
                if(typeof callback == 'function') {
                    callback(true, reply);
                }
            }
        });

        // TODO: This functionality for finding more devices is demonstrated in the documentation - investigate.
        //setTimeout(function(){
        //    socket.emit('list_devices', moreDevices)
        //}, 2000)
    } catch (error) {
        callback(true, error);
    }
};