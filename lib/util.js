const Homey = require('homey');

/**
 * Checks is the variable has a value
 * @param string        Variable to check
 * @returns {boolean}   Returns true if there is a value
 */
exports.hasValue = function(string) {
    return !!(typeof string != 'undefined' && string != null);
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

  // TODO better detect errors
  try {
      // Retrieve players from the Logitech Media Server.
      // TODO: The instantiation of mySqueezeServer is currently NOT DRY. Should it be done once only? Memory?
      mySqueezeServer.getPlayers(function (reply) {

          if (reply.ok == true) {
              var devices = [];

              for (var id in reply.result) {
                  devices.push({
                      name: reply.result[id].name,
                      data: {
                          id: reply.result[id].playerid
                      }
                  });
              }

              console.log('Found players: ', devices);
              // TODO: Detect failures.
              // Send the discovered devices back to the front end.
              if(typeof callback == 'function') {
                  callback(false, devices);
              } else throw new Error('No valid callback in list players method');
          } else {
              if(typeof callback == 'function') {
                  callback(reply, null);
              } else throw new Error('No valid callback in list players method');
          }
      });

      // TODO: This functionality for finding more devices is demonstrated in the documentation - investigate.
      //setTimeout(function(){
      //    socket.emit('list_devices', moreDevices)
      //}, 2000)
  } catch (error) {
      callback(error, null);
  }
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

  var SqueezeServer = require('squeezenode');
  var mySqueezeServer = new SqueezeServer(
      url,
      server_data.port
  );

  // TODO better detect errors
  try {
      mySqueezeServer.on('register', function() {
          callback(null, 'success');
      });
  } catch (error) {
      callback(error, null);
  }
}
