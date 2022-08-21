
// SESSION
let sessionsList = {};

function saveSession() {
  showSessionRelatedThings();
  
  if (sessionsList === null) {
    sessionsList = {};
  }
  if (typeof (Storage) != "undefined" && session.title) {
    sessionsList[session.title] = JSON.stringify(session);
    localStorage.setItem("sessionsList", JSON.stringify(sessionsList));
    console.log('Saving session:');
    console.log(sessionsList[session.title]);
    printAllSessions();
  }

}

function deleteSession(title) {
  if (sessionsList[title]) {
    console.log("Deleting session: " + title);
    delete sessionsList[title];
  }
  if (typeof (Storage) != "undefined" && jQuery.isEmptyObject(session)) {
    localStorage.setItem("sessionsList", JSON.stringify(sessionsList));
  }
}

function printAllSessions() {

  showSessionRelatedThings();

  if (typeof (Storage) != "undefined") {

    // retrive sessions
    sessionsList = JSON.parse(localStorage.getItem("sessionsList"));

    if (sessionsList === null) {
      sessionsList = {};
    }
    console.log("Sessions:");
    console.log(sessionsList);

    // if there are session stored
    if (!jQuery.isEmptyObject(sessionsList)) {

      //clear the previous sessions list
      $('.sessions.list').empty();

      //print and show the new sessions list
      for (const title in sessionsList) {
        if (title != 'undefined') {
          var li = document.createElement("li");
          li.setAttribute('id', title);
          li.appendChild(document.createTextNode(title));
          $('.sessions.list').append(li);
        }
      }
      $('.storage.segment').fadeIn();

    } else {
      $('.storage.segment').fadeOut();
    }
  }
}

function loadSession(title) {
  console.log(title);
  session = {};

  if (!jQuery.isEmptyObject(sessionsList) && sessionsList[title] != null) {
    session = JSON.parse(sessionsList[title]);

  } else if (typeof (Storage) != "undefined") {
    // retrive session list
    sessionsList = JSON.parse(JSON.stringify(localStorage));

    if (!jQuery.isEmptyObject(sessionsList) && sessionsList[title] != null) {
      session = JSON.parse(sessionsList[title]);
    } 

  }
}


// STATS

function saveStats() {
  if (typeof (Storage) != "undefined") {
    // save global stats
    localStorage.setItem("num_correct_notes", numCorrectNotes);
    localStorage.setItem("num_wrong_notes", numWrongNotes);
  }
}

function loadStats() {
  if (typeof (Storage) != "undefined") {

    // retrive or create global stats
    const correctNotes = parseInt(localStorage.getItem("num_correct_notes"));
    if (isNaN(correctNotes)) {
      saveStats();
    } else {
      numCorrectNotes = parseInt(localStorage.getItem("num_correct_notes"));
      numWrongNotes = parseInt(localStorage.getItem("num_wrong_notes"));
    }
    printStats();
    // if (!jQuery.isEmptyObject(storageList) && storageList[title] != null) {
    //   session = {};
    //   session = JSON.parse(storageList[title]);
    // }
  }
}


function showSessionRelatedThings() {

  if (jQuery.isEmptyObject(session)) {
    $('.deletesong.button').fadeOut();
    $('#edit_tonal_btn').fadeOut();
    $('#tonalInfoDiv').fadeOut();
    $('#scaleStatsDiv').fadeOut();
    printScaleDisplay(true);
    wavesurfer.empty();
    $("#nowPlayingHeader").text("");

  } else {
    $('#edit_tonal_btn').fadeIn();
    $('#tonalInfoDiv').fadeIn();
    $('#scaleStatsDiv').fadeIn();
    if (session.title) $('.deletesong.button').fadeIn();
    else $('.deletesong.button').fadeOut();
  }
}

function initKeyAndScaleDropdown(key, scaleName) {
  let dropdownScales = [];
  let selectedValue;
  $.each(scales, function (name) {
    let tmp = {};
    tmp.name = name;
    tmp.value = scales[name]["index"];
    tmp.description = scales[name]["type"];
    if (name === scaleName) selectedValue = tmp.value;
    dropdownScales.push(tmp);
  });

  $('.ui.scale.modal.dropdown').dropdown({ 
    values: dropdownScales,
    onChange: function() {
      const dropScaleName = $(this).find('option:selected').text();
      const dropKey = $('.ui.key.modal.dropdown').find('option:selected').text();
      updateFormScaleAndNotes(dropKey, dropScaleName);
    }
  });

  $('.ui.scale.landing.dropdown').dropdown({ 
    values: dropdownScales,
    onChange: function() {
      const dropScaleName = $(this).find('option:selected').text();
      const dropKey = $('.ui.key.landing.dropdown').find('option:selected').text();
      updateFormScaleAndNotes(dropKey, dropScaleName);
    }
  });

  if (selectedValue) $('.ui.scale.dropdown').dropdown('set selected', selectedValue);
  else $('.ui.scale.dropdown').dropdown('set selected', 0);
  $('.ui.key.landing.dropdown').dropdown('set selected', key);
  $('.ui.key.modal.dropdown').dropdown('set selected', key);
  updateFormScaleAndNotes(key, scaleName);
}

function updateFormScaleAndNotes(key, scaleName) {
  const scaleDesc = scales[scaleName]["description"];
  const scaleNotes = getScaleArray(key, scaleName).join(',\xa0\xa0 ');

  $('.scale.mode.description').text(scaleDesc);
  $('.mylist.notes.key').text(scaleNotes);
}


// DOCUMENT READY
$(function () {
  if (jQuery.isEmptyObject(session)) initKeyAndScaleDropdown("C", getObjectKeyByPrefix(scales, "Ionian"));
  else initKeyAndScaleDropdown(session.key, session.scaleName);
  
  printAllSessions();
  loadStats();
});


//  btns listener
$('.sessions.list').on('click', function (e) {
  if (e.target && e.target.matches('li')) {
    let title = e.target.innerText;
    stop();
    stopMicRecordStream();
    $('#modalOpenSongName').text(title);
    $('#openSessionModal').modal({ context: '#openSessionWrapper' }).modal('show');
    loadSession(title);
  }
});

$('#dismiss_headphones_btn').on('click', function(){
  $('.headphones.message').fadeOut();
  if (typeof (Storage) != "undefined") localStorage.dismissHeadphones = true;
});

$('#modal_load_session_btn').on('click', async function () {
  switchPage('main page');
  showSessionRelatedThings();
  loadWaveform();
  newSession = false;

  if (session.hasChords) {
    chordsArray = Object.values(JSON.parse(session.chordsArray));
    ticksArray = Object.values(JSON.parse(session.ticksArray));
    $('#chordsToggleLabel').text("Show chords:");
  } else if ($('#computeChordsCheckbox').is(':checked')) {
    await chordsExtractor(false);
    showChords();
    saveSession();
  }

  console.log("Loading session:")
  console.log(session);
  clearCanvas();
  printVideoInfo();
  printFeatures();
});

$('.deleteallsongs.button').on('click', function () {
  $('#deleteAllSessionsModal').modal('show');
});

$('#modal_delete_all_songs_btn').on('click', function () {
  stop();
  wavesurfer.empty();
  stopMicRecordStream();
  sessionsList = {};
  session = {};
  deleteSession("");
  printAllSessions();
  switchPage('landing');
});

$('#edit_tonal_btn').on('click', function () {
  initKeyAndScaleDropdown(session.key, session.scaleName);
  
  // set up the form labels
  $('#song_title_input').val(session.title);

  // shows the modal form
  $('#editSessionModal').modal({ context: '#editSessionWrapper' }).modal('show');
});


$('.ui.key.modal.dropdown').dropdown({
  onChange: function(key) {
    const scaleName = $('.ui.scale.modal.dropdown').find('option:selected').text();
    updateFormScaleAndNotes(key, scaleName);
  }
});

$('.ui.key.landing.dropdown').dropdown({
  onChange: function(key) {
    const scaleName = $('.ui.scale.landing.dropdown').find('option:selected').text();
    updateFormScaleAndNotes(key, scaleName);
  }
});

$('#modal_save_edit_btn').on('click', function () {
  const newTitle = $('#song_title_input').val();
  if (session.title && newTitle != session.title) {
    deleteSession(session.title);
    session.title = newTitle;
    console.log(session);
  }

  session.key = $('.ui.key.modal.dropdown').find('option:selected').text();
  session.scaleName = $('.ui.scale.modal.dropdown').find('option:selected').text();
  session.scaleArray = getScaleArray(session.key, session.scaleName);
  session.scaleIdArray = session.scaleArray.map(note => getNoteIndex(note));
  session.statsArray = Array(12).fill(0);
  saveSession();
  printVideoInfo();
  printFeatures();
});


$('.deletesong.button').on('click', function () {
  $('#modalDeleteSongName').text(session.title);
  $('#deleteSessionModal').modal('show');
});

$('#modal_delete_song_btn').on('click', function () {
  stop();
  stopMicRecordStream();
  const title = session.title;
  session = {};
  deleteSession(title);
  printAllSessions();
  $('#computeChordsCheckbox').prop('checked', false);
  switchPage('landing');
});


