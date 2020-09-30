'use strict';

const Homey = require('homey');
const SqueezeServer = require('squeezenode');
const fetch = require('node-fetch');
const util = require('/lib/util.js');

class SqueezeboxDevice extends Homey.Device {

  onInit() {

    this._albumArt_url = '';

    this.log('Device init');
    this.log('Name:', this.getName());

    this.setUnavailable(Homey.__('app.loading'));

    const settings = this.getSettings();

    this.log(settings);

    var interval = settings.polling || 3;
    interval = interval * 60 * 1000; // minutes
    this._pollDevice(interval);

    this.registerCapabilityListener('speaker_playing', (value, opts) => {

      var pause = (value) ? 0 : 1;

      this.log('registerCapabilityListener speaker_playing to ' + value + '(' + pause + ')');

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;
      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          mySqueezeServer.players[id].pause(pause);
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      return Promise.resolve();
    });

    this.registerCapabilityListener('volume_set', (value, opts) => {

      this.log('registerCapabilityListener volume_set to ' + value);

      const volume = value;
      if (volume < 0 || volume > 1) volume = 0.5;

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;
      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          mySqueezeServer.players[id].volume(volume * 100);
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      return Promise.resolve();
    });

    this.registerCapabilityListener('volume_mute', (value, opts) => {

      this.log('registerCapabilityListener volume_mute to ' + value);

      var mute = (value) ? 1 : 0;

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;
      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          mySqueezeServer.players[id].mute(mute);
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      return Promise.resolve();
    });

    this.registerCapabilityListener('speaker_prev', (value, opts) => {

      this.log('registerCapabilityListener speaker_prev called');

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          mySqueezeServer.players[id].previous();
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      //return Promise.resolve();
    });

    this.registerCapabilityListener('speaker_next', (value, opts) => {
      this.log('registerCapabilityListener speaker_next called');

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          mySqueezeServer.players[id].next();
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      return Promise.resolve();
    });

    this.registerCapabilityListener('speaker_shuffle', (value, opts) => {
      this.log('registerCapabilityListener speaker_shuffle called');

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          if (value) mySqueezeServer.players[id].mode('SHUFFLE', 1)
            .then(() => {
              console.log('then called inside shuffle');
            })
            .catch((e) => {
              console.log('Error while sending shuffle command', e);
            });
          else mySqueezeServer.players[id].mode('SHUFFLE', 0);
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      return Promise.resolve();
    });

    this.registerCapabilityListener('speaker_repeat', (value, opts) => {
      this.log('registerCapabilityListener speaker_repeat called');

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.register()
        .then(() => {
          if (value) mySqueezeServer.players[id].mode('REPEAT', 1)
            .then(() => {
              console.log('then called inside repeat');
            })
            .catch((e) => {
              console.log('Error while sending repeat command', e);
            });
          else mySqueezeServer.players[id].mode('REPEAT', 0);
          this._getDeviceData();
          return Promise.resolve();
        })
        .catch(e => {
            this.log(e);
            this.setUnavailable(Homey.__('Unreachable'));
            return Promise.reject(Homey.__('Unreachable'));
        });
      return Promise.resolve();
    });

    this._getDeviceData();
  }

  onDeleted() {

  }

  onSettings(oldSettingsObj, newSettingsObj, changedKeysArr, callback) {

    this.log(oldSettingsObj);
    this.log(newSettingsObj);
    this.log(changedKeysArr);

    // Check if stationid settings is changed
    if (changedKeysArr == 'polling') {
      this.log('Settings changed for polling from ' + oldSettingsObj.polling + ' to ' + newSettingsObj.polling);

      var interval = newSettingsObj.polling;

      // et up a new polling interval
      this._pollDevice(interval * 60 * 1000);
      callback(null, true);
    }
}

  _getDeviceData() {

    const protocol = this.getSettings().protocol;
    const server = this.getSettings().server;
    const port = this.getSettings().port;
    const url = protocol + server;
    const id = this.getSettings().id;
    const mySqueezeServer = new SqueezeServer(url, port);

    const capabilities = this.getCapabilities();

    mySqueezeServer.register()
      .then(() => {

        var player = mySqueezeServer.players[id];

        player.status()
          .then(reply => {

            //this.log(reply);

            if (!this.getAvailable()) this.setAvailable();

            if (capabilities.indexOf('speaker_playing') >= 0) {
              if (reply.mode == 'play') this.setCapabilityValue('speaker_playing', true);
              else this.setCapabilityValue('speaker_playing', false);
            };

            if (capabilities.indexOf('volume_set') >= 0) {
              var volume = reply['mixer volume'];
              volume = volume / 100;
              this.setCapabilityValue('volume_set', volume);
            }
            if (capabilities.indexOf('volume_mute') >= 0) {
              var volume = reply['mixer volume'];
              if (volume < 1) this.setCapabilityValue('volume_mute', true);
              else this.setCapabilityValue('volume_mute', false);
            }

            if (capabilities.indexOf('speaker_repeat') >= 0) {
              var repeat = reply['playlist repeat'];
              if (repeat == 0 ) this.setCapabilityValue('speaker_repeat', 'none');
              else if (repeat == 1 ) this.setCapabilityValue('speaker_repeat', 'track');
              else if (repeat == 2 ) this.setCapabilityValue('speaker_repeat', 'playlist');
            }

            if (capabilities.indexOf('speaker_shuffle') >= 0) {
              var shuffle = reply['playlist shuffle'];
              if (shuffle == 0 ) this.setCapabilityValue('speaker_shuffle', false);
              else this.setCapabilityValue('speaker_shuffle', true);
            }

            if (util.hasValue(reply.playlist_loop)) {
              if (capabilities.indexOf('speaker_track') >= 0) {
                if (util.hasValue(reply.playlist_loop[0].title)) this.setCapabilityValue('speaker_track', reply.playlist_loop[0].title);
                else  this.setCapabilityValue('speaker_track', '');
              };

              if (capabilities.indexOf('speaker_artist') >= 0) {
                if (util.hasValue(reply.playlist_loop[0].artist)) this.setCapabilityValue('speaker_artist', reply.playlist_loop[0].artist);
                else this.setCapabilityValue('speaker_artist', '');
              };

              if (capabilities.indexOf('speaker_album') >= 0) {
                if (util.hasValue(reply.playlist_loop[0].album)) this.setCapabilityValue('speaker_album', reply.playlist_loop[0].album);
                else this.setCapabilityValue('speaker_album', '');
              };
            }

            /**
            var img_url = url + ':' + port + '/music/' + reply.playlist_loop[0].artwork_track_id + '/cover.jpg';
            //http://192.168.0.52:9002/music/1b664158/cover.jpg

            const _albumArt = new Homey.Image();
            _albumArt.setStream(async (stream) => {
              const res = await fetch(img_url);
              if(!res.ok)
                throw new Error('Invalid Response');

              return res.body.pipe(stream);
            });
            _albumArt.register().catch(console.error);
            this.setAlbumArtImage(this._albumArt);
            **/

          })
          .catch((e) => {
            this.log(e);
            this.setUnavailable('Device not available on server');
            return Promise.Reject('Device unavailable on server');
          });

      })
      .catch((e) => {
        this.log(e);
        this.setUnavailable('Device not available on server');
        return Promise.Reject('Device not available on server');
      });
  }

  _pollDevice(interval) {
    this.log('Polling every ' +  interval + ' minutes');
    clearInterval(this.pollingInterval);
    this.pollingInterval = setInterval(() => {
      this.log('Fetching data for device ' + this.getSettings().id);
      this._getDeviceData();
    }, interval);
  }

}

module.exports = SqueezeboxDevice;
