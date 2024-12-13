LED2.set();

//var int = require("ble_hid_combo");
var int = require("hid_");

NRF.setServices(undefined, { hid : int.report });
//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

//NRF.setAdvertising must be called additionally in case we are connected to Windows 11
NRF.setAdvertising([
{}, // include original Advertising packet
[   // second packet containing 'appearance'
2, 1, 6,  // standard Bluetooth flags
3,3,0x12,0x18, // HID Service
3, 0x19, 0xc2 || 0xc1 ,0x03 // : 0xC2 Mouse, 0xC1 Keyboard
]
]);

//Callback function for button S pressed.
function btnSPressed(btnSequence) {
  print("Button pressed: "+btnSequence);
  LED1.set();

  try{
    int.clickButton(int.BUTTON.LEFT);
  } catch(err) {
    console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
  }
  LED1.reset();
}

//Callback function for button SS pressed.
function btnSSPressed(btnSequence) {
  print("Button pressed: "+btnSequence);
  LED2.set();

  try{
    int.moveMouse(5, 10);
  } catch(err) {
    console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
  }
  LED2.reset();
}

//Callback function for button L pressed.
function btnLPressed(btnSequence) {
  print("Button pressed: "+btnSequence);
  LED3.set();

  try{
    int.tapKey(44);
  }catch (err) {
    console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
  }
  LED3.reset();
}

function btnReleased(){
  print("Button released");
  LED3.reset();

  try{
    int.releaseButton(int.BUTTON.ALL);
  }catch(err) {
    console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
  }

  try {
    int.keyUp(int.KEY.ALL);
  }catch (err) {
    console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
  }
}

// Import module SWButton
var SWBtn = require("SWButton");

// Configure timings for button press detection
SWBtn.prototype.C =  { B: 20,  // B - integer - debounce [ms]
  L: 1,   // L - float   - min Long press [s]
  P: 150, // P - integer - min Pause [ms]
  D: 0   // D - integer - delay of fnc function invocation [ms]
};


//Define callbacks for button press sequence:
//S: Short press
//SS: Double short press
//L: Long press
//SL: Short - Long press,...

var functions = { S:   function(){ btnSPressed("S"); },
 SS:  function(){ btnSSPressed("SS"); },
 L:  function(){ btnLPressed("L") }
};

var mySWBtn = new SWBtn(function(k){
  console.log("BTN1 detected " + k); // log detected key pattern and...
  if (functions[k]) { functions[k](); }; // ...dispatch if defined  
},BTN1,false);

LED1.reset();
LED2.reset();
LED3.reset();