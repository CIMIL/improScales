import { isEqual, uniqWith } from 'lodash';
import {
  Fretboard,
  Systems,
  disableDots,
  FretboardSystem
} from '../../../dist/fretboard.esm.js';
import { fretboardConfiguration, colors } from "../config.js";
import SystemForm from "../forms/systems.js";

function pentatonicSystemExample() {
  const $wrapper = document.querySelector('.fretboard-systems-pentatonic');
  const fretboard = new Fretboard({
    ...fretboardConfiguration,
    el: $wrapper.querySelector('figure'),
    dotText: ({ note, octave, interval }) => note + octave,
    dotFill: ({ interval, inBox }) =>
      !inBox
        ? colors.disabled
        : interval === '1P'
        ? colors.defaultActiveFill
        : colors.defaultFill,
  });

  const defaultScale = {
    root: 'E',
    type: 'minor pentatonic'
  };

  fretboard.renderScale({
    ...defaultScale,
    box: {
      system: Systems.pentatonic,
      box: 1
    }
  });

  SystemForm({
    prefix: 'pentatonic',
    el: $wrapper.querySelector('.form-wrapper'),
    boxes: ['1', '2', '3', '4', '5', "1'"],
    modes: ['minor pentatonic', 'major pentatonic'],
    defaultState: {
      root: defaultScale.root,
      mode: defaultScale.type,
    },
    onChange: ({ mode, box, root }) => {
      fretboard.renderScale({
        type: mode,
        root: box.slice(-1) === "'" ? `${root}3` : root,
        box: {
          system: Systems.pentatonic,
          box: box[0]
        }        
      });
    },
  });
}

function CAGEDSystemExample() {
  const $wrapper = document.querySelector('.fretboard-systems-caged');
  const fretboard = new Fretboard({
    ...fretboardConfiguration,
    el: $wrapper.querySelector('figure'),
    dotText: ({ note, octave, interval }) => note,
    dotFill: ({ interval, inBox }) =>
      !inBox
        ? colors.disabled
        : interval === '1P'
        ? colors.defaultActiveFill
        : colors.defaultFill,
  });

  fretboard.renderScale({
    type: 'major',
    root: 'C',
    box: {
      box: 'C',
      system: Systems.CAGED,
    },
  });

  SystemForm({
    prefix: 'caged',
    el: $wrapper.querySelector('.form-wrapper'),
    boxes: 'CAGED'.split(''),
    onChange: ({ mode, box, root }) => {
      fretboard.renderScale({
        type: mode,
        root,
        box: {
          box,
          system: Systems.CAGED
        },
      });
    },
  });
}

function TNPSSystemExample() {
  const $wrapper = document.querySelector('.fretboard-systems-tnps');
  const fretboard = new Fretboard({
    ...fretboardConfiguration,
    el: $wrapper.querySelector('figure'),
    dotText: ({ note, octave, interval }) => note,
    dotFill: ({ interval, inBox }) =>
      !inBox
        ? colors.disabled
        : interval === "1P"
        ? colors.defaultActiveFill
        : colors.defaultFill,
  });

  fretboard.renderScale({
    type: 'major',
    root: 'C',
    box: {
      box: 1,
      system: Systems.TNPS
    },
  });

  SystemForm({
    prefix: 'tnps',
    el: $wrapper.querySelector('.form-wrapper'),
    boxes: [1, 2, 3, 4, 5, 6, 7],
    onChange: ({ mode, box, root }) => {
      fretboard.renderScale({
        type: mode,
        root,
        box: {
          box,
          system: Systems.TNPS,
        },
      });
    },
  });
}

export default function systems() {
    pentatonicSystemExample();
    CAGEDSystemExample();
    TNPSSystemExample();
  }