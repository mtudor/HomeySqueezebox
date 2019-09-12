var inherits = require('super'),
    Promise = require('bluebird'),
    _ = require('lodash'),
    SqueezeRequest = require('./squeezerequest'),
    SqueezePlayer = require('./squeezeplayer');

function SqueezeServer(address, port, username, password) {
    var self = this;

    SqueezeServer.super_.apply(self, arguments);

    self.players = {};

    /**
     * get the count of players known to the server
     * Note: player must be powered on
     */
    self.getPlayerCount = function () {
        return self.request(self.defaultPlayer, ['player', 'count', '?']);
    };

    /**
     * get player id at index
     * @param index {Number} 0-N
     */
    self.getPlayerId = function (index) {
        return self.request(self.defaultPlayer, ['player', 'id', index, '?']);
    };

    /**
     * get player ip address given player id
     * @param playerId {String} the unique player id
     */
    self.getPlayerIp = function (playerId) {
        return self.request(self.defaultPlayer, ['player', 'ip', playerId, '?']);
    };

    /**
     * get player name given player id
     * @param playerId {String} the unique player id
     */
    self.getPlayerName = function (playerId) {
        return self.request(self.defaultPlayer, ['player', 'name', playerId, '?']);
    };

    self.getSyncGroups = function () {
        return self.request(self.defaultPlayer, ['syncgroups', '?']);
    };

    /**
     * get the list of players known to the server
     * Note: player must be powered on
     * @return {Promise.<*>}
     */
    self.getPlayers = function () {
        return self.request(self.defaultPlayer, ['players', 0, 1000]).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, players: reply.result.players_loop});
                }
                return response;
            });
    };

    self.totals = function () {
        return Promise.all([
            self.request(self.defaultPlayer, ['info', 'total', 'artists', '?']),
            self.request(self.defaultPlayer, ['info', 'total', 'albums', '?']),
            self.request(self.defaultPlayer, ['info', 'total', 'songs', '?']),
            self.request(self.defaultPlayer, ['info', 'total', 'genres', '?'])])
            .spread(function (artists, albums, songs, genres) {
                var response = {ok: artists.ok};
                response.artists = (artists.ok) ? artists.result._artists : 0;
                response.albums = (albums.ok) ? albums.result._albums : 0;
                response.songs = (songs.ok) ? songs.result._songs : 0;
                response.genres = (genres.ok) ? genres.result._genres : 0;
                return response;
            });
    };

    /**
     * Search for artists given artist name
     * Returns {id, artist}
     * @param artistName {String} search criteria or all artists if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.artists = function (artistName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
            t = !_.isFinite(take) && take >= 1 ? take : '-',
            params = ['artists', s, t];
        if (!_.isNil(artistName)) {
            params.push('search:' + artistName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, artists: reply.result.artists_loop});
                }
                return response;
            });
    };

    /**
     * Search for albums given album name
     * Returns {id, title, artist_id, artist_ids}
     * @param albumName {String} search criteria or all albums if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.albums = function (albumName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
            t = !_.isFinite(take) && take >= 1 ? take : '-',
            params = ['albums', s, t, 'tags:atySS'];
        if (!_.isNil(albumName)) {
            params.push('search:' + albumName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, albums: reply.result.albums_loop});
                }
                return response;
            });
    };

    /**
     * Search for tracks given tracks name
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param trackName {String} search criteria or all tracks if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracks = function (trackName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
            t = !_.isFinite(take) && take >= 1 ? take : '-',
            params = ['tracks', s, t, 'tags:aAeugGsSpP'];
        if (!_.isNil(trackName)) {
            params.push('search:' + trackName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                }
                return response;
            });
    };

    /**
     * Search for genres given genre name
     * Returns {id, genre}
     * @param genreName {String} search criteria or all genres if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.genres = function (genreName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : '_',
            t = !_.isFinite(take) && take >= 1 ? take : '_',
            params = ['genres', s, t];
        if (!_.isNil(genreName)) {
            params.push('search:' + genreName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, genres: reply.result.genres_loop});
                }
                return response;
            });
    };

    /**
     * Search for playlists given playlist name
     * Returns {id, playlist, url}
     * @param playlistName {String} search criteria or all playlists if null
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.playlists = function (playlistName, skip, take) {
        var s = !_.isFinite(skip) && skip >= 0 ? skip : 0,
            t = !_.isFinite(take) && take >= 1 ? take : 1000,
            params = ['playlists', s, t, 'tags:u'];
        if (!_.isNil(playlistName)) {
            params.push('search:' + playlistName);
        }
        return self.request(self.defaultPlayer, params).then(
            function (reply) {
                var response = {};
                if (reply && reply.result) {
                    _.assign(response, {count: reply.result.count, playlists: reply.result.playlists_loop});
                }
                return response;
            });
    };

    /**
     * Search for artist given artist id
     * Returns {id, title, artist_id, artist_ids}
     * @param artistId {String} the artist id
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.artistByArtistId = function (artistId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['artists', s, t, 'tags:'];
            if (_.isNil(artistId)) {
                throw new TypeError('artistId');
            }
            params.push('artist_id:' + artistId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, artist: reply.result.artists_loop[0]});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for albums given artist id
     * Returns {id, title, artist_id, artist_ids}
     * @param artistId {Number} only albums by this artist
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.albumsByArtistId = function (artistId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['albums', s, t, 'tags:atySS'];
            if (_.isNil(artistId)) {
                throw new TypeError('artistId');
            }
            params.push('artist_id:' + artistId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, albums: reply.result.albums_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for album given album id
     * Returns {id, title, artist_id, artist_ids}
     * @param albumId {String} the album id
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.albumByAlbumId = function (albumId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['albums', s, t, 'tags:atySS'];
            if (_.isNil(albumId)) {
                throw new TypeError('albumId');
            }
            params.push('album_id:' + albumId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, album: reply.result.albums_loop[0]});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for songs given album id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param albumId {Number} only songs on album
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracksByAlbumId = function (albumId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['tracks', s, t, 'tags:aAeugGsSpP'];
            if (_.isNil(albumId)) {
                throw new TypeError('albumId');
            }
            params.push('album_id:' + albumId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for songs given artist id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param artistId {Number} only songs by artist
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracksByArtistId = function (artistId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['tracks', s, t, 'tags:aAeugGsSpP'];
            if (_.isNil(artistId)) {
                throw new TypeError('artistId');
            }
            params.push('artist_id:' + artistId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for songs given genre id
     * Returns {id, title, artist_id, artist_ids, band_ids, composer_ids, album_id, url, genre_id}
     * @param genreId {Number} only songs in genre
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.tracksByGenreId = function (genreId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '-',
                t = !_.isFinite(take) && take >= 1 ? take : '-',
                params = ['tracks', s, t, 'tags:aAeugGsSpP'];
            if (_.isNil(genreId)) {
                throw new TypeError('genreId');
            }
            params.push('genre_id:' + genreId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, tracks: reply.result.titles_loop});
                    }
                    return response;
                });
        });
    };

    /**
     * Search for genre given genre id
     * Returns {id, genre}
     * @param genreId {String} the genre id
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {*}
     */
    self.genreByGenreId = function (genreId, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '_',
                t = !_.isFinite(take) && take >= 1 ? take : '_',
                params = ['genres', s, t];
            if (_.isNil(genreId)) {
                throw new TypeError('genreId');
            }
            params.push('genre_id:' + genreId);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {count: reply.result.count, genre: reply.result.genres_loop[0]});
                    }
                    return response;
                });
        });
    };

    /**
     * Search library for tracks, albums, artists
     * @param term {String} the search term
     * @param skip {Number} start at
     * @param take {Number} take this many
     * @return {Promise.<*>}
     */
    self.search = function (term, skip, take) {
        return Promise.try(function () {
            var s = !_.isFinite(skip) && skip >= 0 ? skip : '0',
                t = !_.isFinite(take) && take >= 1 ? take : '5',
                params = ['search', s, t, 'extended:1'];
            if (_.isNil(term)) {
                throw new TypeError('term');
            }
            params.push('term:' + term);
            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    var response = {};
                    if (reply && reply.result) {
                        _.assign(response, {
                            count: reply.result.count,
                            tracks: reply.result.tracks_loop,
                            albums: reply.result.albums_loop,
                            contributors: reply.result.contributors_loop
                        });
                    }
                    return response;
                });
        });
    };

    /**
     * Checks library to see if track exists
     * @param trackIdOrUrl {String} the track id or track url
     * @return {Promise.<Boolean>}
     */
    self.trackExists = function (trackIdOrUrl) {
        return Promise.try(function () {
            var params = [],
                isUrl = _.indexOf(trackIdOrUrl, 'file://') !== -1;
            if (_.isNil(trackIdOrUrl)) {
                throw new TypeError('trackIdOrUrl');
            } else if (isUrl) {
                params = params.concat(['songinfo', '0', '10', 'url:' + trackIdOrUrl]);
            } else {
                params = params.concat(['title', '-', '-', 'track_id:' + trackIdOrUrl]);
            }

            return self.request(self.defaultPlayer, params).then(
                function (reply) {
                    if (isUrl) {
                        return (reply && reply.result && _.keys(reply.result).length < 1 || _.isNil(reply.result.title));
                    } else {
                        return (reply && reply.result && reply.result.count > 0);
                    }
                });
        });
    };

    self.register = function () {
        self.players = {};

        function setPlayers(reply) {
            if (reply && reply.players) {
                reply.players.forEach(function (player) {
                    if (!self.players[player.playerid]) {
                        self.players[player.playerid] = new SqueezePlayer(player.playerid,
                            player.name, self.address, self.port, self.username, self.password);
                    }
                });
            } else {
                self.throwError(reply);
            }
        }

        return self.getPlayers().then(setPlayers);
    };
}

inherits(SqueezeServer, SqueezeRequest);

module.exports = SqueezeServer;
