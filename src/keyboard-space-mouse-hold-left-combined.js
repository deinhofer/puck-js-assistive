var int = require("ble_hid_combo");
NRF.setServices(undefined, { hid : int.report });
//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

let modeIndex=1;
const modeValue=[int.BUTTON.LEFT, 44, 40];
let changeMode=0;

//Puck.accelOn(); // default is 12.5Hz, with gyro
Puck.accelOn(1.6); //for 1.6Hz low power, without gyro
Puck.on('accel', function(a) {
  //console.log(a);
  if(a.acc.z < -3000) {
    changeMode=1;
  } else {
    changeMode=0;
  }
});

function btnPressed() { 
    if(changeMode==0) {
      if(modeIndex==0) {
        int.holdButton(modeValue[modeIndex]);
      } else {
        int.keyDown(modeValue[modeIndex]);
      }
    } else {
      modeIndex=modeIndex+1;
      if(modeIndex==modeValue.length) {
        modeIndex=0;
      }
      console.log("modeIndex changed: "+modeIndex);
      digitalPulse(LED1,1,200*(modeIndex+1));
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