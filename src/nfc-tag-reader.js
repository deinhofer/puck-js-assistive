var header = NRF.nfcStart();

NRF.on('NFCrx', function(rx) {
  console.log(rx);
  var idx = rx[1]*4;
  switch(rx[0]) {
    case 0x30: //command: READ
      console.log("READ");
      break;
    case 0xa2: //command: WRITE
      console.log("WRITE");
      break;
    default:   //just, re-enable rx
      NRF.nfcSend();
      break;
    }
});