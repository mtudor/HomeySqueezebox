"use strict";

module.exports.init = function () {
    Homey.manager('flow').on('action.play', function (callback, args) {
        Homey.manager('drivers').getDriver('squeezebox').capabilities.play.set(
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
        Homey.manager('drivers').getDriver('squeezebox').capabilities.pause.set(
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

    Homey.manager('flow').on('action.volume', function (callback, args) {
        Homey.manager('drivers').getDriver('squeezebox').capabilities.volume.set(
            args.device,
            args.volume,
            function (err, success) {
                // Notify Homey of success of failure, respectively.
                if (typeof callback == 'function') {
                    callback(null, !err && success);
                };
            }
        );
    });

    Homey.manager('flow').on('action.playPlaylist', function (callback, args) {
        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(
            Homey.manager('settings').get('serverAddress'),
            Homey.manager('settings').get('serverPort')
        );

        mySqueezeServer.on('register', function () {
            mySqueezeServer.request(
                args.device.id,
                ["playlistcontrol", "cmd:load", "playlist_id:" + args.playlist.id],
                function (reply) {
                    // TODO: Detect failures.
                    if (typeof callback == 'function') {
                        callback(null, true);
                    }
                }
            );
        });
    });

    Homey.manager('flow').on('action.playPlaylist.playlist.autocomplete', function (callback, data) {
        var SqueezeServer = require('squeezenode');
        var mySqueezeServer = new SqueezeServer(
            Homey.manager('settings').get('serverAddress'),
            Homey.manager('settings').get('serverPort')
        );

        mySqueezeServer.on('register', function () {
            var searchParams = ["playlists", 0, 10];
            if (data.query != '') {
                searchParams.push('search:' + data.query);
            }

            mySqueezeServer.request(
                data.args.device.id,
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
};
