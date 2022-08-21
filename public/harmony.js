
//note indexes:  0        1        2    3        4        5        6        7    8        9       10       11
const notes = [ "A", ["A#","Bb"], "B", "C", ["C#","Db"], "D", ["D#","Eb"], "E", "F", ["F#","Gb"], "G", ["G#","Ab"] ];
let scales = {
  "Ionian (major scale)": {
    index: 0,
    intervals: [2, 2, 1, 2, 2, 2, 1],
    type: 'I mode',
    description: 'The modern major scale. It is composed of natural notes beginning on C. It is the first of the 7 modes of the major scale.'
  },
  "Dorian": {
    index: 1,
    intervals: [2, 1, 2, 2, 2, 1, 2],
    type: 'II mode, minor',
    description: 'The Dorian mode is very similar to the modern natural minor scale. The only difference is in the sixth note, which is a major sixth above the first note, rather than a minor sixth. It is the second of the 7 modes of the major scale.'
  },
  "Phrygian": {
    index: 2,
    intervals: [1, 2, 2, 2, 1, 2, 2],
    type: 'III mode, minor',
    description: 'The Phrygian is the third mode. It is also very similar to the modern natural minor scale. The only difference is in the second note, which is a minor second not a major. The Phrygian dominant is also known as the Spanish gypsy scale, because it resembles the scales found in flamenco music.'
  },
  "Lydian": {
    index: 3,
    intervals: [2, 2, 2, 1, 2, 2, 1],
    type: 'IV mode, major',
    description: 'The Lydian is the fourth mode and it has just one note changed from the Ionian, a major scale, but with the fourth note from the bottom sharpened to give a slightly unsettling sound.'
  },
  "Mixolydian": {
    index: 4,
    intervals: [2, 2, 1, 2, 2, 1, 2],
    type: 'V mode, major',
    description: 'The Mixolydian is the fifth mode. The single tone that differentiates this scale from the major scale is its seventh note, which is a flattened seventh rather than a major seventh.'
  },
  "Aeolian (minor scale)": {
    index: 5,
    intervals: [2, 1, 2, 2, 1, 2, 2],
    type: 'VI mode, minor',
    description: 'Aeolian is the natural minor scale. It is composed of natural notes beginning on A. It is the sixth of the 7 modes of the major scale.'
  },
  "Locrian": {
    index: 6,
    intervals: [1, 2, 2, 1, 2, 2, 2],
    type: 'VII mode, diminished',
    description: 'The Locrian mode has five notes in its scale flattened a half-step. It is the seventh mode of the major scale. It sounds good on half diminished chords.'
  },
  "Minor pentatonic": {
    index: 7,
    intervals: [3, 2, 2, 3, 2],
    type: '5-note scale',
    description: 'It is a 5-note scale, which are derieved from the 1st, 3rd, 4th, 5th, and 7th intervals.'
  },
  "Major pentatonic": {
    index: 8,
    intervals: [2, 2, 3, 2, 3],
    type: '5-note scale',
    description: 'It is a 5-note scale, which are derieved from the 1st, 2nd, 3rd, 5th, and 6th intervals.'
  }
}

let numCorrectNotes = 0;
let numWrongNotes = 0;

function getNoteString(noteIndex, isFlat) {
  return notes[noteIndex][isFlat ? 1 : 0];
}

function getNoteIndex(noteString) {
  if (noteString.length === 1) return notes.indexOf(noteString);
  else {
    if (noteString.charAt(1) === "#") return (notes.indexOf(noteString.charAt(0)) + 1).mod(12);
    else return (notes.indexOf(noteString.charAt(0)) - 1).mod(12);
  }
}

function getScaleArray(key, scaleName) {
  let tonic = getNoteIndex(key);
  let scaleArray = [key];

  if (scales[scaleName]) {
    const intervals = scales[scaleName]["intervals"];
    let scaleIdArray = intervals.map( i => (tonic=tonic+i)%12 );
    scaleIdArray.pop();
    let note;
    scaleIdArray.forEach(function (noteIndex, i) {
      // check if is an alteration (flat or sharp)
      if ( Array.isArray(notes[noteIndex]) ) {
        let prevNoteLetter = scaleArray[scaleArray.length-1].charAt(0);
        note = nextChar(prevNoteLetter, Math.floor((intervals[i]+1)/2))
        if (getNoteString(noteIndex, false).indexOf(note) === 0) note = getNoteString(noteIndex, false);
        else note = getNoteString(noteIndex, true);
      } else note = getNoteString(noteIndex);
      scaleArray.push(note);
    });
  } else {
    console.error('scale not found');
  }
  return scaleArray;
}

function silenceHideNotes() {
  // resets scale notes color
  $('#scaleNotes').children().css({'color': 'dimgray', 'font-size':'40px'});
  $('#currentNoteDiv').fadeOut();
}

function printGenericNote(noteId) {
  // if there isn't a song loaded, don't show a scale but show the currently played note in white
  $('#scaleNotes').children().remove();
  $('#currentNoteDiv').children().css({'color': 'white'});
  $('#currentNoteLabel').text("Playing note:");
  $('#currentNoteHeader').text(notes[noteId]);  
  $('#currentNoteDiv').show();
}

function printCorrectNote(noteId) {
  // resets scale notes color and hide the note error div
  silenceHideNotes();
  // since the note is in the scale, enlarge it and don't show a note error
  $('#' + noteId).css({'color': '#3EB249', 'font-size':'60px'});

  // update stats
  ++numCorrectNotes;
  printStats();
}

function printOutOfScaleNote(noteId) {
  // resets scale notes color
  $('#scaleNotes').children().css({'color': 'dimgray', 'font-size':'40px'});

  // display the wrong note in red
  $('#currentNoteDiv').children().css({'color': 'crimson'});
  $('#currentNoteLabel').text("Out of scale note:");
  $('#currentNoteHeader').text(getNoteString(noteId)); 
  $('#currentNoteDiv').show();

  // update stats
  ++numWrongNotes;
  printStats();
}

function printScaleDisplay(reset) {
  $('#scaleNotes').children().remove();
  $('#stats_inScaleNotes').children().remove();
  $('#stats_inScaleOcc').children().remove();
  $('#stats_outOfScaleNotes').children().remove();
  $('#stats_outOfScaleOcc').children().remove();

  if (!reset) {
    let numInScale = 0;

    session.scaleArray.forEach(function(note) {
      const noteIndex = getNoteIndex(note);
      const noteOcc = session.statsArray[noteIndex];
      numInScale += noteOcc;
      $('#scaleNotes').append('<p id="' + noteIndex + '" style="font-size:40px; color:dimgray; margin-bottom:0px">' + note + '</p>');
      $('#stats_inScaleNotes').append('<p style="color:LightSkyBlue; margin-bottom:0px">' + note + '</p>');
      $('#stats_inScaleOcc').append('<p id="stat' + noteIndex + '" style="color:white; margin-bottom:0px">' + noteOcc + '</p>');
    });
    $('#stats_inScaleNotes').append('<p style="color:LightSkyBlue; margin-bottom:0px">TOT</p>');
    $('#stats_inScaleOcc').append('<p id="statInTot" style="color:white; margin-bottom:0px">' + numInScale + '</p>');

    let numOutOfScale = 0;
    notes.forEach(function(note, noteIndex) {
      if (!session.scaleIdArray.includes(noteIndex)) {
        const noteOcc = session.statsArray[noteIndex];
        numOutOfScale += noteOcc;
        $('#stats_outOfScaleNotes').append('<p style="color:LightSkyBlue; margin-bottom:0px">' + note[0] + '</p>');
        $('#stats_outOfScaleOcc').append('<p id="stat' + noteIndex + '" style="color:white; margin-bottom:0px">' + noteOcc + '</p>');
      }
    });
    $('#stats_outOfScaleNotes').append('<p style="color:LightSkyBlue; margin-bottom:0px">TOT</p>');
    $('#stats_outOfScaleOcc').append('<p id="statOutTot" style="color:white; margin-bottom:0px">' + numOutOfScale + '</p>');
  }

}

function printStats() {
  //print scale stats
  if (!jQuery.isEmptyObject(session)) {
    let numInScale = 0;
    let numOutOfScale = 0;

    session.statsArray.forEach((occ, noteIndex) => {
      $('#stat' + noteIndex).text(occ);
      if (session.scaleIdArray.includes(noteIndex)) numInScale += occ;
      else numOutOfScale += occ;
    });
    $('#statInTot').text(numInScale);
    $('#statOutTot').text(numOutOfScale);
  }

  // print overall stats
  const totalNotes = numCorrectNotes + numWrongNotes;
  if (totalNotes != 0) {
    $('#correctNotesHeader').text(numCorrectNotes + " (" + parseInt(numCorrectNotes/totalNotes*100) + "%)");
    $('#wrongNotesHeader').text(numWrongNotes + " (" + parseInt(numWrongNotes/totalNotes*100) + "%)");
  } else {
    $('#correctNotesHeader').text(numCorrectNotes);
    $('#wrongNotesHeader').text(numWrongNotes);
  }
  
  $('#totalNotesHeader').text(totalNotes);
}