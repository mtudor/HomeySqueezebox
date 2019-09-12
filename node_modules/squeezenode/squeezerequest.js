var Promise = require('bluebird'),
    jayson = require('jayson'),
    _ = require('lodash'),
    PlayerMode = require('./constants').PlayerMode;

function SqueezeRequest(address, port, username, password) {
    var jsonrpc, client,
        self = this;

    self.address = (address !== undefined) ? address : 'localhost';
    self.port = (port !== undefined) ? port : 9000;
    self.username = username;
    self.password = password;
    self.defaultPlayer = '00:00:00:00:00:00';

    jsonrpc = self.address + ':' + self.port + '/jsonrpc.js';
    client = jayson.client.http(jsonrpc);
    client.options.version = 1;

    // Function to format the header for basic authentication.
    self.formatBasicHeader = function (username, password) {
        var tok = username + ':' + password;
        var hash = new Buffer(tok).toString('base64');
        return 'Basic ' + hash;
    };

    // Add a header for basic authentication if a username and password are given
    if (username && password) {
        if (!client.options.headers) {
            client.options.headers = {};
        }
        client.options.headers['Authorization'] = self.formatBasicHeader(username, password);
    }

    /**
     * get the parameters for a player mode
     * @param mode {String} player mode of type PlayerMode
     * @return {Array}
     */
    self.playerModeToParams = function (mode) {
        var params = [],
            pmode = _.findKey(PlayerMode, function (value) {
                return _.toLower(value) === _.toLower(mode);
            });

        if (_.includes([PlayerMode.PAUSE, PlayerMode.RESUME], pmode)) {
            params.push('pause');
        } else if (_.includes([PlayerMode.PLAY, PlayerMode.CONTINUE, PlayerMode.KEEP_GOING], pmode)) {
            params.push('play');
        } else if (_.includes([PlayerMode.MUTE, PlayerMode.UNMUTE], pmode)) {
            params = _.union(params, ['mixer', 'muting']);
        } else if (_.includes([PlayerMode.REPEAT, PlayerMode.REPEAT_ON, PlayerMode.REPEAT_OFF], pmode)) {
            params = _.union(params, ['playlist', 'repeat']);
        } else if (_.includes([PlayerMode.SHUFFLE, PlayerMode.SHUFFLE_ON, PlayerMode.SHUFFLE_OFF,
                PlayerMode.TURN_ON_SHUFFLE, PlayerMode.TURN_OFF_SHUFFLE, PlayerMode.STOP_SHUFFLING,
                PlayerMode.SHUFFLE_THE_MUSIC], pmode)) {
            params = _.union(params, ['playlist', 'shuffle']);
        } else if (_.includes([PlayerMode.STOP], pmode)) {
            params.push('stop');
        }
        return params;
    };

    /**
     * Get song info by track id or path to file
     * @param trackIdOrUrl {String|Number} the song to get information for
     * if trackId then it should be a number to a specific track
     * if Url it should be a path with the file:// protocol
     * @return {*} song information
     */
    self.songInfo = function (trackIdOrUrl) {
        return Promise.try(function () {
            var params = ['songinfo', 0, 100, 'tags:aAsSelgGpPcdtyuJ'];

            if (_.isNil(trackIdOrUrl)) {
                throw new TypeError('trackIdOrUrl');
            } else if (_.indexOf(trackIdOrUrl, 'file://') !== -1) {
                params.push('url:' + trackIdOrUrl);
            } else {
                params.push('track_id:' + trackIdOrUrl);
            }

            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.forEach(reply.result.songinfo_loop, function (value) {
                            _.assign(response, value);
                        });
                        response.exists = !(_.keys(response).length <= 4 && (!_.has(response, 'title') || _.isNil(response.title)))
                    }
                    return response;
                });
        });
    };

    self.throwError = function(payload) {
        var message;
        if (_.isPlainObject(payload)) {
            message = JSON.stringify(payload);
        } else {
            message = payload;
        }
        throw new Error(message);
    };

    self.request = function (player, params) {
        var finalParams = [],
            call = Promise.promisify(client.request, {context: client});

        finalParams.push(player);
        finalParams.push(params);
        return call('slim.request', finalParams);
    };
}

module.exports = SqueezeRequest;
