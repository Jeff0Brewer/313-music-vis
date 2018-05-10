var FAR_BOUND = -8000;
var NEAR_BOUND = 800;
var STEP_BACK = NEAR_BOUND - FAR_BOUND;

var reactivity = 6;

var lr = 0, lg = 0, lb = 40;
var hr = 200, hg = 100, hb = 255;
var ambient = 0;

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


	background(0);
	ambientLight(ambient, ambient, ambient);
	pointLight(map(lvl, 0, max, lr, hr),
			   map(lvl, 0, max, lg, hg), 
			   map(lvl, 0, max, lb, hb), 0, 0, map(lvl, 0, max, -500, 2500));
	  
	specularMaterial(255);
	for(var i = 0; i < rings.length; i++){
	  push();
	  rings[i].update(lvl, max);
	  pop();
	}
}

function Ring(detail, radius, size, z){
	this.z = z;
	this.zvel = 0;

	this.rotation = Math.random()*Math.PI;
	this.rspeed = Math.random()*Math.PI/40 - Math.PI/80;
	this.rangle = 2*Math.PI/detail;

	this.update = function(lvl, max){
		this.zvel = map(lvl, 0, max, 0, 120);
		this.z += this.zvel;
		if(this.z > NEAR_BOUND)
			this.z -= STEP_BACK;
		this.rotation += this.rspeed;

		rotateZ(this.rotation);
		translate(0, 0, this.z);
		for(var i = 0; i < detail; i++){
			rotateZ(this.rangle);
			push();
			translate(radius, 0, 0);
			box(size, size, size);
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
var paused = false;

var controllerOptions = {};

Leap.loop(controllerOptions, function(frame) {
  if (paused) {
    return;
  }

  if(frame.hands.length > 0 && frame.pointables.length > 0){
  	if(frame.pointables[2].extended)
  		hr = map(frame.hands[0].palmPosition[2], 0, 100, 0, 255);
  	if(frame.pointables[1].extended)
  		hg = map(frame.hands[0].palmPosition[2], 0, 100, 0, 255);
  	if(frame.pointables[0].extended)
  		hb = map(frame.hands[0].palmPosition[2], 0, 100, 0, 255);
  }

  previousFrame = frame;
})