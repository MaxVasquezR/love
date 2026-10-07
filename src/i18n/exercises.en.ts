import type { Goal, StationId } from '../core/types'

export interface ExerciseText {
  name: string
  blurb: string
  muscles: string
  cues: string[]
  mistakes: string[]
}

export const STATIONS_EN: Record<StationId, { title: string; muscles: string }> = {
  push: { title: 'Push', muscles: 'Chest · shoulders · triceps' },
  pull: { title: 'Pull', muscles: 'Back · biceps · hamstrings' },
  legs: { title: 'Legs', muscles: 'Quads · glutes · hamstrings' },
}

export const GOALS_EN: Record<Goal, { label: string; restReal: string; why: string }> = {
  fuerza: {
    label: 'Strength',
    restReal: '2 to 3 minutes',
    why: 'Few reps with heavy load: trains your nervous system to move more weight.',
  },
  hipertrofia: {
    label: 'Hypertrophy',
    restReal: '60 to 90 seconds',
    why: '8 to 12 reps close to failure: the classic range to build muscle.',
  },
  resistencia: {
    label: 'Endurance',
    restReal: '30 to 45 seconds',
    why: 'Lots of reps with light weight: builds muscular endurance and the pump.',
  },
}

export const EXERCISES_EN: Record<string, ExerciseText> = {
  'bench-bar': {
    name: 'Bench press',
    blurb: 'The Monday classic. Bar, bench and ego under control.',
    muscles: 'Pecs, front delts and triceps',
    cues: [
      'Shoulder blades together and down, chest up.',
      'Lower the bar to your sternum, elbows at about 45°.',
      'Feet planted and press in a straight line.',
    ],
    mistakes: ['Bouncing the bar off your chest.', 'Lifting your glutes off the bench.', 'Flaring the elbows to 90°.'],
  },
  'bench-db': {
    name: 'Dumbbell press',
    blurb: 'More range of motion and each arm works on its own.',
    muscles: 'Pecs, front delts and triceps',
    cues: ['Lower until you feel the chest stretch.', 'Bring the dumbbells together up top without clanking.', 'Wrists straight, over the elbows.'],
    mistakes: ['Half reps.', 'Letting the dumbbells drop without control.'],
  },
  incline: {
    name: 'Incline press',
    blurb: 'Upper chest so your shirt fits just right.',
    muscles: 'Upper (clavicular) pecs and delts',
    cues: ['Bench between 30° and 45°.', 'Lower the bar to your upper chest.', 'Keep your back flat on the bench.'],
    mistakes: ['Too much incline: it turns into a shoulder press.', 'Over-arching your back.'],
  },
  ohp: {
    name: 'Overhead press',
    blurb: 'Shoulders round like volleyballs.',
    muscles: 'Front and side delts, triceps and core',
    cues: ['Squeeze glutes and abs.', 'The bar travels close to your face.', 'Push your head "through the window" at the top.'],
    mistakes: ['Leaning back and arching the lower back.', 'Using leg drive.'],
  },
  dips: {
    name: 'Weighted dips',
    blurb: 'Bodyweight plus a plate hanging from the belt.',
    muscles: 'Triceps, lower chest and front delts',
    cues: ['Lower until your upper arm is parallel to the floor.', 'Elbows back, not out.', 'Come up without slamming the lockout.'],
    mistakes: ['Going too deep and straining the shoulder.', 'Swinging.'],
  },
  fly: {
    name: 'Chest flyes',
    blurb: 'Slow and controlled. This is where you feel it.',
    muscles: 'Pectoralis major',
    cues: ['Elbows slightly bent the whole time.', 'Open up like you are hugging a tree.', 'Control the way down for 2 seconds.'],
    mistakes: ['Going too heavy and turning it into a press.', 'Fully locking the arms.'],
  },
  'bar-row': {
    name: 'Barbell row',
    blurb: 'Wide back, elbows driving back.',
    muscles: 'Lats, rhomboids, mid traps and biceps',
    cues: ['Torso at about 45°, neutral spine.', 'Pull the bar to your belly button.', 'Squeeze your shoulder blades at the top.'],
    mistakes: ['Rounding your back.', 'Pulling with the arms instead of the back.'],
  },
  'lat-pulldown': {
    name: 'Lat pulldown',
    blurb: 'The machine everyone wants at 7 p.m.',
    muscles: 'Lats, teres major and biceps',
    cues: ['Chest up and lean back just a little.', 'Pull the bar to your upper chest.', 'Think of driving your elbows into your pockets.'],
    mistakes: ['Pulling behind the neck.', 'Swinging your body to move the weight.'],
  },
  'db-row': {
    name: 'Dumbbell row',
    blurb: 'One arm, full focus.',
    muscles: 'Lats, rhomboids and biceps',
    cues: ['Hand and knee on the bench.', 'Pull the dumbbell toward your hip.', 'Do not twist your torso.'],
    mistakes: ['Rotating the trunk to lift.', 'Shrugging the shoulder to the ear.'],
  },
  pullup: {
    name: 'Weighted pull-ups',
    blurb: 'The final exam for your back.',
    muscles: 'Lats, biceps and core',
    cues: ['Start from a dead hang, arms straight.', 'Chest out and pull until your chin clears the bar.', 'Lower with control.'],
    mistakes: ['Half range of motion.', 'Kicking to help yourself up.'],
  },
  rdl: {
    name: 'Romanian deadlift',
    blurb: 'The perfect hip hinge.',
    muscles: 'Hamstrings, glutes and spinal erectors',
    cues: ['Knees just slightly bent.', 'Push your hips back like closing a door with your butt.', 'The bar brushes your thighs.'],
    mistakes: ['Rounding the back.', 'Turning it into a squat.'],
  },
  deadlift: {
    name: 'Deadlift',
    blurb: 'From the floor to the sky. Breathe, brace and pull.',
    muscles: 'Whole posterior chain: glutes, hamstrings, back and traps',
    cues: ['Bar over mid-foot.', 'Big breath and brace your core before pulling.', 'Push the floor away with your legs.'],
    mistakes: ['Rounded back.', 'Letting the bar drift away from your body.', 'Hyperextending at the top.'],
  },
  squat: {
    name: 'Squat',
    blurb: 'The queen of exercises. Depth with pride.',
    muscles: 'Quads, glutes, adductors and core',
    cues: ['Feet shoulder-width, toes slightly out.', 'Knees track over your toes.', 'Go down until your hip passes the knee.'],
    mistakes: ['Knees caving in.', 'Lifting your heels.', 'Half squats for the ego.'],
  },
  goblet: {
    name: 'Goblet squat',
    blurb: 'Kettlebell at the chest, back straight.',
    muscles: 'Quads, glutes and core',
    cues: ['Hold the weight tight to your chest.', 'Elbows inside the knees on the way down.', 'Keep the torso as upright as possible.'],
    mistakes: ['Leaning forward.', 'Lifting your heels.'],
  },
  'leg-press': {
    name: 'Leg press',
    blurb: 'Serious load without fear.',
    muscles: 'Quads and glutes',
    cues: ['Lower back glued to the pad.', 'Go down to 90° at the knee.', 'Push with your whole foot.'],
    mistakes: ['Locking the knees at the top.', 'Lifting your hips off the seat.'],
  },
  lunges: {
    name: 'Lunges',
    blurb: 'Step by step toward level 50.',
    muscles: 'Quads, glutes and stabilizers',
    cues: ['Long step and drop straight down.', 'The back knee almost touches the floor.', 'Torso upright.'],
    mistakes: ['Step too short.', 'Front knee caving in.'],
  },
  'front-squat': {
    name: 'Front squat',
    blurb: 'Elbows up and quads on fire.',
    muscles: 'Quads, core and upper back',
    cues: ['Bar on your shoulders, elbows high.', 'Torso vertical.', 'Go deep with control.'],
    mistakes: ['Dropping the elbows.', 'Rounding the upper back.'],
  },
  'hip-thrust': {
    name: 'Hip thrust',
    blurb: 'The glute zone favorite.',
    muscles: 'Glutes and hamstrings',
    cues: ['Upper back resting on the bench.', 'Bar on your hips with a pad.', 'Squeeze your glutes at the top for 1 second.'],
    mistakes: ['Arching the lower back instead of extending the hips.', 'Feet too far or too close.'],
  },
}
