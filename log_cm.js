var SerialPort = require('serialport');
var fs = require('fs');

const ATTR_RESPONSE = 0x41;
const QUERY_CUSTOM_MEASURE_DATA = Buffer.from([0x02, 0x01, 0x43, 0x44, 0x43, 0x55, 0x33, 0x20, 0x3F, 0x03, 0x3D, 0x0D, 0x0A]);

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
console.log(headers[1][0]);

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
