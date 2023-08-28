var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });

function btnPressed() {
  //int.scroll(10);         // Scroll down
  //int.moveMouse(30, 0);   // Move mouse horizontally
  //int.tapKey(int.KEY.Y);  // Also press the Y key
  //NRF.sendHIDReport([0,0,44], function() {
  //  NRF.sendHIDReport([0,0,0]);
  //});
  int.holdButton(int.BUTTON.LEFT);
  //int.keyDown(44);
}

function btnReleased(){
  //int.keyUp(int.KEY.ALL);
  int.releaseButton(int.BUTTON.ALL);
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:50});