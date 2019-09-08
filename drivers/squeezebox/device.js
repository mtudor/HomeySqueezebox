'use strict';

const Homey = require('homey');
const SqueezeServer = require('squeezenode');
const util = require('/lib/util.js');

class SqueezeboxDevice extends Homey.Device {

  onInit() {

    this.log('Device init');
    this.log('Name:', this.getName());

    this.setUnavailable(Homey.__('loading'));

    var interval = this.getSetting('polling') || 4;
    this._pollDevice(interval);

    const settings = this.getSettings();
    this.log(settings);

    this.registerCapabilityListener('speaker_playing', (value, opts) => {

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      if (value) {
        // Set device to play
        this.log('set device ' + id + ' to play');
        mySqueezeServer.on('register', function () {
          //console.log(mySqueezeServer.players[id]);
          if (util.hasValue(mySqueezeServer.players[id])) {     // Squeezebox module doesn't report if device is offline but crashes
              mySqueezeServer.players[id].play(function (reply) {
                if (reply.ok) return Promise.resolve();
                else return Promise.reject('Failed to send command');
              });
          } else {
              console.setUnavailable('Device unavailable');
              console.log("Unable to get the status for device ", id);
              return Promise.reject('Device not available on server anymore');
          }
        });
        return Promise.resolve();

      } else {
        // Set device to Pause
        this.log('set device ' + id + ' to pause');
        mySqueezeServer.on('register', function () {
          mySqueezeServer.players[id];
            if (util.hasValue(mySqueezeServer.players[id])) {     // Squeezebox module doesn't report if device is offline but crashes
                mySqueezeServer.players[id].pause(function (reply) {
                    if (!reply.ok) return Promise.reject('Failed to send command');
                    else return Promise.resolve();
                });
            } else {
                this.setUnavailable('Device unavailable');
                console.log("Unable to get the status for device", id);
                return Promise.reject('Device not available on server anymore');
            }
        });
        return Promise.resolve();
      }
    });

    this.registerCapabilityListener('speaker_prev', (value, opts) => {

      this.log('registerCapabilityListener speaker_prev called');
      this.log('value: ', value);
      this.log('opts', opts);

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.on('register', function () {
          if (util.hasValue(mySqueezeServer.players[id])) {     // Squeezebox module doesn't report if device is offline but crashes
              mySqueezeServer.players[id].previous(function (reply) {
                  if (!reply.ok) return Promise.reject('Failed to send command');
                  else return Promise.resolve();
              });
          } else {
              this.setUnavailable('Device unavailable');
              this.log("Unable to get the status for device", id);
               return Promise.reject('Device not available on server anymore');
          }
      });

      return Promise.resolve();
    });

    this.registerCapabilityListener('volume_set', (value, opts) => {

      const volume = opts.volume;
      if (volume < 0 || volume > 1) volume = 0.5;

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;
      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.on('register', function () {
          if (util.hasValue(mySqueezeServer.players[id])) {     // Squeezebox module doesn't report if device is offline but crashes
              mySqueezeServer.players[id].setVolume(value * 100);
              return Promise.resolve();;
            } else {
                this.setUnavailable('Device unavailable');
                this.log("Unable to get the status for device", id);
                return Promise.reject('Device not available on server anymore');
            }
      });

      return Promise.resolve();
    });

    this.registerCapabilityListener('speaker_next', (value, opts) => {
      this.log('registerCapabilityListener speakerpnext called');
      this.log('value: ', value);
      this.log('opts', opts);

      const protocol = this.getSettings().protocol;
      const server = this.getSettings().server;
      const port = this.getSettings().port;
      const url = protocol + server;
      const id = this.getSettings().id;

      const mySqueezeServer = new SqueezeServer(url, port);

      mySqueezeServer.on('register', function () {
          if (util.hasValue(mySqueezeServer.players[id])) {     // Squeezebox module doesn't report if device is offline but crashes
              mySqueezeServer.players[id].next(function (reply) {
                  if (!reply.ok) return Promise.reject('Failed to send command');
                  else return Promise.resolve();
              });
          } else {
              this.setUnavailable('Device unavailable');
              this.log("Unable to get the status for device", id);
               return Promise.reject('Device not available on server anymore');
          }
      });

      return Promise.resolve();
    });

    this._getDeviceData();
    this.log('Setting device as available');
    this.setAvailable();

  }

  _getDeviceData() {
    const protocol = this.getSettings().protocol;
    const server = this.getSettings().server;
    const port = this.getSettings().port;
    const url = protocol + server;
    const id = this.getSettings().id;

    const mySqueezeServer = new SqueezeServer(url, port);

    mySqueezeServer.on('register', function () {
      if (util.hasValue(mySqueezeServer.players[id])) {     // Squeezebox module doesn't report if device is offline but crashes

        mySqueezeServer.players[id].getStatus(function (reply) {
            if (reply.ok) {
              console.log(reply.result.mode);
              this.setCapabilityValue('speaker_playing', true);
            } else return null;
        });

        mySqueezeServer.players[id].getCurrentTitle(function (reply) {
            if (reply.ok) {
              console.log(reply.result);
            } else return null;
        });

        mySqueezeServer.players[id].getArtist(function (reply) {
            if (reply.ok) {
              console.log(reply.result);
            } else return null;
        });

      } else {
          console.setUnavailable('Device unavailable');
          console.log("Unable to get the status for device ", id);
          return null;
      }
    });
  }

  _pollDevice(interval){

    clearInterval(this.pollingInterval);
    clearInterval(this.pingInterval);

    this.pollingInterval = setInterval(() => {
      console.log('Polling device');
      //_getDeviceData();
    }, 1000 * interval);
  }

}

module.exports = SqueezeboxDevice;
