import { CHAPTERS } from './journey.js';

/** Four stages between the December briefing and the ride down (all proposed). */
export const ROUTE_STAGES = [
  {
    time: 'DECEMBER 2026',
    title: 'Campus engagement',
    text: 'DATARA’27 is introduced on campus and five teams are selected at Christ College of Engineering.',
  },
  {
    time: 'DEC 2026 – EARLY JAN 2027',
    title: 'Open participation',
    text: 'Applications open to other institutions; fifteen further teams are chosen through a defined evaluation.',
  },
  {
    time: '15–16 JANUARY 2027',
    title: 'Destination hackathon',
    text: 'Twenty teams of two arrive at Athirappilly for the overnight sprint, mentoring and judging.',
  },
  {
    time: 'DAY TWO · 15:00',
    title: 'Finale and recognition',
    text: 'Five finalists showcase, awards follow, and the Sky Storm ride is proposed — subject to availability.',
  },
];

const beatsOf = (id) => CHAPTERS.find((c) => c.id === id)?.beats ?? [];

/** Indicative day plan. Beats are reused from the journey chapters so copy lives in one place. */
export const DAY_PLAN = [
  { day: 'DAY 1', title: 'Arrival', items: beatsOf('destination') },
  {
    day: 'DAY 1',
    title: 'Base camp',
    items: [
      { time: '10:00', text: 'The brief lands; challenge tracks announced live in the room' },
    ],
  },
  { day: 'DAY 1', title: 'The build', items: beatsOf('gathering') },
  { day: 'OVERNIGHT', title: 'The hours that separate ideas', items: beatsOf('mission') },
  { day: 'DAY 2', title: 'The showcase', items: beatsOf('timeline') },
  {
    day: 'DAY 2',
    title: 'The ride down',
    items: [
      {
        time: '16:00',
        text: 'Finalists take the Sky Storm line back down (proposed, subject to availability)',
      },
    ],
  },
];
