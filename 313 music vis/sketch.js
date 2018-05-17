var FAR_BOUND = -8000;
var NEAR_BOUND = 800;
var STEP_BACK = NEAR_BOUND - FAR_BOUND;


var lr = 0, lg = 0, lb = 40; //low color
var hr = 0, hg = 0, hb = 0; //high color

var sr = 255, sg = 255, sb = 255; //high color smoothing
var s = .7; //smoothing constant (0 < s < 1)
var reactivity = 6;

var shape = true;
var timer = 0;

var actx = new AudioContext();
var audio = new Audio("songe.mp3");
var audioSrc = actx.createMediaElementSource(audio);
var analyser = actx.createAnalyser();
audioSrc.connect(analyser);
audioSrc.connect(actx.destination);
var fData = new Uint8Array(analyser.frequencyBinCount);


var rings = new Array();
for(var z = FAR_BOUND; z <= NEAR_BOUND; z += 200){
	rings.push(new Ring(15, 100, 30, z));
}

function setup(){
	createCanvas(1920, 1080, WEBGL);
  	noStroke();

  	audio.play();
}



function draw(){
	analyser.getByteFrequencyData(fData);
	var lvl = getmean(fData, 10);
	var max = Math.pow(255, reactivity);
	lvl = Math.pow(lvl, reactivity);

	hr = hr*s + sr*(1-s);
	hg = hg*s + sg*(1-s);
	hb = hb*s + sb*(1-s);

	timer = timer - 1 > 0 ? timer - 1 : 0;

	background(0);
	pointLight(map(lvl, 0, max, lr, hr),
			   map(lvl, 0, max, lg, hg), 
			   map(lvl, 0, max, lb, hb), 0, 0, map(lvl, 0, max, -500, 2500));
	  
	specularMaterial(255);
	for(var i = 0; i < rings.length; i++){
	  push();
	  rings[i].update(lvl, max, shape);
	  pop();
	}
}

function Ring(detail, radius, size, z){
	this.z = z;
	this.zvel = 0;

	this.rotation = Math.random()*Math.PI;
	this.rspeed = Math.random()*Math.PI/40 - Math.PI/80;
	this.rangle = 2*Math.PI/detail;

	this.update = function(lvl, max, shape){
		this.zvel = map(lvl, 0, max, 0, 150);
		this.z += this.zvel;
		if(this.z > NEAR_BOUND){
			this.z -= STEP_BACK;
			this.rspeed = Math.random()*Math.PI/40 - Math.PI/80;
		}
		this.rotation += this.rspeed;

		rotateZ(this.rotation);
		translate(0, 0, this.z);
		for(var i = 0; i < detail; i++){
			rotateZ(this.rangle);
			push();
			translate(radius, 0, 0);
			if(shape)
				box(size, size, size);
			else
				sphere(size*2);
			pop();
		}
	}
}

function getmean(arr, num){
	var sum = 0;
	var i;
	for(i = 0; i < num && i < arr.length; i++){
		sum += arr[i];
	}
	return sum/i;
}



var previousFrame = null;

var controllerOptions = {};

Leap.loop(controllerOptions, function(frame) {
  if(frame.hands.length == 2){
  	var d = .25 * Math.sqrt(Math.pow(frame.hands[0].palmPosition[0] - frame.hands[1].palmPosition[0], 2) + 
  					  Math.pow(frame.hands[0].palmPosition[1] - frame.hands[1].palmPosition[1], 2) + 
  					  Math.pow(frame.hands[0].palmPosition[2] - frame.hands[1].palmPosition[2], 2));
  	var left, right;
  	if(frame.hands[0].type == "right"){
  		right = 0;
  		left = 1;
  	}
  	else{
  		left = 0;
  		right = 1;
  	}

  	var rfingers = right*5;
  	var lfingers = left*5;

  	if(	!frame.pointables[rfingers].extended && 
  		frame.pointables[rfingers + 1].extended && 
  		!frame.pointables[rfingers + 2].extended && 
  		!frame.pointables[rfingers + 3].extended && 
  	  	!frame.pointables[rfingers + 4].extended){
  		sr = Math.abs(frame.hands[left].palmPosition[0] - frame.hands[right].palmPosition[0]);
  		sg = Math.abs(frame.hands[left].palmPosition[1] - frame.hands[right].palmPosition[1]);
  		sb = Math.abs(frame.hands[left].palmPosition[2] - frame.hands[right].palmPosition[2]);
  	}

  	if(	frame.pointables[rfingers].extended && 
  		frame.pointables[rfingers + 1].extended && 
  		!frame.pointables[rfingers + 2].extended && 
  		!frame.pointables[rfingers + 3].extended && 
  	  	!frame.pointables[rfingers + 4].extended){
  		reactivity = d/10 + 2;
  	}

  	if(	timer == 0 &&
  		frame.hands[right].pinchStrength == 1 &&
  		!frame.pointables[lfingers].extended && 
  		frame.pointables[lfingers + 1].extended && 
  		frame.pointables[lfingers + 2].extended && 
  		frame.pointables[lfingers + 3].extended && 
  	  	!frame.pointables[lfingers + 4].extended){
  		shape = !shape;
  		timer = 50;
  	}
  }
})
