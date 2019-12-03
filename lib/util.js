const Homey = require('homey');

/**
 * Checks is the variable has a value
 * @param string        Variable to check
 * @returns {boolean}   Returns true if there is a value
 */
exports.hasValue = function(string) {
    return !!(typeof string != 'undefined' && string != null && string != '');
}

/**
 * Checks the server data array if they are valid
 * @param server_data   Variable to check
 * @returns {boolean}   Returns true if the data checks out
 */
exports.checkServerData = function(server_data) {
    var result = true;

    if (!this.hasValue(server_data.address)) result = false;
    if (!this.hasValue(server_data.port)) {
        result = false;
    } else if (server_data.port > 65536 || server_data.port < 1) {
        result = false;
    }

    return result;
}

/**
 * Checks if the object is already in Array
 * @param array         Array to check in
 * @param obj           Object to find
 * @returns {boolean}   True if object is array, false otherwise
 */
exports.contains = function(array, obj) {
    var i = array.length;
    while (i--) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

exports.getPosition = function(str, text, occurrence) {
    return str.split(text, occurrence).join(text).length;
}

/**
* Lists all players on the server
* @param server_data   Server to check for players
* @param callback      Callback with player data. Function(err, devices){}
*/
exports.listPlayers = function(server_data, callback) {
  console.log('List players on server', server_data);

  // prepare for http and https users setting (not available in GUI, yet)
  var url = server_data.protocol + server_data.address;

  if (!this.checkServerData(server_data)) {
      callback(__('pair.msg_invalidAddressData'), null);
      return;
  }

  var SqueezeServer = require('squeezenode');
  var mySqueezeServer = new SqueezeServer(
      url,
      server_data.port
  );

  mySqueezeServer.register()
    .then(() => {
      console.log('Successfully registered to the server');

      mySqueezeServer.getPlayers()
        .then((reply) => {
          console.log('Successfully got the players on the server');

          var devices = [];
          const players = reply.players;

          for (var index = 0; index < players.length; index++) {
              devices.push({
                  name: players[index].name,
                  data: {
                      sqeeze_name: players[index].name,
                      id: players[index].playerid,
                      ip: players[index].ip,
                      displaytype: players[index].displaytype,
                      canpoweroff: players[index].canpoweroff,
                      model: players[index].model
                  }
              });
          }
          callback(false, devices);
        })
        .catch((e) => {
          console.log('Failed to get the players');
          console.log(e);
          callback(e, null);
        })
    })
    .catch((e) => {
      console.log('Failed to registered to the server');
      console.log(e);
      callback(e, null);
    });
}

/**
 * Validates the connection with the server
 * @param server_data   Server to check
 * @param callback      Callback with result. Function(err, result)
 */
exports.validateConnection = function(server_data, callback) {
  console.log('Validating server', server_data);

  // preparation for http and https users setting (not available in GUI, yet)
  var url = server_data.protocol + server_data.address;

  if (!this.checkServerData(server_data)) {
      callback(__('pair.msg_invalidAddressData'), null);
      return;
  }

  const SqueezeServer = require('squeezenode');
  const mySqueezeServer = new SqueezeServer(
      url,
      server_data.port
  );

  mySqueezeServer.register()
    .then(() => {
      console.log('Successfully registered to the server');
      callback(null, 'success');
    })
    .catch((e) => {
      console.log('Failed to registered to the server');
      console.log(e);
      callback(e, null);
    });
}
