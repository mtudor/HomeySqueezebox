"use strict";

const Homey = require('homey');
const SqueezeServer = require('squeezenode');
const util = require('/lib/util.js');
const moment = require('moment');
const maxPlaylistCacheAge = 5; // In minutes

class SqueezeboxApp extends Homey.App {

    onInit() {

      var playlistsCache = [];
      var playlistTime = moment();

      this.log('Squeezebox player for Homey started...');

      this.playPlaylist = new Homey.FlowCardAction('playPlaylist');
      this.playPlaylist
        .register()
        .registerRunListener((args, state) => {
          this.log('playPlaylist triggered');

          const protocol = args.device.getSetting('protocol');
          const server = args.device.getSetting('server');
          const port = args.device.getSetting('port');
          const id = args.device.getSetting('id');
          const playlistId = args.playlist.id;

          this._playPlaylist(protocol, server, port, id, playlistId)
            .then(reply => {
              console.log(reply);
              return Promise.resolve(true);
            })
            .catch(e => {
              console.log(e);
              return Promise.reject(e);
            });
        })
        .getArgument('playlist')
        .registerAutocompleteListener((query, args) => {
          this.log('AutocompleteListener playPlaylist triggered');
          const protocol = args.device.getSetting('protocol');
          const server = args.device.getSetting('server');
          const port = args.device.getSetting('port');

          var cacheAge = moment.duration(moment().diff(playlistTime));

          this.log('cache age', cacheAge.as('minutes'));

          if (playlistsCache.length > 0 && cacheAge.as('minutes') <= maxPlaylistCacheAge) {
            this.log('Using playlist cache');

            var results = playlistsCache.filter( result => {
              return result.name.toLowerCase().indexOf( query.toLowerCase() ) > -1;
            });

            this.log('filtered', results);
            return Promise.resolve(results);
          } else {
            this.log('Playlist cache empty or old, fetching new');
            this._getPlaylists(protocol, server, port)
              .then(playlists => {
                this.log('Playlist received, sending to Homey');
                playlistsCache = playlists;
                playlistTime = moment();
                return Promise.resolve(playlists);
              })
              .catch(e => {
                return Promise.reject(Homey.__("msg_deviceOffline", {"errorMsg": e}));
              });
          };

        });
    }

    _getPlaylists(protocol, server, port) {

      const url = protocol + server;
      const mySqueezeServer = new SqueezeServer(url, port);

      var playlists = [];

      return new Promise(function(resolve, reject){
        mySqueezeServer.register()
          .then(() => {

            mySqueezeServer.playlists()
              .then((reply) => {

                if (reply.count > 0) {
                  playlists = reply.playlists.map(function (item) {
                      return {
                          id: item.id,
                          name: item.playlist
                      };
                  });
                  resolve(playlists);

                } else {
                  this.log('No playlists on server');
                  reject(Homey.__("msg_noPlaylistsOnServer"));
                }

              })
              .catch(e => {
                reject(Homey.__("msg_deviceOffline", {"errorMsg": e}));
              });
          })
          .catch(e => {
            reject(Homey.__("msg_deviceOffline", {"errorMsg": e}));
          });
      });

    }

    _playPlaylist(protocol, server, port, id, playlistId) {

      console.log('Playing playlist', playlistId);

      const url = protocol + server;
      const mySqueezeServer = new SqueezeServer(url, port);

      return new Promise(function(resolve, reject){
        mySqueezeServer.register()
          .then(() => {

            return new Promise(function(resolve, reject){
              mySqueezeServer.players[id].loadPlaylist(playlistId)
                .then(reply => {
                  console.log(reply);
                  resolve(reply);
                })
                .catch(e => {
                  console.log(e);
                  //TODO reject not working
                  //reject(Homey.__("msg_unableToPlayPlaylist"));
                });
            });

          })
          .catch(e => {
            reject(e);
          });
      });

    }

};

module.exports = SqueezeboxApp;
