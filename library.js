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

function getHex1(str)  {
	var hexArr = [];
	for (var n = 0, l = str.length; n < l; n ++)
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
      hexArr.push(parseInt(hex,16));
	 }
   return hexArr;
};

function getHex2(str)  {
	var hexArr = [];
	for (var n = 0, l = str.length; n < l; n ++)
     {
		var hex = Number(str.charCodeAt(n)).toString(16);
    if (str.length === 1) {
      hexArr.push(0x30);
      hexArr.push(parseInt(hex,16));
    } else {
      hexArr.push(parseInt(hex,16));
    }
	 }
   return hexArr;
};

function freqToHex(freqName) {
switch (freqName) {
  case 'A':
    freqNumber = 0x30;
    break;
  case 'B':
    freqNumber = 0x31;
    break;
  case 'C':
    freqNumber = 0x32;
    break;
  case 'Z':
    freqNumber = 0x33;
    break;
  default:
    freqNumber = 0x30;
}
return freqNumber;
};

function freqFromHex(freqNumber) {
switch (freqNumber) {
  case 0:
    freqName = 'LA';
    break;
  case 1:
    freqName = 'LB';
    break;
  case 2:
    freqName = 'LC';
    break;
  case 3:
    freqName = 'LZ';
    break;
  default:
    freqName = 'Error';
}
return freqName;
};

function detectorToHex(detectorName) {
switch (detectorName) {
  case 'F':
    detectorNumber = 0x30;
    break;
  case 'S':
    detectorNumber = 0x31;
    break;
  case 'I':
    detectorNumber = 0x32;
    break;
  default:
    detectorNumber = 0x30;
}
return detectorNumber;
};

function detectorFromHex(detectorNumber) {
switch (detectorNumber) {
  case 0:
    detectorName = 'F';
    break;
  case 1:
    detectorName = 'S';
    break;
  case 2:
    detectorName = 'I';
    break;
  default:
    detectorName = 'Error';
}
return detectorName;
};

function modeToHex(modeName) {
  let modeNumber = {p1:'',p2:''};
switch (modeName) {
  case 'SPL':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x30;
    break;
  case 'sd':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x31;
    break;
  case 'sel':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x32;
    break;
  case 'e':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x33;
    break;
  case 'max':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x34;
    break;
  case 'min':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x35;
    break;
  case 'peak':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x36;
    break;
  case 'eq':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x37;
    break;
  case 'LN1':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x38;
    break;
  case 'LN2':
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x39;
    break;
  case 'LN3':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x30;
    break;
  case 'LN4':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x31;
    break;
  case 'LN5':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x32;
    break;
  case 'LN6':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x33;
    break;
  case 'LN7':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x34;
    break;
  case 'LN8':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x35;
    break;
  case 'LN9':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x36;
    break;
  case 'LN10':
    modeNumber.p1 = 0x31;
    modeNumber.p2 = 0x37;
    break;
  default:
    modeNumber.p1 = 0x30;
    modeNumber.p2 = 0x30;
}
return modeNumber;
};


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

        //translate frequency weightings and detector
        statSettings[0] = freqFromHex(statSettings[0]);
        statSettings[1] = detectorFromHex(statSettings[1]);

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
           var customMeasureInput =  [{freq: "C", detector: "F", mode: "peak"}, //group1
                                     {freq: "A", detector: "F", mode: "peak"}, //group2
                                     {freq: "A", detector: "F", mode: "peak"}, //group3
                                     {freq: "A", detector: "F", mode: "peak"}, //group4
                                     {freq: "A", detector: "S", mode: "peak"}, //group5
                                     {freq: "B", detector: "I", mode: "peak"}, //group6
                                     {freq: "C", detector: "F", mode: "peak"}, //group7
                                     {freq: "Z", detector: "S", mode: "peak"}, //group8
                                     {freq: "A", detector: "I", mode: "LN1"}, //group9
                                     {freq: "B", detector: "F", mode: "LN2"}, //group10
                                     {freq: "C", detector: "S", mode: "LN3"}, //group11
                                     {freq: "Z", detector: "I", mode: "LN4"}, //group12
                                     {freq: "Z", detector: "F", mode: "LN5"}, //group13
                                     {freq: "Z", detector: "S", mode: "LN6"} //group14
                                   ];

      console.log('Setting Custom Settings');
      let dataBuffer = [];
      let thisGroupNumber = 1;
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

        group_p1 = getHex2(thisGroupNumber.toString())[0];
        group_p2 = getHex2(thisGroupNumber.toString())[1];
        freq = freqToHex(customMeasureInput[thisGroupNumber-1].freq);
        detector = detectorToHex(customMeasureInput[thisGroupNumber-1].detector);
        mode_p1 = modeToHex(customMeasureInput[thisGroupNumber-1].mode).p1;
        mode_p2 = modeToHex(customMeasureInput[thisGroupNumber-1].mode).p2;

        var SET_CUSTOM_MEASURE = [0x02, 0x01, 0x43, 0x43, 0x55, 0x53, group_p1, group_p2, 0x20, freq, 0x20, detector, 0x20, mode_p1, mode_p2, 0x03, 0x00, 0x0D, 0x0A];
        port.write(SET_CUSTOM_MEASURE, function(err) {
          if (err) {
            callback(err);
            return console.log('Error on write: ', err.message);
          }
          console.log('Setting Custom Measure',thisGroupNumber,customMeasureInput[thisGroupNumber-1]);
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
            if (thisGroupNumber > 14) {
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

   setStats: function(callback) {
      console.log('Setting statistical measures');
      let dataBuffer = [];

      //inputs to SLM
      var statSettings = {freq:'A', detector:'F', LN1:'01', LN2:'05', LN3:'10', LN4:'50', LN5:'90', LN6:'95', LN7:'99', LN8:'80', LN9:'90', LN10:'99'};
      var freq = freqToHex(statSettings.freq);
      var LN1_p1 = getHex2(statSettings.LN1)[0];
      console.log(statSettings);
      var SET_STATS =  [0x02, 0x01, 0x43, 0x53, 0x54, 0x53,
                        freq, 0x20, //freq
                        detectorToHex(statSettings.detector), 0x20, //detector
                        LN1_p1, getHex2(statSettings.LN1)[1], 0x20, //LN1
                        getHex2(statSettings.LN2)[0], getHex2(statSettings.LN2)[1], 0x20, //LN2
                        getHex2(statSettings.LN3)[0], getHex2(statSettings.LN3)[1], 0x20, //LN3
                        getHex2(statSettings.LN4)[0], getHex2(statSettings.LN4)[1], 0x20, //LN4
                        getHex2(statSettings.LN5)[0], getHex2(statSettings.LN5)[1], 0x20, //LN5
                        getHex2(statSettings.LN6)[0], getHex2(statSettings.LN6)[1], 0x20, //LN6
                        getHex2(statSettings.LN7)[0], getHex2(statSettings.LN7)[1], 0x20, //LN7
                        getHex2(statSettings.LN8)[0], getHex2(statSettings.LN8)[1], 0x20, //LN8
                        getHex2(statSettings.LN9)[0], getHex2(statSettings.LN9)[1], 0x20, //LN9
                        getHex2(statSettings.LN10)[0], getHex2(statSettings.LN10)[1], //LN10
                        0x03, 0x00, 0x0D, 0x0A];

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
        return dataArray;
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
              callback(null, null);
            } else {
              dataBuffer.push(b);
            }
          } else if (b === 0x02) {
            isReading = true;
          }
        }

      });

      port.write(SET_STATS, function(err) {
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
