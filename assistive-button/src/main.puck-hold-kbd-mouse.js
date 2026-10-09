//Turn off echo to improve download/execution speed
echo(false);

LED2.set();

// BEGIN ----- Init BLE HID -----

// when deployed from espruino.com/ide you can also use ble_hid_combo, as the IDE 
// automatically deploys dependencies
//var int = require("ble_hid_combo");
var int = require("hid_");

//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

// Configure the puck.js as a Bluetooth HID device
NRF.setServices(undefined, { hid: int.report });

//NRF.setAdvertising must be called additionally in case we are connected to Windows 11
NRF.setAdvertising([
  {}, // include original Advertising packet
  [   // second packet containing 'appearance'
    2, 1, 6,  // standard Bluetooth flags
    3, 3, 0x12, 0x18, // HID Service
    3, 0x19, 0xc0, 0x03 // : 0xc0 Generic HID, 0xC1 Keyboard, 0xC2 Mouse, 0xc3 Joystick
  ]
]);

// END ----- Init BLE HID -----

let modeIndex = 1;
const modeValue = [int.BUTTON.LEFT, 44, 40];
let changeMode = 0;
const modePulsePattern = [[200], [200, 200, 200], [200, 200, 200, 200, 200]]; // pattern for LED3 pulse when changing mode

//Puck.accelOn(); // default is 12.5Hz, with gyro
Puck.accelOn(1.6); //for 1.6Hz low power, without gyro
Puck.on('accel', function (a) {
  //console.log(a);
  if (a.acc.z < -3000) {
    changeMode = 1;
  } else {
    changeMode = 0;
  }
});

function btnPressed() {
  if (changeMode == 0) {
    try {
      if (modeIndex == 0) {
        int.holdButton(modeValue[modeIndex]);
      } else {
        int.keyDown(modeValue[modeIndex]);
      }
    } catch (err) {
      //digitalPulse(LED1, 1, 200);
      console.log("Cannot send function, connected as HID device? Reason: " + err.message);
    }
  } else {
    modeIndex = modeIndex + 1;
    if (modeIndex == modeValue.length) {
      modeIndex = 0;
    }
    console.log("modeIndex changed: " + modeIndex);
    digitalPulse(LED2, 1, modePulsePattern[modeIndex]);
    //LED2.reset();
  }
}

function btnReleased() {
  try {
    int.releaseButton(int.BUTTON.ALL, function () {
      int.keyUp(int.KEY.ALL);
    });
  } catch (err) {
    //digitalPulse(LED1, 1, 200);
    console.log("Cannot release button, connected as HID device? Reason: " + err.message);
  }
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, { edge: "rising", repeat: true, debounce: 50 });
setWatch(btnReleased, BTN, { edge: "falling", repeat: true, debounce: 50 });

// Handle BLE connection events
NRF.on('connect', function (addr) {
  console.log("Connected to:", addr);
  // Enable accelerometer with default frequency (26Hz) only when connected
  digitalPulse(LED2, 1, 500);
});

// Handle BLE disconnection events
NRF.on('disconnect', function (reason) {
  console.log("Disconnected, reason:", reason);
  // Turn off accelerometer to save power when not connected
  digitalPulse(LED1, 1, 500);
  NRF.setConnectionInterval(500);
});

//Reset all LEDs just in case and to save energy.
LED1.reset();
LED2.reset();
LED3.reset();
echo(true);