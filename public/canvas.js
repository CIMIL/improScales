// retriving waveform dimensions
let w;
let h;
let canvas, canvasCtx;

function printChordsLines() {

  chordsArray.forEach( function(chord, i) {
    const margin = 15;
    // calculate chord x position in px given the time in seconds
    const x = Math.round(ticksArray[i] * w / wavesurfer.getDuration());

    canvasCtx.beginPath();
    canvasCtx.fillText(chord, x, 10);
    canvasCtx.moveTo(x, margin);
    canvasCtx.lineTo(x, wavesurfer.getHeight()-margin);
    canvasCtx.stroke();
  });
}

function clearCanvas() {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

function createCanvas() {
  w = wavesurfer.drawer.container.clientWidth;
  h = wavesurfer.getHeight();

  // using device pixel ratio to compute canvas dimensions
  let ratio = window.devicePixelRatio;
  canvas = document.querySelector('#chordsCanva');
  canvas.width = w * ratio;
  canvas.height = h * ratio;
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";

  // canvas options, styles..
  canvasCtx = canvas.getContext('2d');
  canvasCtx.scale(ratio, ratio);
  canvasCtx.strokeStyle = 'white';
  canvasCtx.fillStyle = 'white';
  canvasCtx.font = '15px Calibri';
  canvasCtx.textAlign = 'center';
}
 
// DOCUMENT READY
$(function(){
  createCanvas();
});
