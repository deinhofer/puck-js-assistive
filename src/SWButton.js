//Ths is an example code from a forum post: //https://forum.espruino.com/conversations/1781/?offset=25#comment17161364


// SWButtonInline.js
// 2022.0410 - (c) allObjects;
var  SWBtn = // inline module emulation of  // var  SWBtn = require("SWButton"); 
(function(){ var exports = {};
// module begin:
var SWBtn = function(f,b,e) {
  this.f = (f) ? f : function(){};
  this.b = (b) ? b : BTN1;
  this.t = null;
  this.k = null;
  this.w = null;
  this.enable(e);
 };
SWBtn.prototype.C = // Config shared by all instances of SWBtn:
  { B: 20 // debounce [ms]
  , L: 0.250 // min Long press [s]
  , P: 220 // min Pause [ms]
  , D: 10 // delay of fnc function invocation [ms]
  };
SWBtn.prototype.enable = function(e) {
  if (e === undefined || e) {
    if (!this.w) {
      this.d = false;
      this.k = "";
      var _this = this;
      this.w = setWatch( function(e){ _this.c(e); }, this.b
                       , { repeat:true
                       , edge:"both" // <--- required for built-in buttons!
                       , debounce:_this.C.B } );
    }
  } else {
    if (this.w) { 
      this.d = true;
      this.w = clearWatch(this.w);
      if (this.t) this.t = clearTimeout(this.t);
    }
  }
 };
SWBtn.prototype.c = function(e){ // change of state - called by set watch
  if (e.state) {
    if (this.t) this.t = clearTimeout(this.t);
  } else {
    this.k = this.k + ((e.time - e.lastTime < this.C.L) ? "S" :"L");
    var _this = this;
    this.t = setTimeout(function(){ _this.e(); }, this.C.P);
  }
 };
SWBtn.prototype.e = function() {
  this.t = null;
  var _k = this.k;
  if (_k.length > 0) {
    this.k = "";
    var _this = this;
    setTimeout(function(){ _this.f(_k); },this.C.D);
  }
 };
exports = SWBtn;
// module end
return exports;
})(); // :in-line module emulation end
var functs = // function names match Short/Long key press pattern
{ S:  function(){ LED1.toggle(); }
, L:  function(){ LED2.toggle(); }
, SL: function(){ LED1.set();    }
, SS: function(){ LED1.reset();  }
, LL: function(){ LED2.set();    }
, LS: function(){ LED2.reset();  }
};
var mySWBtn = new SWBtn(function(k){
    console.log("BTN1 detected " + k); // log detected key pattern and...
    if (functs[k]) { functs[k](); } // ...dispatch if defined
  },BTN1,false); // set it up disabled
function onInit() {
  mySWBtn.enable();
}
setTimeout(onInit,999); // for dev only; remove before upload for save()