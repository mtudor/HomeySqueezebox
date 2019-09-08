"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');


class SqueezeboxDriver extends Homey.Driver {

  onInit() {
    this.log("Init SqueezeboxDriver...")
  }

  onPair(socket) {
    // Validate server connection data
    socket.on('validate', function (server_data, callback) {

      util.validateConnection(server_data, function(error, result) {
          console.log('result', result);
          if (!error) {
              console.log('Connection to server successful');
              callback(null, result);
          } else {
              console.log('Connection to server failed');
              callback(error, null);
          }
      });
    });

    socket.on('list_players', function (server_data, callback) {

      util.listPlayers(server_data, function(error, devices) {
          console.log("Error: ", error);
          console.log("Devices: ", devices);
          if (error == false || error == null) {
              console.log('Successfully received servers players');
              callback(null, devices);
          } else {
              console.log('Error while getting server players');
              callback(error, null);
          }
      });
    });

  }

}

module.exports = SqueezeboxDriver;
