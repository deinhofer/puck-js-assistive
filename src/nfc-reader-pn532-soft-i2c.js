var i2c=new I2C();
i2c.setup({scl:D28,sda:D29});

var nfc = require("PN532").connect(i2c);
print(nfc.getVersion());
nfc.SAMConfig(); // start listening
setInterval(function() {
 nfc.findCards(function(card) {
  print("Found card "+card);
  card = JSON.stringify(card);
  var leds = [LED1,LED2,LED3];
  if (card=="[147,239,211,128]") digitalWrite(leds,1);
  if (card=="[249,192,235,164]") digitalWrite(leds,2);
  if (card=="[4,99,129,114,72,52,128]") digitalWrite(leds,4);
 });
}, 1000);