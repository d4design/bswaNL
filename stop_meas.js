var SerialPort = require('serialport');
var fs = require('fs');

const STOP_MEAS = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x41, 0x30, 0x03, 0x35, 0x0D, 0x0A]);

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

port.write(STOP_MEAS, function(err) {
  if (err) {
    return console.log('Error on write: ', err.message);
  }
  console.log('Measurement stopped.');
});
