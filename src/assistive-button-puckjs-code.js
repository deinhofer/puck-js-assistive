LED2.set();
var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });
//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

let modeIndex=0;
modeValue=[int.BUTTON.LEFT, 44];

if(modeIndex==0) {
  NRF.setAdvertising([
  {}, // include original Advertising packet
  [   // second packet containing 'appearance'
  2, 1, 6,  // standard Bluetooth flags
  3,3,0x12,0x18, // HID Service
  //3,0x19,0xc1,0x03 // Appearance: 0x03C1 Keyboard
  3, 0x19, 0xc2,0x03 // : 0x03C2 Mouse
    // 0xc3,0x03 : 0x03C3 Joystick
  ]
  ]);
} else if(modeIndex==1) {
  NRF.setAdvertising([
  {}, // include original Advertising packet
  [   // second packet containing 'appearance'
  2, 1, 6,  // standard Bluetooth flags
  3,3,0x12,0x18, // HID Service
  3,0x19,0xc1,0x03 // Appearance: 0x03C1 Keyboard
  //0xc2,0x03 : 0x03C2 //Mouse
    // 0xc3,0x03 : 0x03C3 Joystick
  ]
  ]);
}


function btnPressed() {
  print("Button pressed");
  LED3.set();
  if(modeIndex==0) {
    try{
      int.holdButton(modeValue[modeIndex]);
    } catch(err) {
      console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
    }
  } else if(modeIndex==1) {
    try{
      int.keyDown(modeValue[modeIndex]);
    }catch (err) {
      console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
    }
  }
  }

function btnReleased(){
  print("Button released");
  LED3.reset();
  //NOTE: When we are in keyboard mode, we must not try to release the mouse button, otherwise the HID stack
  //is in an invalid state and the program hangs.
  if(modeIndex==0) {
    try{
      int.releaseButton(int.BUTTON.ALL);
    }catch(err) {
      console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
    }
  } else if(modeIndex==1) {
    try {
      int.keyUp(int.KEY.ALL);
    }catch (err) {
      console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
    }
  }
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:50});

//Serial1.setConsole(true);

LED1.reset();
LED2.reset();
LED3.reset();