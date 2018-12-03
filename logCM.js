const async = require('async');
const library = require('./library.js');

async.waterfall([
  library.initialize,
  library.checkState,
  (slmState, callback) => {
    console.log('slmState', slmState);
    callback();
  },
  library.initialize, //TODO: refactor and dont close the connection in every function so you dont have to do this (hard)
  library.start,
  library.initialize, //TODO: refactor and dont close the connection in every function so you dont have to do this (hard)
  library.logCM
], (err) => {
  if (err) {
    console.log('Something errored', err);
    return;
  }
  console.log('Done everything successfuly');
})



  // setTimeout(function() {
  // switch (library.slmState) {
  //   case 0:
  //     library.initialize();
  //     library.start();
  //     setTimeout(function() {
  //       library.initialize();
  //       library.logCM();
  //     }, delayInMilliseconds);
  //   case 1:
  //     library.initialize();
  //     library.logCM();
  //   default:
  //     console.log('Error, SLM State: ',library.slmState);
  //   }
  // }, delayInMilliseconds);
