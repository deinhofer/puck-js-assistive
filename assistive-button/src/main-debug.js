LED2.set();
console.log("Set LED2");

//Reset all LEDs just in case and to save energy.
setTimeout(function () {
  console.log("Reset all LEDs");
  LED1.reset();
  LED2.reset();
  LED3.reset();
}, 1500);

//Serial1.setConsole(true);