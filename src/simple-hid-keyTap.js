var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });

function btnPressed() {
  //int.scroll(10);         // Scroll down
  //int.moveMouse(30, 0);   // Move mouse horizontally
  int.tapKey(int.KEY.Y);  // Also press the Y key
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});