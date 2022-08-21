
// global var to load essentia.js core instance
let essentiaExtractor;
let isEssentiaInstance = false;
// buffer size microphone stream (bufferSize is high in order to make PitchYinProbabilistic algo to work)
// let bufferSize = 8192;
// let hopSize = 2048;
let bufferSize = 4096;
let hopSize = 512;
let chordConfidence = 0.75;

let session = {};
let newSession;

// let filePicker = document.getElementById('filePicker')
let chordsCursor = 0;
let chordsArray = [];
let ticksArray = [];

let scriptNode;

// variables to count seconds in the console log
const countSeconds = true;
let startTime;


function getVideoInfo(videoURL) {
  
  // compose the url to retrieve video informations based on YouTube APIs 
  var infoURL = "https://www.youtube.com/oembed?url=" + videoURL + "&format=json"
  
  fetch(infoURL)
      .then(response => response.json()).then( json => videoINFO = json)
      .catch(error => console.error(error))
      .finally(() => {
        // save info in session
        session.title = videoINFO.title;
        session.channel = videoINFO.author_name;
        session.channelURL = videoINFO.author_url;
        printVideoInfo();
  });
}

function printVideoInfo(){
  $("#nowPlayingHeader").text("Now playing: " + session.title);
  $("#nowPlayingHeader").attr('href', session.videoURL);
}


function fetchYoutubeAudio(videoURL) {

  if(videoURL !== "") {
    session.videoURL = videoURL;
    getVideoInfo(videoURL);

    const host = window.location.host;
    if (host.includes("localhost") || host.includes("thomasborgogno.it")) session.audioURL = "http://" + host + "/youtube/?link=" + videoURL;
    else session.audioURL = "https://" + host + "/youtube/?link=" + videoURL;
    console.log(session);
    loadWaveform();
    if (countSeconds) startTime = Date.now();
  } else {
    Swal.fire({
      icon: 'error',
      title: 'Empty field',
      text: 'Please insert a youtube link to load a song.'
    });
  }
}

// callback function which compute Chords and features of the audio and saves in the session
async function featureExtractor() {
  if (countSeconds) console.log(timeDiff() + " WAVESURFER DONE");
  
  $('.text.loader').text('Analyzing audio track, please wait...');

  // load audio file from an url
  let signal = essentiaExtractor.arrayToVector(await essentiaExtractor.getAudioChannelDataFromURL(session.audioURL, audioCtx, 0));

  session.bpm = parseInt(essentiaExtractor.PercivalBpmEstimator(signal).bpm);

  let tonal = await essentiaExtractor.TonalExtractor(signal);
  session.key = tonal.key_key;

  if (tonal.key_scale === 'major') session.scaleName = getObjectKeyByPrefix(scales, "Ionian");
  else session.scaleName = getObjectKeyByPrefix(scales, "Aeolian");
  
  session.scaleArray = getScaleArray(session.key, session.scaleName);
  session.scaleIdArray = session.scaleArray.map(note => getNoteIndex(note));
  session.statsArray = Array(12).fill(0);

  if (countSeconds) console.log(timeDiff() + " BASIC FEATURES DONE");

  if ($('#computeChordsCheckbox').is(':checked')) await chordsExtractor(false);
  else session.hasChords = false;

  printFeatures();
  $('#loader').dimmer('hide');
  // togglePlay();

  saveSession();
}


async function chordsExtractor(isNewExtraction) {
  $('.text.loader').text('Analyzing audio track, please wait...');
  if (isNewExtraction) {
    $('#loader').dimmer('show');
  }

  // load audio file from an url
  const audioData = await essentiaExtractor.getAudioChannelDataFromURL(session.audioURL, audioCtx, 0);
  const signal = await essentiaExtractor.arrayToVector(audioData);

  let ticks = await essentiaExtractor.BeatTrackerMultiFeature(signal).ticks;
  // let ticks = await essentiaExtractor.BeatTrackerDegara(signal).ticks;

  let hpcpPool = new essentiaExtractor.module.VectorVectorFloat();
  // Generate overlapping frames with given frameSize and hopSize
  let audioFrames = await essentiaExtractor.FrameGenerator(audioData, bufferSize, hopSize);
  for (var i=0; i<audioFrames.size(); i++) {
    hpcpPool.push_back(essentiaExtractor.arrayToVector(essentiaExtractor.hpcpExtractor(essentiaExtractor.vectorToArray(audioFrames.get(i)))));
  }
  
  // let detChords = await essentiaExtractor.ChordsDetectionBeats(hpcpPool, ticks, 'starting_beat');
  let detChords = await essentiaExtractor.ChordsDetectionBeats(hpcpPool, ticks, 'interbeat_median');

  // save only valid chords
  chordsArray = [];
  ticksArray = [];
  for (var i=0; i<detChords.chords.size(); i++) {

    while(detChords.strength.get(i) < chordConfidence){
      ++i;
    }
    while( (chordsArray.length > 0 && detChords.chords.get(i) === chordsArray.at(-1)) || detChords.strength.get(i) < chordConfidence ) {
      // discard the current chord if it's equals to the previous or if it's too weak
      ++i;
    }
    
    if(i < detChords.chords.size()) {
      console.log(formatTimecode(ticks.get(i)) + "s:\t" + detChords.chords.get(i) + "\ts: " + parseInt(detChords.strength.get(i)*100));

      chordsArray.push(detChords.chords.get(i));
      ticksArray.push(ticks.get(i));
    }
  }

  // save the computed chords in the current session
  session.chordsArray = JSON.stringify(chordsArray);
  session.ticksArray = JSON.stringify(ticksArray);
  session.hasChords = true;

  if (countSeconds) console.log(timeDiff() + " CHORDS DONE");

  if (isNewExtraction) $('#loader').dimmer('hide');
}


function printFeatures(){

  $("#keyHeader").text(session.key);
  $('#bpmHeader').text(session.bpm + "bpm")
  $('#scaleHeader').text(session.scaleName);

  printStats();

  printScaleDisplay(false);
  
  if (session.hasChords && $('#computeChordsCheckbox').is(':checked')) showChords();
  else $('#chordsToggleLabel').text("Compute chords:");
  
}

function showChords() {
  $('#chordsToggleLabel').text("Show chords:");
  updateChords();
  printChordsLines();
  $('#chordsDisplay').fadeIn();
}

function updateChords() {
  // <-
  if(chordsCursor >= 1) $("#previousChordHeader").text(chordsArray[chordsCursor - 1]);
  else $("#previousChordHeader").text("");
  // |
  if(chordsCursor < chordsArray.length) $("#currentChordHeader").text(chordsArray[chordsCursor]);
  else $("#currentChordHeader").text("");
  // ->
  if(chordsCursor + 1 < chordsArray.length) $("#nextChordHeader").text(chordsArray[chordsCursor + 1]);
  else $("#nextChordHeader").text("");
}

function switchPage(page) {
  switch (page) {
    case 'landing':
      $('#landingPage').fadeIn();
      $('#mainPage').fadeOut();
      $('.menu.yt.url').fadeOut();
      break;
    case 'scale only':
      $('#bpmDiv').hide();
      $('#chordsDiv').hide();
      $('.audioPlayer').hide();
      $('.headphones.message').hide();
      $('.red.mic.scaleonly').show();
      $('#modalSongTitle').hide();
      $('#landingPage').fadeOut();
      $('#mainPage').fadeIn();
      $("#landing_input_yt_url").val("");
      $('.menu.yt.url').fadeIn();
      break;
    case 'main page':
    default:
      if (typeof (Storage) != "undefined" && !localStorage.dismissHeadphones) $('.headphones.message').fadeIn();
      $('#bpmDiv').fadeIn();
      $('#chordsDiv').fadeIn();
      $('.audioPlayer').fadeIn();
      $('.red.mic.scaleonly').fadeOut();
      $('#modalSongTitle').show();
      $('#landingPage').fadeOut();
      $('#mainPage').fadeIn();
      $("#landing_input_yt_url").val("");
      $('.menu.yt.url').fadeIn();
      createCanvas();
  }
}


// DOCUMENT READY
$(function () {
  // loads the WASM backend and runs the feature extraction

  if(audioCtx.sampleRate != 44100) {
    $('#sampleRateMsg').fadeIn();
  } else {
    $('#sampleRateMsg').fadeOut();
  }

  EssentiaWASM().then(function (essentiaWasmModule) {
    if (!isEssentiaInstance) {
      essentiaExtractor = new EssentiaExtractor(essentiaWasmModule);
      // modifying default extractor settings
      essentiaExtractor.bufferSize = bufferSize;
      essentiaExtractor.hopSize = hopSize;
      essentiaExtractor.sampleRate = audioCtx.sampleRate;
      essentiaExtractor.profile.HPCP.normalized = 'none';
      essentiaExtractor.profile.HPCP.harmonics = 0;
      isEssentiaInstance = true;
    }
  });
});

// buttons listener
$('#load_audio_btn, #landing_load_audio_btn').on('click', function(){
  stop();
  clearCanvas();
  $("#keyHeader").text("");
  $('#scaleHeader').text("");
  $("#bpmHeader").text("");
  $("#chordsSet").text("");
  newSession = true;
  let videoURL = $("#landing_input_yt_url").val();
  if (videoURL === "") videoURL = $("#input_yt_url").val();
  switchPage('main page');
  fetchYoutubeAudio(videoURL);
});

$('#scale_only_btn').on('click', function() {
  session.key = $('.ui.key.landing.dropdown').find('option:selected').text();
  session.scaleName = $('.ui.scale.landing.dropdown').find('option:selected').text();
  session.scaleArray = getScaleArray(session.key, session.scaleName);
  session.scaleIdArray = session.scaleArray.map(note => getNoteIndex(note));
  session.statsArray = Array(12).fill(0);
  saveSession();
  
  printVideoInfo();
  printFeatures();
  switchPage('scale only');
});

$('.ui.accordion').accordion();

$('.message .close').on('click', function() {
  $(this).closest('.message').fadeOut();
});

$('#volume_btn').popup({ position: 'right center', hoverable: true });

$('.ui.mainpage.toggle').checkbox({
  onChecked: async function () { 
    if (session.hasChords) {
      showChords();
    } else if (!jQuery.isEmptyObject(session)) {
      if (wavesurfer.isPlaying()) togglePlay();
      await chordsExtractor(true);
      showChords();
      saveSession();
    }
  },
  onUnchecked: function () { 
    clearCanvas(); 
    $('#chordsDisplay').fadeOut();
  }
});

$('.ui.landing.toggle').checkbox({
  onChecked: async function () { 
    $('#computeChordsCheckbox').prop('checked', true);
  },
  onUnchecked: function () { 
    $('#computeChordsCheckbox').prop('checked', false);
  }
});

// keyboard Enter event listener for link input
$('#input_yt_url, #landing_input_yt_url').on('keydown', function(e) {

  if (e.key === 'Enter') {
    $('#load_audio_btn').trigger('click');
    e.preventDefault();
  }  
});