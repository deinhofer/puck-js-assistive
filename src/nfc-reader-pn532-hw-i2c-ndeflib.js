require("https://raw.githubusercontent.com/andijakl/ndef-nfc/master/NdefLibraryJS/dist/ndeflibrary.min.js");

/* Pins D28, D29 good for puck.js */
/*I2C1.setup({scl:D28,sda:D29});*/
/* Pins D15, D14 are good for MDBT42Q breakout module */
I2C1.setup({scl:D15,sda:D14});

var nfc = require("https://raw.githubusercontent.com/asterics/EspruinoDocs/master/devices/PN532.js").connect(I2C1);
print(nfc.getVersion());
nfc.SAMConfig(); // start listening

LED1.set();

var kb = require("ble_hid_keyboard");
NRF.setServices(undefined, { hid : kb.report });

// Add 'appearance' to advertising for Windows 11
NRF.setAdvertising([
  {}, // include original Advertising packet
  [   // second packet containing 'appearance'
    2, 1, 6,  // standard Bluetooth flags
    3,3,0x12,0x18, // HID Service
    3,0x19,0xc1,0x03 // Appearance: Keyboard
        // 0xc2,0x03 : 0x03C2 Mouse
        // 0xc3,0x03 : 0x03C3 Joystick
  ]
]);

LED1.reset();
LED2.reset();
/*
setInterval(function() {
 nfc.findCards(function(card) {
  print("Found card "+card);
  card = JSON.stringify(card);  

  if (card=="[4,247,94,140,63,174,0]") card1();
    
  if (card=="[4,119,180,135,63,221,0]") card2();

  if (card=="[4,46,234,128,233,77,0]") card3();
  });
}, 1000);

function card1() {
  LED2.set();
  setTimeout('LED2.reset();', 1000);
  kb.tap(kb.KEY['3'], 0, function() {
    kb.tap(kb.KEY['3'], 0);
  });  
}
*/

function readNDEFMessage(callback) {
  nfc.cmd([C.PN532_COMMAND_INLISTPASSIVETARGET,
             1, // max targets (max=2)
             C.PN532_BRTY_ISO14443A // modulation type
            ]);
  var p = this;
  setTimeout(function() { // wait for NFC poll (30ms)
    var d = p.i2c.readFrom(C.PN532_I2C_ADDRESS, 20+1).slice(1);
    if (d[6]==C.PN532_COMMAND_INLISTPASSIVETARGET+1) {
      if (d[7]!=1) print("Expecting 1 tag, got "+d[7]);
      callback(d.slice(12));
    }
  }, 30);
}

setInterval(function() { 
  nfc.findCardsAllBytes(function(byteArray) {
    print(byteArray.toString(16));
    
  });
}, 1000);

function card2() {
  LED2.set();
  setTimeout('LED2.reset();', 1000);
  kb.tap(kb.KEY['3'], 0, function() {
    kb.tap(kb.KEY['4'], 0);
  }); 
}

function card3() {
  LED2.set();
  setTimeout('LED2.reset();', 1000);
  kb.tap(kb.KEY['2'], 0, function() {
    kb.tap(kb.KEY['3'], 0);
  }); 
}