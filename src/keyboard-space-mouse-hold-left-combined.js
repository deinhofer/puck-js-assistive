var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });

let modeIndex=1;
const modeValue=[int.BUTTON.LEFT, 44];

function btnPressed() {
  //int.scroll(10);         // Scroll down
  //int.moveMouse(30, 0);   // Move mouse horizontally
  //int.tapKey(int.KEY.Y);  // Also press the Y key
  //NRF.sendHIDReport([0,0,44], function() {
  //  NRF.sendHIDReport([0,0,0]);
  //});
  if(modeIndex==0) {
    int.holdButton(modeValue[modeIndex]);
  } else if(modeIndex==1) {
    int.keyDown(modeValue[modeIndex]);
  }
}

function btnReleased(){
  int.releaseButton(int.BUTTON.ALL, function() {
    int.keyUp(int.KEY.ALL);
  });
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:50});