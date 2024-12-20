LED2.set();
require("Storage").write("hid_","function l(a){for(var b=0;b<c.length;b++){if(c[b]==a)return;if(0==c[b]){c[b]=a;return}}for(b=0;b<c.length-1;b++)c[b]=c[b+1];c[c.length-1]=a}function m(a){if(-1==a)c.fill(0);else for(var b=0;b<c.length;b++)c[b]==a&&(c[b]=0)}exports.report=new Uint8Array([5,1,9,2,161,1,133,1,9,1,161,0,5,9,25,1,41,5,21,0,37,1,149,5,117,1,129,2,149,1,117,3,129,3,5,1,9,48,9,49,9,56,21,129,37,127,117,8,149,3,129,6,5,12,10,56,2,21,129,37,127,117,8,149,1,129,6,192,192,5,1,9,6,161,1,133,2,5,7,25,224,\n41,231,21,0,37,1,117,1,149,8,129,2,117,8,149,1,129,1,25,0,41,115,21,0,37,115,149,5,117,8,129,0,192]);exports.MODIFY={CTRL:1,SHIFT:2,ALT:4,GUI:8,LEFT_CTRL:1,LEFT_SHIFT:2,LEFT_ALT:4,LEFT_GUI:8,RIGHT_CTRL:16,RIGHT_SHIFT:32,RIGHT_ALT:64,RIGHT_GUI:128};exports.KEY={A:4,B:5,C:6,D:7,E:8,F:9,G:10,H:11,I:12,J:13,K:14,L:15,M:16,N:17,O:18,P:19,Q:20,R:21,S:22,T:23,U:24,V:25,W:26,X:27,Y:28,Z:29,1:30,2:31,3:32,4:33,5:34,6:35,7:36,8:37,9:38,0:39,ENTER:40,\"\\n\":40,ESC:41,BACKSPACE:42,\"\\t\":43,\" \":44,\"-\":45,\"=\":46,\n\"[\":47,\"]\":48,\"\\\\\":49,NUMBER:50,\";\":51,\"'\":52,\"~\":53,\",\":54,\".\":55,\"/\":56,CAPS_LOCK:57,F1:58,F2:59,F3:60,F4:61,F5:62,F6:63,F7:64,F8:65,F9:66,F10:67,F11:68,F12:69,PRINTSCREEN:70,SCROLL_LOCK:71,PAUSE:72,INSERT:73,HOME:74,PAGE_UP:75,DELETE:76,END:77,PAGE_DOWN:78,RIGHT:79,LEFT:80,DOWN:81,UP:82,NUM_LOCK:83,PAD_SLASH:84,PAD_ASTERIX:85,PAD_MINUS:86,PAD_PLUS:87,PAD_ENTER:88,PAD_1:89,PAD_2:90,PAD_3:91,PAD_4:92,PAD_5:93,PAD_6:94,PAD_7:95,PAD_8:96,PAD_9:97,PAD_0:98,PAD_PERIOD:99,ALL:-1};var e={NONE:0,LEFT:1,\nRIGHT:2,MIDDLE:4,BACK:8,FORWARD:16};e.ALL=e.LEFT|e.RIGHT|e.MIDDLE|e.BACK|e.FORWARD;exports.BUTTON=e;var f=0,c=new Uint8Array(5);exports.getHoldingButtons=function(){return f};exports.moveMouse=function(a,b,d,g,h,k){d||(d=f);g||(g=0);h||(h=0);NRF.sendHIDReport([1,d,a,b,g,h,0,0],function(){k&&k()})};exports.scroll=function(a,b,d){exports.moveMouse(0,0,f,a,b,d)};exports.holdButton=function(a,b){f|=a;exports.moveMouse(0,0,f,0,0,b)};exports.releaseButton=function(a,b){f&=~a;exports.moveMouse(0,0,f,0,0,\nb)};exports.clickButton=function(a,b){exports.holdButton(a,()=>exports.releaseButton(a,b))};exports.getHoldingKeys=function(){return c};exports.updateModifiers=function(a,b){a||(a=0);NRF.sendHIDReport([2,a,0,c[0],c[1],c[2],c[3],c[4]],function(){b&&b()})};exports.keyDown=function(a,b,d){Array.isArray(a)||(a=[a]);a.forEach(l);exports.updateModifiers(b,d)};exports.keyUp=function(a,b){Array.isArray(a)||(a=[a]);a.forEach(m);exports.updateModifiers(0,b)};exports.tapKey=function(a,b,d){exports.keyDown(a,\nb,()=>exports.keyUp(a,d))}");

var int = require("hid_");

NRF.setServices(undefined, { hid : int.report });
//lowering connection interval reduces bluetooth speed but also reduces power consumption from 665 to 50 (see E.getPowerUsage())
NRF.setConnectionInterval(100);

let modeIndex=0;
modeValue=[int.BUTTON.LEFT, 44];

if(modeIndex==0) {
  NRF.setAdvertising([
  {}, // include original Advertising packet
  [   // second packet containing 'appearance'
  2, 1, 6,  // standard Bluetooth flags
  3,3,0x12,0x18, // HID Service
  //3,0x19,0xc1,0x03 // Appearance: 0x03C1 Keyboard
  3, 0x19, 0xc2,0x03 // : 0x03C2 Mouse
    // 0xc3,0x03 : 0x03C3 Joystick
  ]
  ]);
} else if(modeIndex==1) {
  NRF.setAdvertising([
  {}, // include original Advertising packet
  [   // second packet containing 'appearance'
  2, 1, 6,  // standard Bluetooth flags
  3,3,0x12,0x18, // HID Service
  3,0x19,0xc1,0x03 // Appearance: 0x03C1 Keyboard
  //0xc2,0x03 : 0x03C2 //Mouse
    // 0xc3,0x03 : 0x03C3 Joystick
  ]
  ]);
}


function btnPressed() {
  print("Button pressed");
  LED3.set();
  if(modeIndex==0) {
    try{
      int.holdButton(modeValue[modeIndex]);
    } catch(err) {
      console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
    }
  } else if(modeIndex==1) {
    try{
      int.keyDown(modeValue[modeIndex]);
    }catch (err) {
      console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
    }
  }
  }

function btnReleased(){
  print("Button released");
  LED3.reset();
  //NOTE: When we are in keyboard mode, we must not try to release the mouse button, otherwise the HID stack
  //is in an invalid state and the program hangs.
  if(modeIndex==0) {
    try{
      int.releaseButton(int.BUTTON.ALL);
    }catch(err) {
      console.log("Cannot send mouse function, connected as HID device? Reason: "+err.message);
    }
  } else if(modeIndex==1) {
    try {
      int.keyUp(int.KEY.ALL);
    }catch (err) {
      console.log("Cannot send keyboard function, connected as HID device? Reason: "+err.message);
    }
  }
}

// trigger btnPressed whenever the button is pressed
setWatch(btnPressed, BTN, {edge:"rising",repeat:true,debounce:50});
setWatch(btnReleased, BTN, {edge:"falling",repeat:true,debounce:50});