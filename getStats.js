const async = require('async');
const library = require('./library.js');

async.waterfall([
  library.initialize,
  library.getStats,
  (statSettings, callback) => {
    console.log(statSettings);
    callback();
  }
], (err) => {
  if (err) {
    console.log('Something errored', err);
    return;
  }
  console.log('Done everything successfuly');
  library.portClose();
}) 
