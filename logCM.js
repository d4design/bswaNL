const library = require('./library.js');
var delay1 = 2000; //5 second
var delay2 = 4000; //5 second

  library.initialize();
  library.checkState();

  setTimeout(function() {
    library.initialize();
    library.start();
  }, delay1);

  setTimeout(function() {
    library.initialize();
    library.logCM();
  }, delay2);



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
