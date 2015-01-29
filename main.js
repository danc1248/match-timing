// http://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
var BoxMuller = function(mu, sigma){
  this.previous = null;

  // X = Z * sigma + mu;
  this.mu = mu; // mean
  this.sigma = sigma; // standard deviation
}

// not positive this is implemented correctly:
BoxMuller.prototype.getNumber = function(){
  if(this.previous !== null){
    this.previous = null;
    var x2 = this.previous * this.sigma + this.mu;
    return x2;
  }

  var u1 = Math.random(),
      u2 = Math.random();

  var c = Math.sqrt( -2 * Math.log(u1) );
  var z1 = c * Math.cos( 2 * Math.PI * u2 );
  var z2 = c * Math.sin( 2 * Math.PI * u2 );

  this.previous = z2;

  var x1 = z1 * this.sigma + this.mu;

  return x1;
}

var C = function(id, time, sd){
  this.id = id;
  this.BoxMuller = new BoxMuller(time, sd);
}

C.prototype.getTime = function(){
  return this.BoxMuller.getNumber() * 10;
}

var Keeper = function(tick, cb){
  this.queue = [];
  this.active = 0;
  this.gogogo = true;
  this.tick = tick;
  this.cb = cb;
}

Keeper.prototype.log = function(c1, c2, log){
  if(c1.id === 0){
    console.log(c2.id+"\t"+log);
  }
  else if(c2.id === 0){
    console.log(c1.id+"\t"+log);
  }
}

Keeper.prototype.match = function(c1, c2){
  var self = this;
  self.active += 1;
  self.tick(c1, c2);

  var t1 = c1.getTime(),
      t2 = c2.getTime();

  var time = Math.min(t1, t2);
  self.log(c1, c2, "start\t"+time);
  setTimeout(function(){
    self.complete(c1, c2);
  }, time);
}

Keeper.prototype.complete = function(c1, c2){
  var self = this;
  self.active--;
  if(self.gogogo === false){
    if(self.active === 0){
      self.cb();
    }
    return;
  }
  var len = self.queue.length;
  // self.log(c1, c2, "stop\t"+len);
  if(len === 0){
    self.queue.push(c1, c2);
  }
  else if(len === 1){
    var d1 = self.queue.pop();
    self.queue.push(c1);
    self.match(c2, d1);
  }
  else {
    var e1 = self.queue.pop(),
        e2 = self.queue.pop();

    self.match(c2, e1);
    self.match(e2, c1);
  }
}

Keeper.prototype.start = function(){
  var self = this;
  console.log(self.queue);
  var len = self.queue.length;
  for(var a=0; a<len / 2; a++){
    setTimeout(function(){
      if(self.queue.length < 2){
        return;
      }
      var c1 = self.queue.pop();
      var c2 = self.queue.pop();

      self.match(c1, c2);
    }, Math.random() * 150);
  }
}

var stats = {
  'H' : { count: 0, time: 5 },
  'D' : { count: 0, time: 7 },
  'X': { count:0, time: 9 },
  'War' : { count: 0, time: 11 },
  'Pl' : { count: 0, time: 13 },
}

function tick(c1, c2){
  if(c1.id === 0){
    stats[c2.id].count += 1;
  }
  else if(c2.id === 0){
    stats[c1.id].count += 1;
  }
}

// init
var keeper = new Keeper(tick, function(){
  console.log(stats);
});
var queue = [];
queue.push(new C(0, 100, 0));
for(var a=0; a<50; a++){
  for(var key in stats) {
    if(stats.hasOwnProperty(key)){
      queue.push(new C(key, stats[key].time, 2));
    }
  }
}

// http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};
keeper.queue = shuffle(queue);
keeper.start();

setTimeout(function(){
  keeper.gogogo = false;
  console.log("finsihed, waiting for matches to flush")
}, 30000);
