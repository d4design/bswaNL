var port;
var SerialPort = require('serialport');
var fs = require('fs');
var slmState;
var statSettings;
var customMeasures;
const COM_PORT = 'COM4';
const ATTR_RESPONSE = 0x41;
const START_MEAS = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x41, 0x31, 0x03, 0x34, 0x0D, 0x0A]);
const STOP_MEAS = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x41, 0x30, 0x03, 0x35, 0x0D, 0x0A]);
const QUERY_STATE = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x41, 0x3F, 0x03, 0x3A, 0x0D, 0x0A]);
const QUERY_CUSTOM_MEASURE_DATA = Buffer.from([0x02, 0x01, 0x43, 0x44, 0x43, 0x55, 0x33, 0x20, 0x3F, 0x03, 0x3D, 0x0D, 0x0A]);
const QUERY_STATS = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x53, 0x3F, 0x03, 0x28, 0x0D, 0x0A]);
const QUERY_CUSTOM_MEASURE = [[0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x31, 0x20, 0x3F, 0x03, 0x18, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x32, 0x20, 0x3F, 0x03, 0x1B, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x33, 0x20, 0x3F, 0x03, 0x1A, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x34, 0x20, 0x3F, 0x03, 0x1D, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x35, 0x20, 0x3F, 0x03, 0x1C, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x36, 0x20, 0x3F, 0x03, 0x1F, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x37, 0x20, 0x3F, 0x03, 0x1E, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x38, 0x20, 0x3F, 0x03, 0x11, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x30, 0x39, 0x20, 0x3F, 0x03, 0x10, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x31, 0x30, 0x20, 0x3F, 0x03, 0x18, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x31, 0x31, 0x20, 0x3F, 0x03, 0x19, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x31, 0x32, 0x20, 0x3F, 0x03, 0x1A, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x31, 0x33, 0x20, 0x3F, 0x03, 0x1B, 0x0D, 0x0A],
                              [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, 0x31, 0x34, 0x20, 0x3F, 0x03, 0x1C, 0x0D, 0x0A]];

module.exports = {

  initialize: function(callback) {
    // initialize: function(callback) {
     console.log('Initializing...');

// setTimeout(function() {

     SerialPort.list(function (err, ports) {
       if (err) throw err;
       console.log('Ports available:');
       ports.forEach(function(port) {
         console.log(`${port.comName} ${port.pnpId} ${port.manufacturer}`);
       });
       console.log('\n');
     });

     port = new SerialPort(COM_PORT, {
       baudRate: 9600
     });

     port.on('open', function() {
       console.log(COM_PORT,'is open.');
       callback();
     });

     port.on('error', function(err) {
       console.log('Error: ', err.message);
       callback(err);
     });

   // }, 1000);

   },

   getStats: function(callback) {
      console.log('getting statistical settings');
      let dataBuffer = [];
      function processStats(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let statsString = '';
        for (var i = 0; i < data.length; i++) {
          statsString += String.fromCharCode(data[i]);
        }

        statSettings = statsString.split(',').map(Number);

        //translate frequency weightings
        switch (statSettings[0]) {
          case 0:
            statSettings[0] = 'LA';
            break;
          case 1:
            statSettings[0] = 'LB';
            break;
          case 2:
            statSettings[0] = 'LC';
            break;
          case 3:
            statSettings[0] = 'LZ';
            break;
          default:
            statSettings[0] = 'Error';
        }

        //translate detector settings
        switch (statSettings[1]) {
          case 0:
            statSettings[1] = 'F';
            break;
          case 1:
            statSettings[1] = 'S';
            break;
          case 2:
            statSettings[1] = 'I';
            break;
          default:
            statSettings[1] = 'Error';
        }

        // console.log(statsArray);
        return statSettings;
      }

      let isReading = false;
      port.on('data', function (data) {
        for (var i = 0; i < data.length; i++) {
          let b = data[i];
          if (isReading) {
            if (b === 0x0A && dataBuffer[dataBuffer.length-1] === 0x0D && dataBuffer[dataBuffer.length-3] === 0x03) { //Check for ending signal
              processStats(dataBuffer);
              isReading = false;
              dataBuffer = [];
              callback(null, statSettings);
            } else {
              dataBuffer.push(b);
            }
          } else if (b === 0x02) {
            isReading = true;
          }
        }

      });

      port.write(QUERY_STATS, function(err) {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('Querying data');
      });
   },

   getCustomMeasures: function(callback) {
      console.log('getting custom settings');
      let dataBuffer = [];
      customMeasures = [];

      function processData(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let dataString = '';
        for (var i = 0; i < data.length; i++) {
          dataString += String.fromCharCode(data[i]);
        }
        thisSetting = dataString.split(',').map(Number);
        customMeasures.push(thisSetting);
      }

      function processStats(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let statsString = '';
        for (var i = 0; i < data.length; i++) {
          statsString += String.fromCharCode(data[i]);
        }

        statSettings = statsString.split(',').map(Number);
        //translate frequency weightings
        switch (statSettings[0]) {
          case 0:
            statSettings[0] = 'LA';
            break;
          case 1:
            statSettings[0] = 'LB';
            break;
          case 2:
            statSettings[0] = 'LC';
            break;
          case 3:
            statSettings[0] = 'LZ';
            break;
          default:
            statSettings[0] = 'Error';
        }

        //translate detector settings
        switch (statSettings[1]) {
          case 0:
            statSettings[1] = 'F';
            break;
          case 1:
            statSettings[1] = 'S';
            break;
          case 2:
            statSettings[1] = 'I';
            break;
          default:
            statSettings[1] = 'Error';
        }
      }


      function translateSettings() {
      //translate frequency weightings
      for (i = 0; i < customMeasures.length; i++) {
      switch (customMeasures[i][1]) {
        case 0:
          customMeasures[i][1] = 'LA';
          break;
        case 1:
          customMeasures[i][1] = 'LB';
          break;
        case 2:
          customMeasures[i][1] = 'LC';
          break;
        case 3:
          customMeasures[i][1] = 'LZ';
          break;
        default:
         customMeasures[i][1] = 'Error';
      }
      }

      // translate detector settings
      for (i = 0; i < customMeasures.length; i++) {
      switch (customMeasures[i][2]) {
        case 0:
          customMeasures[i][2] = 'F';
          break;
        case 1:
          customMeasures[i][2] = 'S';
          break;
        case 2:
          customMeasures[i][2] = 'I';
          break;
        default:
         customMeasures[i][2] = 'Error';
      }
      }
      //create headers
      for (i = 0; i < customMeasures.length; i++) {
         if (customMeasures[i][3] >= 8) {
            customMeasures[i] = statSettings[0] + statSettings[1] + (statSettings[customMeasures[i][3] - 6]);
          } else {
            switch (customMeasures[i][3]) {
              case 0: //SPL
                customMeasures[i] =  customMeasures[i][1] + customMeasures[i][2];
                break;
              case 1: //SD
                customMeasures[i] =  customMeasures[i][1] + customMeasures[i][2] + 'sd';
                break;
              case 2: //SEL
                customMeasures[i] =  customMeasures[i][1] + 'sel';
                break;
              case 3: //E
                customMeasures[i] = customMeasures[i][1] + 'e';
                break;
              case 4: //Max
                customMeasures[i] =  customMeasures[i][1] + customMeasures[i][2] + 'max';
                break;
              case 5: //Min
                customMeasures[i] =  customMeasures[i][1] + customMeasures[i][2] + 'min';
                break;
              case 6: //Peak
                customMeasures[i] =  customMeasures[i][1] + 'peak';
                break;
              case 7: //EQ
                customMeasures[i] =  customMeasures[i][1] + 'eq';
                break;
              default:
                customMeasures[i] = 'error';
            }
          }
        }
      }

      let isReading = false;
      let thisSettingNumber = 0;
      let gotStats = false
      port.on('data', function (data) {
        for (var i = 0; i < data.length; i++) {
          let b = data[i];
          if (isReading) {
            if (b === 0x0A && dataBuffer[dataBuffer.length-1] === 0x0D && dataBuffer[dataBuffer.length-3] === 0x03) { //Check for ending signal
              if (gotStats === false) {
                processStats(dataBuffer);
                isReading = false;
                dataBuffer = [];
                gotStats = true;
                nextQuery();
              } else {
              processData(dataBuffer);
              isReading = false;
              dataBuffer = [];
              thisSettingNumber++;
              if (thisSettingNumber > 13) {
                translateSettings();
                callback(null, customMeasures);
              } else {
              nextQuery();
            }
          }
        } else {
              dataBuffer.push(b);
            }
          } else if (b === 0x02) {
            isReading = true;
          }
        }

      });

      port.write(Buffer.from(QUERY_STATS), function(err) {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('Querying Statistical Settings');
      });

      function nextQuery() {
        port.write(Buffer.from(QUERY_CUSTOM_MEASURE[thisSettingNumber]), function(err) {
          if (err) {
            return console.log('Error on write: ', err.message);
          }
          console.log('Querying Custom Measure',thisSettingNumber+1);
        });

    };
   },

   setCustomMeasures: function(callback) {

     //inputs to SLM
           var customMeasureInput =  [{freq: "A", detector: "F", mode: "SPL"}, //group1
                                     {freq: "B", detector: "S", mode: "sd"}, //group2
                                     {freq: "C", detector: "I", mode: "sel"}, //group3
                                     {freq: "Z", detector: "F", mode: "e"}, //group4
                                     {freq: "A", detector: "S", mode: "max"}, //group5
                                     {freq: "B", detector: "I", mode: "min"}, //group6
                                     {freq: "C", detector: "F", mode: "peak"}, //group7
                                     {freq: "Z", detector: "S", mode: "eq"}, //group8
                                     {freq: "A", detector: "I", mode: "LN1"}, //group9
                                     {freq: "B", detector: "F", mode: "LN2"}, //group10
                                     {freq: "C", detector: "S", mode: "LN3"}, //group11
                                     {freq: "Z", detector: "I", mode: "LN4"}, //group12
                                     {freq: "A", detector: "F", mode: "LN5"}, //group13
                                     {freq: "B", detector: "S", mode: "LN6"} //group14
                                   ];

      console.log('Setting Custom Settings');
      let dataBuffer = [];
      let thisGroupNumber = 0;
      var group_p1;
      var group_p2;
      var freq;
      var detector;
      var mode_p1;
      var mode_p2;


      function processData(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let dataString = '';
        for (var i = 0; i < data.length; i++) {
          dataString += String.fromCharCode(data[i]);
        }
        dataArray = dataString.split(',').map(Number);
        // console.log(dataArray);
      }

      //create command based on input settings
      function createCommand () {

      switch (thisGroupNumber) {
        case 0:
          var group_p1 = 0x30;
          var group_p2 = 0x31;
          break;
        case 1:
          var group_p1 = 0x30;
          var group_p2 = 0x32;
          break;
        case 2:
          var group_p1 = 0x30;
          var group_p2 = 0x33;
          break;
        case 3:
          var group_p1 = 0x30;
          var group_p2 = 0x34;
          break;
        case 4:
          var group_p1 = 0x30;
          var group_p2 = 0x35;
          break;
        case 5:
          var group_p1 = 0x30;
          var group_p2 = 0x36;
          break;
        case 6:
          var group_p1 = 0x30;
          var group_p2 = 0x37;
          break;
        case 7:
          var group_p1 = 0x30;
          var group_p2 = 0x38;
          break;
        case 8:
          var group_p1 = 0x30;
          var group_p2 = 0x39;
          break;
        case 9:
          var group_p1 = 0x31;
          var group_p2 = 0x30;
          break;
        case 10:
          var group_p1 = 0x31;
          var group_p2 = 0x31;
          break;
        case 11:
          var group_p1 = 0x31;
          var group_p2 = 0x32;
          break;
        case 12:
          var group_p1 = 0x31;
          var group_p2 = 0x33;
          break;
        case 13:
          var group_p1 = 0x31;
          var group_p2 = 0x34;
          break;
        default:
          return console.log('Error');
      }


      switch (customMeasureInput[thisGroupNumber].freq) {
        case 'A':
          var freq = 0x30;
          break;
        case 'B':
          var freq = 0x31;
          break;
        case 'C':
          var freq = 0x32;
          break;
        case 'Z':
          var freq = 0x33;
          break;
        default:
          var freq = 0x30;
      }

      switch (customMeasureInput[thisGroupNumber].detector) {
        case 'F':
          var detector = 0x30;
          break;
        case 'S':
          var detector = 0x31;
          break;
        case 'I':
          var detector = 0x32;
          break;
        default:
          var detector = 0x30;
      }

      switch (customMeasureInput[thisGroupNumber].mode) {
        case 'SPL':
          var mode_p1 = 0x30;
          var mode_p2 = 0x30;
          break;
        case 'sd':
          var mode_p1 = 0x30;
          var mode_p2 = 0x31;
          break;
        case 'sel':
          var mode_p1 = 0x30;
          var mode_p2 = 0x32;
          break;
        case 'e':
          var mode_p1 = 0x30;
          var mode_p2 = 0x33;
          break;
        case 'max':
          var mode_p1 = 0x30;
          var mode_p2 = 0x34;
          break;
        case 'min':
          var mode_p1 = 0x30;
          var mode_p2 = 0x35;
          break;
        case 'peak':
          var mode_p1 = 0x30;
          var mode_p2 = 0x36;
          break;
        case 'eq':
          var mode_p1 = 0x30;
          var mode_p2 = 0x37;
          break;
        case 'LN1':
          var mode_p1 = 0x30;
          var mode_p2 = 0x38;
          break;
        case 'LN2':
          var mode_p1 = 0x30;
          var mode_p2 = 0x39;
          break;
        case 'LN3':
          var mode_p1 = 0x31;
          var mode_p2 = 0x30;
          break;
        case 'LN4':
          var mode_p1 = 0x31;
          var mode_p2 = 0x31;
          break;
        case 'LN5':
          var mode_p1 = 0x31;
          var mode_p2 = 0x32;
          break;
        case 'LN6':
          var mode_p1 = 0x31;
          var mode_p2 = 0x33;
          break;
        case 'LN7':
          var mode_p1 = 0x31;
          var mode_p2 = 0x34;
          break;
        case 'LN8':
          var mode_p1 = 0x31;
          var mode_p2 = 0x35;
          break;
        case 'LN9':
          var mode_p1 = 0x31;
          var mode_p2 = 0x36;
          break;
        case 'LN10':
          var mode_p1 = 0x31;
          var mode_p2 = 0x37;
          break;
        default:
          var mode_p1 = 0x30;
          var mode_p2 = 0x30;
      }

      var SET_CUSTOM_MEASURE = [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, group_p1, group_p2, 0x20, freq, 0x20, detector, 0x20, mode_p1, mode_p2, 0x03, 0x00, 0x0D, 0x0A];

      port.write(SET_CUSTOM_MEASURE, function(err) {
        if (err) {
          callback(err);
          return console.log('Error on write: ', err.message);
        }
        console.log('Setting Custom Measure',thisGroupNumber+1);
        console.log(customMeasureInput[thisGroupNumber]);
      })

    }

    let isReading = false;
    port.on('data', function (data) {
      for (var i = 0; i < data.length; i++) {
        let b = data[i];
        if (isReading) {
          if (b === 0x0A && dataBuffer[dataBuffer.length-1] === 0x0D && dataBuffer[dataBuffer.length-3] === 0x03) { //Check for ending signal
            processData(dataBuffer);
            isReading = false;
            dataBuffer = [];
            thisGroupNumber++;
            if (thisGroupNumber > 13) {
              console.log('Settings updated')
              callback(null, null);
            } else {
            createCommand();
          }
      } else {
            dataBuffer.push(b);
          }
        } else if (b === 0x02) {
          isReading = true;
        }
      }

    });

  createCommand();

   },

   checkState: function(callback) {
      console.log('Checking SLM state');
      let dataBuffer = [];
      function processData(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let dataString = '';
        for (var i = 0; i < data.length; i++) {
          dataString += String.fromCharCode(data[i]);
        }

        var dataArray = dataString.split(',').map(Number);
        slmState = undefined;
        slmState = dataArray[0];
        // console.log('SLM State: ' + slmState);
        // port.close(); //TODO: maybe dont have this?
        return slmState;
      }

      let isReading = false;
      port.on('data', function (data) {
        for (var i = 0; i < data.length; i++) {
          let b = data[i];
          if (isReading) {
            if (b === 0x0A && dataBuffer[dataBuffer.length-1] === 0x0D && dataBuffer[dataBuffer.length-3] === 0x03) { //Check for ending signal
              const slmState = processData(dataBuffer);
              isReading = false;
              dataBuffer = [];
              //TODO: you might get a problem where this gets called over and over.
              //if so you'll probably have to move the data event handler out somewhere else
              //and do some pretty major refactoring
              callback(null, slmState);
            } else {
              dataBuffer.push(b);
            }
          } else if (b === 0x02) {
            isReading = true;
          }
        }

      });

      port.write(QUERY_STATE, function(err) {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('Communicating with SLM');
      });
   },

   start: function(callback) {
      console.log('Starting SLM');
      port.write(START_MEAS, function(err) {
        if (err) {
          callback(err);
          return console.log('Error on write: ', err.message);
        }
        console.log('SLM started.');
        // port.close();
        return callback();
      });
   },

   stop: function(callback) {
      console.log('Stopping SLM');
      port.write(STOP_MEAS, function(err) {
        if (err) {
          callback(err);
          return console.log('Error on write: ', err.message);
        }
        console.log('SLM stopped.');
        // port.close();
        return callback();
      });
   },

   portClose: function(callback) {
      console.log('Closing Port');
      port.close(null, function(err) {
        if (err) {
          callback(err);
          return console.log('Error on write: ', err.message);
        }
        port.close();
        return callback();
      });
   },

   logCM: function(callback) {
      console.log('Starting data logging of Custom Measures');
      let dataBuffer = [];
      function processHeaders(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let dataString = '';
        for (var i = 0; i < data.length; i++) {
          dataString += String.fromCharCode(data[i]);
        }

      //convert the data string to an array to make it easier to address each parameter.
        var dataArray = dataString.split(',').map(Number);

      //dataArray is 14 groups of 4 numbers: p1,p2,p3,data
      //p1,p2,p3 indicate what the following data is, which is set within the sound meter
      //p1 = frequency weighting (e.g. A), p2 = Detector (e.g. Fast), p3 = descriptor (e.g. eq)
      //once translated, p1,p2,p3 will become the header row for the csv file.
      //this code splits out each header group so they can be tranlated.
        var headers = [[dataArray[0],dataArray[1],dataArray[2]],
          [dataArray[4],dataArray[5],dataArray[6]],
          [dataArray[8],dataArray[9],dataArray[10]],
          [dataArray[12],dataArray[13],dataArray[14]],
          [dataArray[16],dataArray[17],dataArray[18]],
          [dataArray[20],dataArray[21],dataArray[22]],
          [dataArray[24],dataArray[25],dataArray[26]],
          [dataArray[28],dataArray[29],dataArray[30]],
          [dataArray[32],dataArray[33],dataArray[34]],
          [dataArray[36],dataArray[37],dataArray[38]],
          [dataArray[40],dataArray[41],dataArray[42]],
          [dataArray[44],dataArray[45],dataArray[46]],
          [dataArray[48],dataArray[49],dataArray[50]],
          [dataArray[52],dataArray[53],dataArray[54]]];

      //Translate the header parameters to column headers
      //translate frequency weightings
      for (i = 0; i < headers.length; i++) {
      switch (headers[i][0]) {
        case 0:
          headers[i][0] = 'LA';
          break;
        case 1:
          headers[i][0] = 'LB';
          break;
        case 2:
          headers[i][0] = 'LC';
          break;
        case 3:
          headers[i][0] = 'LZ';
          break;
        default:
         headers[i][0] = 'Error';
      }
      }

      //translate detector settings
      for (i = 0; i < headers.length; i++) {
      switch (headers[i][1]) {
        case 0:
          headers[i][1] = 'F';
          break;
        case 1:
          headers[i][1] = 'S';
          break;
        case 2:
          headers[i][1] = 'I';
          break;
        default:
         headers[i][1] = 'Error';
      }
      }

      //create headers
      for (i = 0; i < headers.length; i++) {
         if (headers[i][2] >= 8) {
            headers[i] = 'LN' + (headers[i][2] - 7);
          } else {
            switch (headers[i][2]) {
              case 0: //SPL
                headers[i] =  headers[i][0] + headers[i][1];
                break;
              case 1: //SD
                headers[i] =  headers[i][0] + headers[i][1] + 'sd';
                break;
              case 2: //SEL
                headers[i] =  headers[i][0] + 'sel';
                break;
              case 3: //E
                headers[i] = headers[i][0] + 'e';
                break;
              case 4: //Max
                headers[i] =  headers[i][0] + headers[i][1] + 'max';
                break;
              case 5: //Min
                headers[i] =  headers[i][0] + headers[i][1] + 'min';
                break;
              case 6: //Peak
                headers[i] =  headers[i][0] + 'peak';
                break;
              case 7: //EQ
                headers[i] =  headers[i][0] + 'eq';
                break;
              default:
                headers[i] = 'error';
            }
          }
      }

      //The 14 noise levels are put into an array:
        var noiseLevels = [dataArray[3],dataArray[7],dataArray[11],dataArray[15],dataArray[19],dataArray[23],dataArray[27],dataArray[31],dataArray[35],dataArray[39],dataArray[43],dataArray[47],dataArray[51],dataArray[55]];

        switch (command) {
          case ATTR_RESPONSE:
            console.log('Got query command');
            let csvHeaders = '';
            csvHeaders = headers.toString();
            console.log(csvHeaders);
            csvHeaders = `Time,${csvHeaders}\n`;
            fs.appendFile('data.csv', csvHeaders, (err) => {
                if (err) throw err;
                console.log('Headers saved successfully')
            });
            let csvLine = '';
            csvLine = noiseLevels.toString();
            console.log(csvLine);
            csvLine = `${new Date().toISOString()},${csvLine}\n`;
            fs.appendFile('data.csv', csvLine, (err) => {
                if (err) throw err;
                console.log('Data saved successfully')
            });
            break;
          default:
            console.log('Unknown ATTR Response: ', command,' (should be 65)');
        }
      }

      function processData(data) {
        //Remove device id
        data.splice(0, 1);
        //Remove the CR
        data.splice(data.length-1, 1);
        //Remove the BCC
        data.splice(data.length-1, 1);
        // Remove the ETX
        data.splice(data.length-1, 1);
        // Get the ATTR ATTR_RESPONSE
        const command = data.splice(0, 1)[0];  //should be 0x41 which is the Response Block at start of Response data

        let dataString = '';
        for (var i = 0; i < data.length; i++) {
          dataString += String.fromCharCode(data[i]);
        }

        var dataArray = dataString.split(',').map(Number);

        var noiseLevels = [dataArray[3],dataArray[7],dataArray[11],dataArray[15],dataArray[19],dataArray[23],dataArray[27],dataArray[31],dataArray[35],dataArray[39],dataArray[43],dataArray[47],dataArray[51],dataArray[55]];

        switch (command) {
          case ATTR_RESPONSE:
            console.log('Got query command');
            let csvLine = '';
            csvLine = noiseLevels.toString();
            console.log(csvLine);
            csvLine = `${new Date().toISOString()},${csvLine}\n`;
            fs.appendFile('data.csv', csvLine, (err) => {
                if (err) throw err;
                console.log('Data saved successfully')
            });
            break;
          default:
          console.log('Unknown ATTR Response: ', command,' (should be 65)');
        }
      }

      let headersCreated = false;
      let isReading = false;
      port.on('data', function (data) {
        for (var i = 0; i < data.length; i++) {
          let b = data[i];
          if (isReading) {
            if (b === 0x0A && dataBuffer[dataBuffer.length-1] === 0x0D && dataBuffer[dataBuffer.length-3] === 0x03 && headersCreated === false) { //Check for ending signal
              processHeaders(dataBuffer);
              headersCreated = true;
              isReading = false;
              dataBuffer = [];
            } else if (b === 0x0A && dataBuffer[dataBuffer.length-1] === 0x0D && dataBuffer[dataBuffer.length-3] === 0x03) { //Check for ending signal
                processData(dataBuffer);
                isReading = false;
                dataBuffer = [];
            } else {
              dataBuffer.push(b);
            }
          } else if (b === 0x02) {
            isReading = true;
          }
        }

      });

      port.write(QUERY_CUSTOM_MEASURE_DATA, function(err) {
        if (err) {
          return console.log('Error on write: ', err.message);
        }
        console.log('Querying data');
      });
   }

};
