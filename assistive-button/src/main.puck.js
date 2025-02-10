LED2.set();

// when deployed from espruino.com/ide you can also use ble_hid_combo, as the IDE 
// automatically deploys dependencies
//var int = require("ble_hid_combo");
var int = require("hid_");

// Configure the puck.js as a Bluetooth HID device
NRF.setServices(undefined, { hid : int.report });

//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

//NRF.setAdvertising must be called additionally in case we are connected to Windows 11
NRF.setAdvertising([
{}, // include original Advertising packet
[   // second packet containing 'appearance'
2, 1, 6,  // standard Bluetooth flags
3,3,0x12,0x18, // HID Service
3, 0x19, 0xc2 | 0xc1 ,0x03 // : 0xC2 Mouse, 0xC1 Keyboard
]
]);

/**/
/* Callback function for mouse click action.*/
/* @param {string} [btnSequence] - The button press sequence.*/
/* @param {number} [mBtn] - The mouse button to click. Use definitions of the ble_hid_combo module.*/
/**/
function mouseClickAction(btnSequence, mBtn) {
  print("Button pressed: "+btnSequence);
  LED1.set();

  try{
    int.clickButton(mBtn);
  } catch(err) {
    console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
  }
  LED1.reset();
}

/**/
/* Callback function for mouse movement action.*/
/* @param {string} [btnSequence] - The button press sequence.*/
/* @param {number} [dx] - The relative mouse movement in x direction.*/
/* @param {number} [dy] - The relative mouse movement in y direction.*/
/**/
function mouseMoveAction(btnSequence, dx, dy) {
  print("Button pressed: "+btnSequence);
  LED2.set();

  try{
    int.moveMouse(dx, dy);
  } catch(err) {
    console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
  }
  LED2.reset();
}

/**/
/* Callback function for keyboard action.*/
/* @param {string} [btnSequence] - The button press sequence.*/
/* @param {number} [keyCode] - The keycode to tap.*/
/**/
function tapKeyAction(btnSequence, keyCode) {
  print("Button pressed: "+btnSequence);
  LED3.set();

  try{
    int.tapKey(keyCode);
  }catch (err) {
    console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
  }
  LED3.reset();
}

/**/
/* Resets / Releases all mouse, keyboard events.*/
/**/
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

//Import module SWButton: expected to be on internal Storage with the name 'SWButton'.
var SWBtn = require("SWButton");

//Instantiate SWBtn object, which handles button press sequence detection and add
//callback handler, which dispatches the sequence pattern and executes the associated action.
var mySWBtn = new SWBtn(function(k){
  console.log("BTN1 detected " + k); // log detected button press sequence ...
  if (functions[k]) { functions[k](); }; // ...dispatch if defined
},BTN1,false);

//Configure timings for button press detection
//Note: The B: must already start in the first line, otherwise there is a syntax error.
SWBtn.prototype.C = { B: 20,  // B - integer - debounce [ms]
  L: 1,   // L - float   - min Long press [s]
  P: 150, // P - integer - min Pause [ms]
  D: 0   // D - integer - delay of fnc function invocation [ms]
};

//Define callbacks for button press sequence:
//S: Short press
//SS: Double short press
//L: Long press
//SL: Short - Long press,...

var functions = { S:   function(){ mouseClickAction("S",int.BUTTON.LEFT,1); },
 SS:  function(){ mouseMoveAction("SS",5,10); },
 L:  function(){ tapKeyAction("L",44) }
};

//Reset all LEDs just in case and to save energy.
LED1.reset();
LED2.reset();
LED3.reset();