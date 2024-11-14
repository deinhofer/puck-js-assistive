//This example code is based on the following forum post: 
//https://forum.espruino.com/conversations/398337/?cachebuster=UG0NKB


// Turn the accelerometer on, pulse the green LED to show we've connected
var hz = 52;

Puck.accelOn(hz);
digitalPulse(LED2, 1, 500);

// Turn off the accelerometer and battery reporting when we disconnect. Blink red LED.
NRF.on('disconnect', function() {
  Puck.accelOff();
  digitalPulse(LED1, 1, 500);
});

// When we get new accelerometer readings, send them via BLE
Puck.on('accel', function(a) {
  var d = [
    "A",
    Math.round(a["acc"]["x"] * 100),
    Math.round(a["acc"]["y"] * 100),
    Math.round(a["acc"]["z"] * 100),
    Math.round(a["gyro"]["x"] * 100),
    Math.round(a["gyro"]["y"] * 100),
    Math.round(a["gyro"]["z"] * 100)
  ];
  Bluetooth.println(d.join(","));
});

var Vec3 = require("Vec3");
var magMin = new Vec3();
var magMax = new Vec3();
Puck.magOn(hz);

Puck.on('mag', function(xyz) {
  //console.log(xyz); // {x:..., y:..., z:...}
  var v = new Vec3(xyz);
  magMin = magMin.min(v);
  magMax = magMax.max(v);
  var diff = v.sub(magMax.add(magMin).mul(0.5));
  //console.log(diff);
  // ... diff contains the value you want
  var m = ["M", Math.round(diff.x * 100), Math.round(diff.y * 100), Math.round(diff.z * 100)];
  //console.log(m);
  Bluetooth.println(m.join(","));
});