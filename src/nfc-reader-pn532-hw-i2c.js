/* Pins D28, D29 good for puck.js */
/*I2C1.setup({scl:D28,sda:D29});*/
/* Pins D15, D14 are good for MDBT42Q breakout module */
I2C1.setup({scl:D15,sda:D14});

var nfc = require("PN532").connect(I2C1);
print(nfc.getVersion());
nfc.SAMConfig(); // start listening

LED1.set();

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

//init current tag state
var tagData={
  "grid-url" : "https://grid.asterics.eu",
  "label"    : "label text"              ,
  "long-text": "long text of cell"       ,
  "image-url": "url to image"            ,
  "cell-id"  : "id of cell (optional)"
};

function sendShortCut(k1, k2) {
  try {
    kb.tap(k1, 0, function() {
      kb.tap(k2, 0);
    });
  }catch(err) {
      Bluetooth.println(err);
  }
}

function card1() {
  LED2.set();
  setTimeout('LED2.reset();', 1000);
  
  sendShortCut(kb.KEY['3'],kb.KEY['3']);

  tagData["label"]="Loewe";
  tagData["long-text"]="Das ist ein Loewe.";
  tagData["cell-id"]="card1";
  tagData["image-url"]="https://i.ebayimg.com/images/g/jUQAAOSwUllkcJ0J/s-l1600.png";
  Bluetooth.println(JSON.stringify(tagData));
}

function card2() {
  LED2.set();
  setTimeout('LED2.reset();', 1000);

  sendShortCut(kb.KEY['3'],kb.KEY['4']);

  tagData["label"]="Wolf";
  tagData["long-text"]="Das ist ein Wolf.";
  tagData["cell-id"]="card2";
  tagData["image-url"]="https://i.ebayimg.com/images/g/IdMAAOSwmPRk2M-D/s-l1600.png";
  Bluetooth.println(JSON.stringify(tagData));
}

function card3() {
  LED2.set();
  setTimeout('LED2.reset();', 1000);

  sendShortCut(kb.KEY['2'],kb.KEY['3']);

  tagData["label"]="Katze";
  tagData["long-text"]="Das ist ein Katze.";
  tagData["cell-id"]="card3";
  tagData["image-url"]="https://i.ebayimg.com/images/g/g-0AAOSwAOJkpXN3/s-l1600.png";
  Bluetooth.println(JSON.stringify(tagData));
}

setInterval(function() {
 nfc.findCards(function(card) {
  print("Found card "+card);
  card = JSON.stringify(card);  

  if (card=="[4,247,94,140,63,174,0]") card1();
    
  if (card=="[4,119,180,135,63,221,0]") card2();

  if (card=="[4,46,234,128,233,77,0]") card3();
  });
}, 1000);

digitalPulse(LED1,1,500);
LED1.reset();
LED2.reset();