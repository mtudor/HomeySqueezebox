"use strict";

module.exports.init = function (devices_data, callback) {
    // Driver has started after a reboot. Initialise previously paired devices.
    //devices_data.forEach(function (device_data) {
        // Currently no reinitialisation is required for Squeezeboxes. This is left here as a placeholder.
    //});

    // Notify Homey that the driver is ready.
    callback();
};

module.exports.pair = function (socket) {
    // socket is a direct channel to the front-end.

    // TODO: Add a friendly start page?

    // This function is called when Homey.emit('list_devices') is executed on the front-end, which happens in the
    // `list_devices` built-in template.
    socket.on('list_devices', function (data, callback) {
        // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(
            Homey.manager('settings').get('serverAddress'),
            Homey.manager('settings').get('serverPort')
        );

        // Retrieve players from the Logitech Media Server.
        mySqueezeServer.getPlayers(function (reply) {
            var devices = [];
            for (var id in reply.result) {
                devices.push({
                    name: reply.result[id].name,
                    data: {
                        id: reply.result[id].playerid,
                    }
                });
            }
            // TODO: Detect failures.
            // Send the discovered devices to Homey.
            if(typeof callback == 'function') {
                callback(null, devices);
            }
        });

        // TODO: This functionality for finding more devices is demonstrated in the documentation - investigate.
        //setTimeout(function(){
        //    socket.emit('list_devices', moreDevices)
        //}, 2000)
    });
};

module.exports.capabilities = {
    play: {
        // Retrieve whether the specified Squeezebox is currently playing.
        get: function (device_data, callback) {
            // TODO: Support retrieving whether a Squeezebox is currently playing. device_data is the object saved
            // during pairing and callback should return the state in the format callback(err, value).
        },

        // Start the specified Squeezebox playing whatever is currently in its playlist.
        set: function (device_data, value, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Start the specified squeezebox playing.
            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device_data.id].play();
            });

            // TODO: Detect failures. Is there a way to send the new play state to Homey.
            if(typeof callback == 'function') {
                callback(null, true);
            }
        }
    },

    pause: {
        // Retrieve whether the specified Squeezebox is currently paused.
        get: function (device_data, callback) {
            // TODO: Support retrieving whether a Squeezebox is currently playing. device_data is the object saved
            // during pairing and callback should return the state in the format callback(err, value).
        },

        // TODO: Currently pausing a paused Squeezebox will start it playing again. Is this what we want?
        // Pause the specified Squeezebox.
        set: function (device_data, value, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Pause the specified Squeezebox.
            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device_data.id].pause();
            });

            // TODO: Detect failures. Is there a way to send the new pause state to Homey.
            if(typeof callback == 'function') {
                callback(null, true);
            }
        }
    },

    volume: {
        // Retrieve the current volume level of the specified Squeezebox.
        get: function (device_data, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Get the volume level of the specified Squeezebox.
            var volume;
            mySqueezeServer.on('register', function () {
                volume = mySqueezeServer.players[device_data.id].getVolume();
            });

            // TODO: Detect failures.
            // Send the volume level to Homey.
            if(typeof callback == 'function') {
                callback(null, volume);
            }
        },

        // Set the volume level of the specified Squeezebox.
        set: function (device_data, value, callback) {
            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Set the volume level of the specified Squeezebox.
            mySqueezeServer.on('register', function () {
                mySqueezeServer.players[device_data.id].setVolume(value);
            });

            // TODO: Detect failures. Is there a way to return the new volume level and if so should volume level be
            // read from the Squeezebox, rather than just parroted back?
            if(typeof callback == 'function') {
                callback(null, true);
            }
        }
    }
};
