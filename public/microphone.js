let mic;
// global var getUserMedia mic stream
let gumStream;


// record native microphone input and do further audio processing on each audio buffer using the given callback functions
function startMicRecordStream(audioCtx, bufferSize, onProcessCallback, btnCallback) {

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("Initializing microphone audio...");
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    .then(function(stream) {
      gumStream = stream;
      if (gumStream.active) {
        console.log(
          "Audio context sample rate = " + audioCtx.sampleRate
        );
        mic = audioCtx.createMediaStreamSource(stream);
        // We need the buffer size that is a power of two
        if (bufferSize % 2 != 0 || bufferSize < 4096) {
          throw "Choose a buffer size that is a power of two and greater than 4096";
        }
        // In most platforms where the sample rate is 44.1 kHz or 48 kHz,
        // and the default bufferSize will be 4096, giving 10-12 updates/sec.
        console.log("Buffer size = " + bufferSize);
        if (audioCtx.state == "suspended") {
          audioCtx.resume();
        }
        scriptNode = audioCtx.createScriptProcessor(bufferSize, 1, 1);
        // onprocess callback (here we can use essentia.js algos)
        scriptNode.onaudioprocess = onProcessCallback;

        mic.connect(scriptNode);
        scriptNode.connect(audioCtx.destination);

        if (btnCallback) {
          btnCallback();
        }
      } else {
        throw "Mic stream not active";
      }})
    
    .catch( function(message) {
      throw "Could not access microphone - " + message;
    });
  } else {
    throw "Could not access microphone - getUserMedia not available";
  }
}

function stopMicRecordStream() {
  let recording = $('.red.mic').hasClass("recording");
  if (recording) {
    $('.mic.ready.icons').show();
    $('.mic.stop.icon').hide();
    silenceHideNotes();
    $('#currentNoteDiv').hide();

    console.log("Stopped recording ...");
    // stop mic stream
    gumStream.getAudioTracks().forEach(function(track) {
      track.stop();
    });
    $('.red.mic').removeClass("recording");

    audioCtx.suspend().then(() => {
      mic.disconnect();
      scriptNode.disconnect();

      mic, scriptNode = null;
    });
  }
}

let noteIdBuffer = [];
const noteBufferSize = 3;
let silence = 0;
const silenceThreshold = 20;

// ScriptNodeProcessor callback function to extract pitchyin feature using essentia.js
function onRecordFeatureExtractor(event) {

  let audioBuffer = event.inputBuffer.getChannelData(0);
  let audioVectorBuffer = essentiaExtractor.arrayToVector(audioBuffer);

  // compute RMS for thresholding:
  const rms = essentiaExtractor.RMS(audioVectorBuffer).rms;
  // console.info(rms);
  if (rms >= 0.05) {
    if (silence) {
      silence = 0;
    }
    const prevNoteId = mostFrequent(noteIdBuffer);

    // compute hpcp for overlapping frames of audio
    const hpcp = essentiaExtractor.hpcpExtractor(audioBuffer);

    const scaledHPCP = hpcp.map(i => 100*Math.tanh(Math.pow(i*0.5, 2)));
    // console.log(`scaled: ${scaledHPCP}`);
    noteIdBuffer.push( indexOfMax(scaledHPCP) );

    if (noteIdBuffer.length === noteBufferSize) {

      const currNoteId = mostFrequent(noteIdBuffer);

      if (currNoteId != prevNoteId) {
        if (jQuery.isEmptyObject(session)) { // if there isn't a song loaded, print just the current note
          printGenericNote(currNoteId);
        } else {
          ++session.statsArray[currNoteId];
          if (session.scaleIdArray.includes(currNoteId)) {
            printCorrectNote(currNoteId);
          } else {
            printOutOfScaleNote(currNoteId);
          }
        }
      }
      noteIdBuffer.shift();

    } else while (noteIdBuffer.length >= noteBufferSize) {
      noteIdBuffer.shift();
    }

    // console.log(currentNote);
  } else {
    if(silence >= 0 && ++silence > silenceThreshold) {
      $('#currentNoteHeader').css({'color': 'black'});
      silenceHideNotes();
      silence = -1;
    }
  }
}

// ON DOCUMENT READY
$(function () {

});

// BTN LISTENERS
$('.red.mic').on('click', function(){

  let recording = $(this).hasClass("recording");
  if (!recording) {

    noteIdBuffer = [];
    loadStats();
    // start microphone stream using getUserMedia
    startMicRecordStream(
      audioCtx,
      bufferSize,
      onRecordFeatureExtractor, // essentia.js feature extractor callback function
      function() {
        // called when the promise fulfilled
        $('.red.mic').addClass("recording");
        $('.mic.ready.icons').hide();
        $('.mic.stop.icon').show();
      }
    );

    // start playing the song
    if (!wavesurfer.isPlaying()) {
      togglePlay();
    }

  } else {
    stopMicRecordStream();
    if (wavesurfer.isPlaying()) togglePlay();
    saveStats();
    saveSession();
  }
})