"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class SqueezeboxApp extends Homey.App {

    onInit() {
      this.log('Squeezebox player for Homey started...');
    }

};

module.exports = SqueezeboxApp;
