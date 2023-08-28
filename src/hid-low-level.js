report = new Uint8Array([
  ]);
NRF.setServices(undefined, { hid : report });

function btnPressed() {
  //Space: code 44
  NRF.sendHIDReport([0,0,44], function() {
  });
}

function btnReleased(){
  //int.keyUp(int.KEY.ALL);
  NRF.sendHIDReport([0,0,44])
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:10});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:10});