/*
 The MIT License (MIT)

 Copyright (c) 2013-2015 Piotr Raczynski, pio[dot]raczynski[at]gmail[dot]com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the 'Software'), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

var inherits = require('super'),
    SqueezeApp = require('./squeezeapp'),
    request = require('request'),
    Promise = require('bluebird'),
    util = require('util');

function Spotify(defPlayerId, name, cmd, address, port) {
    var helperAddress,
        self = this;

    Spotify.super_.apply(self, arguments);

    self.helperPort = 9005;
    helperAddress = self.address + ':' + self.helperPort + '/';

    function helperRequest(path, params) {
        return new Promise(function (resolve, reject) {
            var res = { ok: false };
            request({ url: helperAddress + path + '?' + params }, function (error, response, body) {
                if (error || (response.statusCode >= 400 && response.statusCode <= 500)) {
                    reject();
                } else {
                    res.ok = true;
                    res.result = JSON.parse(body);
                    resolve(res)
                }
            });
        });

    }

    function searchGeneric(searchParams) {
        return helperRequest('search.json', searchParams);
    }

    self.searchTracks = function (query, offset, len) {
        return searchGeneric(util.format('o=%d&trq=%d&q=%s', offset, len, query));
    };

    self.searchAlbums = function (query, offset, len) {
        return searchGeneric(util.format('o=%d&alq=%d&q=%s', offset, len, query));
    };

    self.searchArtists = function (query, offset, len) {
        return searchGeneric(util.format('o=%d&arq=%d&q=%s', offset, len, query));
    };

    self.searchAll = function (query, offset, len) {
        return searchGeneric(util.format('o=%d&trq=%d&alq=%d&arq=%d&q=%s', offset, len, len, len, query));
    };

    self.getItemId = function (itemId) {
        return self.request(self.defPlayerId, ['spotify', 'items', 0, 100, 'item_id:' + itemId]);
    };

    self.getItemIdDetails = function (itemId) {
        return self.request(self.defPlayerId, ['spotify', 'items', 0, 100, 'menu:1', 'item_id:' + itemId]);
    };

    self.addToPlaylist = function (itemURI, playerId) {
        return self.request(playerId, ['spotifyplcmd', 'cmd:add', 'uri:' + itemURI]);
    };

    self.loadToPlaylist = function (itemURI, playerId) {
        return self.request(playerId, ['spotifyplcmd', 'cmd:load', 'uri:' + itemURI]);
    };
}

inherits(Spotify, SqueezeApp);

module.exports = Spotify;