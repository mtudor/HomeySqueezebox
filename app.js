"use strict";

const Homey = require('homey');
const SqueezeServer = require('squeezenode');
const util = require('/lib/util.js');

class SqueezeboxApp extends Homey.App {

    onInit() {
      this.log('Squeezebox player for Homey started...');

      this.playPlaylist = new Homey.FlowCardAction('playPlaylist');
      this.playPlaylist
        .register()
        .registerRunListener((args, state) => {
          this.log('playPlaylist triggered');
          this.log(args);
          this.log(state);
          return Promise.resolve(true);
        })
        .getArgument('playlist')
        .registerAutocompleteListener((query, args) => {
          this.log('AutocompleteListener playPlaylist triggered');
          const protocol = args.device.getSetting('protocol');
          const server = args.device.getSetting('server');
          const port = args.device.getSetting('port');

          this._getPlaylists(protocol, server, port)
            .then(playlists => {
                console.log(playlists);
                return Promise.resolve(playlists);
            })
            .catch(e => {
              return Promise.reject(e);
            });
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
                  reject('No playlists on server');
                }

              })
              .catch(e => {
                this.log('Error while fetching server playlists', e);
                reject('Error while fetching server playlists', e);
              });
          })
          .catch(e => {
            this.log('Error while connecting to server', e);
            reject('Error while connecting to server', e);
          });
      });

    }

};

module.exports = SqueezeboxApp;
