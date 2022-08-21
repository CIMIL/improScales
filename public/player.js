let volumeSlider = document.getElementById("volume_slider")
const playerDiv = document.querySelector("#player")

let audioCtx
try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  } catch (e) {
    throw "Could not instantiate AudioContext: " + e.message;
  }

// WaveSurfer initialization
var wavesurfer = WaveSurfer.create({
  audioContext: audioCtx,
  container: '#waveform',
  // fillParent: true,
  responsive: true,
  waveColor: 'grey',
  progressColor: '#2B6FAC',
  cursorColor: '#fff',
  barWidth: 2,
  height: 200,
  skipLength: 5,
});


// Functions
/**
 * Wrapper for wavesurfer.load()
 */
const loadWaveform = () => {
  $('.text.loader').text('Fetching the audio track...');
  $('#loader').dimmer('show');
  wavesurfer.load(session.audioURL); 
}

/**
 * Toggle play button
 */
const togglePlay = () => {
  wavesurfer.playPause()
  const isPlaying = wavesurfer.isPlaying()
  if (isPlaying) {
    $("#play").hide();
    $("#pause").show();
    // cursorStream();
  } else {
    $("#play").show();
    $("#pause").hide();
  }
}

/**
 * Stop playing
 */
const stop = () => {
  wavesurfer.stop();
  $("#play").show();
  $("#pause").hide();
}
/**
 * Handles changing the volume slider input
 * @param {event} e
 */
const handleVolumeChange = e => {
  // Set volume as input value divided by 100
  // NB: Wavesurfer only excepts volume value between 0 - 1
  const volume = e.target.value / 100
  wavesurfer.setVolume(volume)
}
/**
 * Formats time as MM:SS
 * @param {number} seconds
 * @returns time as MM:SS
 */
const formatTimecode = seconds => {
  return new Date(seconds * 1000).toISOString().substr(14, 5)
}

/**
 * Toggles mute/unmute of the Wavesurfer volume
 * Also changes the volume icon and disables the volume slider
 */
const toggleMute = () => {
  wavesurfer.toggleMute()
  const isMuted = wavesurfer.getMute()
  if (isMuted) {
    $("#volOFF").show();
    $("#volON").hide();
    volumeSlider.disabled = true
  } else {
    $("#volON").show();
    $("#volOFF").hide();
    volumeSlider.disabled = false
  }
}

/**
 * Updates chords and the timecode on the main page (called on seek and on audioProcess)
 */
const seekChordsTime = () => {
  const time = wavesurfer.getCurrentTime()
  currentTime.innerHTML = formatTimecode(time)

  while(time > ticksArray[chordsCursor + 1]) {
    ++chordsCursor;
    updateChords();
  }
  if(chordsCursor > 0 && time < ticksArray[chordsCursor]) {
    chordsCursor = 0;
    updateChords();
  }
}

// --------------------------------------------------------- //

// Javascript Event listeners
$('#play_pause_btn').on('click', togglePlay)
$('#stop_btn').on('click', stop)
$('#volume_btn').on('click', toggleMute)
volumeSlider.addEventListener("input", handleVolumeChange)

$('#play_mic_btn').popup({ on:'hover', delay:{show:500,hide:0} })

// --------------------------------------------------------- //

// Wavesurfer event listeners
wavesurfer.on('ready', () => {
  // Set wavesurfer volume
  wavesurfer.setVolume(volumeSlider.value / 100)
  // Set audio track total duration
  const duration = wavesurfer.getDuration()
  totalDuration.innerHTML = formatTimecode(duration)
  if (newSession) {
    featureExtractor();
  } else {
    $("#loader").dimmer('hide');
    togglePlay();
  }
  $("#emptyPlayer").fadeOut();
})

// not working, see github issues:
// wavesurfer.on('loading', function(perc) {})

// Sets the timecode current timestamp as audio plays
wavesurfer.on('audioprocess', () => {
  seekChordsTime();
})

wavesurfer.on('seek', () => {
  seekChordsTime();
})

// Resets the play button icon after audio ends, stops the mic if it's recording.
wavesurfer.on('finish', () => {
  $("#play").show();
  $("#pause").hide();
  if ( $('.red.mic').hasClass("recording") ) {
    stopMicRecordStream();
    saveStats();
    saveSession();
  }
})

wavesurfer.on('error', (e) => {
  console.log(e);
  $('#loader').dimmer('hide');
  Swal.fire({
    icon: 'error',
    title: 'Error while fetching the audio: ' + e,
    text: 'Please check your connection, try again or try with another link.'
  })  
})


// keyboard event listener
$(document).on('keydown', function(e) {

  // finding the element on which the event was fired:
  source = e.target,

  // an Array of element-types upon which the function should not fire
  exclude = ['input', 'textarea'];

  // finding the element-type (tagName) of the element upon which the event was fired, converting it to a lower-case string and then looking in the Array
  // of excluded elements to see if the element is held within (-1 indicates the string was not found within the Array):
  if (exclude.indexOf(source.tagName.toLowerCase()) === -1) {
    
    if(wavesurfer.isReady){
      var handled = false;
      if (e.key === ' ' || e.key === 'Spacebar') {
        handled = true;
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        handled = true;
        wavesurfer.skipBackward();
      } else if (e.key === 'ArrowRight') {
        handled = true;
        wavesurfer.skipForward();
      }
      if (handled) {
        e.preventDefault();
      }
    }
  }
  
});
