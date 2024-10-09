/*I2C1.setup({scl:D28,sda:D29});*/
I2C1.setup({scl:D15,sda:D14});

//var leds = [LED1,LED2,LED3];
//var leds = [LED1,LED2,LED3];


var nfc = require("PN532").connect(I2C1);
print(nfc.getVersion());
nfc.SAMConfig(); // start listening

setInterval(function() {
 nfc.findCards(function(card) {
  print("Found card "+card);
  card = JSON.stringify(card);
  //kb.tap(kb.KEY['1'], 0); 
   

  if (card=="[4,247,94,140,63,174,0]") card1();
    
  if (card=="[4,119,180,135,63,221,0]") card2();

  if (card=="[4,46,234,128,233,77,0]") card3();
  });
}, 1000);

var kb = require("ble_hid_keyboard");
NRF.setServices(undefined, { hid : kb.report });
//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

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

//kb.tap(kb.KEY['1'], 0);

function card1() {
  LED1.set();
  kb.tap(kb.KEY['3'], 0, function() {
    kb.tap(kb.KEY['3'], 0);
  });  
}

function card2() {
  LED2.set();
  kb.tap(kb.KEY['3'], 0, function() {
    kb.tap(kb.KEY['4'], 0);
  }); 
}

function card3() {
  LED2.set();
  kb.tap(kb.KEY['2'], 0, function() {
    kb.tap(kb.KEY['3'], 0);
  }); 
}