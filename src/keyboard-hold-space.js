var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });

function btnPressed() {
  //Space: code 44
  int.keyDown(44);
}

function btnReleased(){
  int.keyUp(int.KEY.ALL);
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:50});