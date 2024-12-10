LED2.set();
var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });
//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

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

function btnPressed() {
  print("Button pressed");
  LED3.set();
  //int.tapKey(44);
  int.keyDown(int.KEY.A);
}

function btnReleased() {
  print("Button released");
  LED3.reset();
  //int.tapKey(44);
  int.keyUp(int.KEY.A);
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:50});

Serial1.setConsole(true);
LED2.reset();