const async = require('async');
const library = require('./library.js');

async.waterfall([
  library.initialize,
  library.stop
], (err) => {
  if (err) {
    console.log('Something errored', err);
    return;
  }
  console.log('Done everything successfuly');
})
 
