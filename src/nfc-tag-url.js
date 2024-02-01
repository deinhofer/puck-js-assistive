var data = new Uint8Array(10+64);
var header = NRF.nfcStart();
var written = false;
data.set(header,0); // NFC device header
data.set([0,0,0xE1,0x10,(data.length-10)/8,0,0,3,0,0xFe], 0x0A); // NDEF tag header 
// 0,0,e1

NRF.nfcURL("https://grid.asterics.eu");

NRF.on('NFCrx', function(rx) {
  var idx = rx[1]*4;
  switch(rx[0]) {
    case 0x30: //command: READ
      NRF.nfcSend(new Uint8Array(data.buffer, idx, 16));
      break;
    case 0xa2: //command: WRITE
      written = true;
      if(idx > data.length) {
        NRF.nfcSend(0x0);
      } else {
        data.set(new Uint8Array(rx, 2, 4), idx);
        NRF.nfcSend(0xA);
      }
      break;
    default:   //just, re-enable rx
      NRF.nfcSend();
      break;
    }
});
NRF.on("NFCoff",function() {
  if (written)
    onWritten(E.toString(new Uint8Array(data.buffer,26,data[21]-3)));
  written = false;
});

function onWritten(data) {
  console.log("NFC written", data);
  var colors = {
    red : 1,
    green : 2,
    blue : 4,
  };
  // Only light LEDs if we actually have 3 LEDs! Allows Pixl.js upload
  if (colors[data] && global.LED1 && global.LED2 && global.LED3) {
    digitalWrite([LED3,LED2,LED1], colors[data]);
    setTimeout(function() {
      digitalWrite([LED3,LED2,LED1], 0);
    },1000);
  }
}