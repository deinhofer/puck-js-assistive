var kb = require("ble_hid_keyboard");
NRF.setServices(undefined, { hid : kb.report });

function btnPressed() {
  kb.tap(44, 0, function() {
  });
}

function btnReleased() {
}
// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:10});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:10});