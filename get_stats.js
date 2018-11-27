var SerialPort = require('serialport');
var fs = require('fs');

const QUERY_STATS = Buffer.from([0x02, 0x01, 0x43, 0x53, 0x54, 0x53, 0x3F, 0x03, 0x28, 0x0D, 0x0A]);

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

  //translate frequency weightings
  switch (dataArray[0]) {
    case 0:
      dataArray[0] = 'LA';
      break;
    case 1:
      dataArray[0] = 'LB';
      break;
    case 2:
      dataArray[0] = 'LC';
      break;
    case 3:
      dataArray[0] = 'LZ';
      break;
    default:
      dataArray[0] = 'Error';
  }

  //translate detector settings
  switch (dataArray[1]) {
    case 0:
      dataArray[1] = 'F';
      break;
    case 1:
      dataArray[1] = 'S';
      break;
    case 2:
      dataArray[1] = 'I';
      break;
    default:
      dataArray[1] = 'Error';
  }



console.log(dataArray);
  // var noiseLevels = [dataArray[3],dataArray[7],dataArray[11],dataArray[15],dataArray[19],dataArray[23],dataArray[27],dataArray[31],dataArray[35],dataArray[39],dataArray[43],dataArray[47],dataArray[51],dataArray[55]];

  // switch (command) {
  //   case ATTR_RESPONSE:
  //     console.log('Got query command');
  //     let csvLine = '';
  //     csvLine = noiseLevels.toString();
  //     console.log(csvLine);
  //     csvLine = `${new Date().toISOString()},${csvLine}\n`;
  //     fs.appendFile('data.csv', csvLine, (err) => {
  //         if (err) throw err;
  //         console.log('Data saved successfully')
  //     });
  //     break;
  //   default:
  //   console.log('Unknown ATTR Response: ', command,' (should be 65)');
  // }
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

port.write(QUERY_STATS, function(err) {
  if (err) {
    return console.log('Error on write: ', err.message);
  }
  console.log('Querying data');
});
