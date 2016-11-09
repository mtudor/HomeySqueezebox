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
    onoff: {
        get: function (device_data, callback) {
            Homey.log('capabilities/onoff/get [device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/onoff/get unavailable [device:', device_data.id + ']');
                        return;
                    }

                    mySqueezeServer.players[device_data.id].getStatus(function (reply) {
                        if (reply.ok) {
                            Homey.log(
                                'capabilities/onoff/get state:',
                                (reply.result.power === 1 ? 'on' : 'off'),
                                '[device:', device_data.id + ']'
                            );
                            callback(null, reply.result.power === 1);
                        } else {
                            Homey.log('capabilities/onoff/get error', reply);
                            callback(reply, null);
                        }
                    });
                }
            );
        },

        set: function (device_data, power, callback) {
            Homey.log('capabilities/onoff/set', '[device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/onoff/set unavailable [device:', device_data.id + ']');
                        return;
                    }

                    mySqueezeServer.players[device_data.id].power(
                        power,
                        function (reply) {
                            if (reply.ok) {
                                Homey.log(
                                    'capabilities/onoff/set state:',
                                    (power ? 'on' : 'off'),
                                    '[device:', device_data.id + ']'
                                );
                                callback(null, power);
                            } else {
                                Homey.log('capabilities/onoff/set error', reply);
                                callback(reply, null);
                            }
                        }
                    );
                }
            );
        }
    },

    play: {
        get: function (device_data, callback) {
            Homey.log('capabilities/play/get', '[device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/play/get unavailable [device:', device_data.id + ']');
                        return;
                    }

                    mySqueezeServer.players[device_data.id].getStatus(function (reply) {
                        if (reply.ok) {
                            Homey.log(
                                'capabilities/play/get state', reply.result.mode, '[device:', device_data.id + ']'
                            );
                            callback(null, reply.result.mode === 'play');
                        } else {
                            Homey.log('capabilities/play/get error', reply);
                            callback(reply, null);
                        }
                    });
                }
            );
        },

        set: function (device_data, value, callback) {
            Homey.log('capabilities/play/set', '[device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Start the specified squeezebox playing.
            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/play/set unavailable [device:', device_data.id + ']');
                        return;
                    }

                    // If value is true then play, otherwise pause.
                    if (value === true) {
                        mySqueezeServer.players[device_data.id].play(function (reply) {
                            if (reply.ok) {
                                Homey.log('capabilities/play/set state:', value, '[device:', device_data.id + ']');
                                callback(null, value);
                            } else {
                                Homey.log('capabilities/play/set error', reply);
                                callback(reply, null);
                            }
                        });
                    } else {
                        Homey.manager('drivers').getDriver('squeezebox').capabilities.pause.set(
                            device_data,
                            true,
                            callback
                        );
                    }
                }
            );
        }
    },

    pause: {
        // Retrieve whether the specified Squeezebox is currently paused.
        get: function (device_data, callback) {
            Homey.log('capabilities/pause/get [device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/pause/get unavailable [device:', device_data.id + ']');
                        return;
                    }

                    mySqueezeServer.players[device_data.id].getStatus(function (reply) {
                        if (reply.ok) {
                            Homey.log(
                                'capabilities/pause/get state', reply.result.mode, '[device:', device_data.id + ']'
                            );
                            callback(null, reply.result.mode === 'pause');
                        } else {
                            Homey.log('capabilities/pause/get error', reply);
                            callback(reply, null);
                        }
                    });
                }
            );
        },

        set: function (device_data, noToggle, callback) {
            Homey.log('capabilities/pause/set' + (noToggle ? ' no toggle' : ''), '[device:', device_data.id + ']');

            // TODO: Logitech Media Server supports forced pause natively, but this is not yet supported in SqueezeNode.
            // If the Squeezebox is paused, sending pause again will start it playing. Prevent this if noToggle is true.
            // This Promise is resolved IF: noToggle=false OR (noToggle=true AND squeezebox is playing).
            var okToPause = new Promise(function (resolve, reject) {
                if (noToggle) {
                    Homey.manager('drivers').getDriver('squeezebox').capabilities.pause.get(
                        device_data,
                        function (err, paused)
                        {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(paused === false);
                            }
                        }
                    );
                } else {
                    resolve(true);
                }
            });

            okToPause.then(
                function (result) {
                    if (result === true) {
                        // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only?
                        var SqueezeServer = require('squeezenode');
                        var mySqueezeServer = new SqueezeServer(
                            Homey.manager('settings').get('serverAddress'),
                            Homey.manager('settings').get('serverPort')
                        );

                        mySqueezeServer.on(
                            'register',
                            function ()
                            {
                                // Is the squeezebox is available (it might be disconnected from the network or power).
                                if (!mySqueezeServer.players[device_data.id]) {
                                    Homey.log('capabilities/pause/set unavailable [device:', device_data.id + ']');
                                    return;
                                }

                                mySqueezeServer.players[device_data.id].pause(
                                    function (reply)
                                    {
                                        if (reply.ok) {
                                            Homey.log('capabilities/pause/set true [device:', device_data.id + ']');
                                            callback(null, true);
                                        } else {
                                            callback(reply, null);
                                        }
                                    }
                                );
                            }
                        );
                    } else {
                        // Nothing has been done, because the Squeezebox is already paused and noToggle was true.
                        callback(null, true);
                    }
                },
                function (err) {
                    callback(err, null);
                }
            );
        }
    },

    previous: {
        set: function (device_data, value, callback) {
            Homey.log('capabilities/previous/set', '[device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/previous/set unavailable [device:', device_data.id + ']');
                        return;
                    }

                    mySqueezeServer.players[device_data.id].previous(function (reply) {
                        if (reply.ok) {
                            Homey.log('capabilities/previous/set true [device:', device_data.id + ']');
                            callback(null, true);
                        } else {
                            callback(reply, null);
                        }
                    });
                }
            );
        }
    },

    next: {
        set: function (device_data, value, callback) {
            Homey.log('capabilities/next/set', '[device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                // TODO: Error handling if these are not entered / not correct.
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/next/set unavailable [device:', device_data.id + ']');
                        return;
                    }

                    mySqueezeServer.players[device_data.id].next(function (reply) {
                        if (reply.ok) {
                            Homey.log('capabilities/next/set true [device:', device_data.id + ']');
                            callback(null, true);
                        } else {
                            callback(reply, null);
                        }
                    });
                }
            );
        }
    },

    mediacontrol: {
        set: function (device_data, value, callback) {
            Homey.log('capabilities/mediacontrol/set', value, '[device:', device_data.id + ']');
            Homey.manager('drivers').getDriver('squeezebox').capabilities[value].set(device_data, null, callback);
        }
    },

    // TODO: Not really convinced "volume_set" is the right name, but alas this is what Homey dictates.
    volume_set: {
        // Retrieve the current volume level of the specified Squeezebox.
        get: function (device_data, callback) {
            Homey.log('capabilities/volume_set/get [device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Get the volume level of the specified Squeezebox.
            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/volume_set/get unavailable [device:', device_data.id + ']');
                        return;
                    }
                    mySqueezeServer.players[device_data.id].getVolume(function (reply) {
                        // Convert volume for Homey.
                        var value = reply.result / 100;

                        // TODO: Detect failures.
                        // Send the volume level to Homey.
                        if(typeof callback === 'function') {
                            Homey.log('capabilities/volume_set/get value', value, '[device:', device_data.id + ']');
                            callback(null, value);
                        }
                    });
                }
            );
        },

        // Set the volume level of the specified Squeezebox.
        set: function (device_data, value, callback) {
            Homey.log('capabilities/volume_set/set [device:', device_data.id + ']');

            // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
            var SqueezeServer = require('squeezenode');
            var mySqueezeServer = new SqueezeServer(
                Homey.manager('settings').get('serverAddress'),
                Homey.manager('settings').get('serverPort')
            );

            // Set the volume level of the specified Squeezebox.
            mySqueezeServer.on(
                'register',
                function () {
                    // Is the squeezebox is available (it might be disconnected from the network or power).
                    if (!mySqueezeServer.players[device_data.id]) {
                        Homey.log('capabilities/volume_set/set unavailable [device:', device_data.id + ']');
                        return;
                    }

                    // Convert volume for Squeezebox.
                    value = value * 100;

                    mySqueezeServer.players[device_data.id].setVolume(
                        value,
                        function (reply) {
                            if (reply.ok) {
                                Homey.log('capabilities/volume_set/set state:', value, '[device:', device_data.id + ']');
                                callback(null, value);
                            } else {
                                callback(reply, null);
                            }
                        }
                    );
                }
            );
        }
    }
};
