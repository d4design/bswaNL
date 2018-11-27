var SerialPort = require('serialport');
var fs = require('fs');

const QUERY_STATE = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x41, 0x3F, 0x03, 0x3A, 0x0D, 0x0A]);

let dataBuffer = [];

SerialPort.list(function (err, ports) {
  if (err) throw err;
  console.log('Ports available:');
  ports.forEach(function(port) {
    console.log(`${port.comName} ${port.pnpId} ${port.manufacturer}`);
  });
  console.log('\n\n');
});



var port = new SerialPort('COM4', {
  baudRate: 9600
});

port.on('open', function() {
  console.log('Port is open.')
});

port.on('error', function(err) {
  console.log('Error: ', err.message);
});

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

  console.log(dataArray);

  port.close();
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
  console.log('Querying data');
});
