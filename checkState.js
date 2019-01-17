const async = require('async');
const library = require('./library.js');

async.waterfall([
  library.initialize,
  library.checkState,
  (slmState, callback) => {
    console.log('slmState', slmState);
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
