import type { CharacterId, EquipmentId, OutfitId } from '../core/types'
import type { CoachMoment } from '../data/coach'

export const CHARACTERS_EN: Record<CharacterId, { title: string; bio: string }> = {
  max: { title: 'The Steady One', bio: 'From Surco, Lima. Balanced at everything and never misses chest day Monday.' },
  ana: { title: 'The Technician', bio: 'From Miraflores. Perfect form on every rep: her perfect reps are pure gold.' },
  bruno: { title: 'The Iron', bio: 'From Callao. A powerlifter at heart: if it is heavy, he lifts it.' },
  kiara: { title: 'The Unstoppable', bio: 'From San Juan de Lurigancho. Queen of leg day, she never gets tired.' },
  lucho: { title: 'The Veteran', bio: 'From Breña. 55 years old, 35 of them lifting. Flawless technique and free advice.' },
}

export const OUTFITS_EN: Record<OutfitId, { name: string; blurb: string }> = {
  base: { name: 'Classic', blurb: 'Their battle gear.' },
  bonnetty: { name: 'Bonnetty tee', blurb: 'The official Bonnetty Fitness shirt.' },
  stringer: { name: 'Bonnetty stringer', blurb: 'To show off the shoulders you worked so hard for.' },
  neon: { name: 'Night neon', blurb: 'For the 10 p.m. crew.' },
  hoodie: { name: 'Oversized hoodie', blurb: 'For those foggy Lima mornings.' },
  oro: { name: 'Gold edition', blurb: 'Legends only. Shines across the whole gym.' },
}

export const EQUIPMENT_EN: Record<EquipmentId, { name: string; blurb: string }> = {
  chalk: { name: 'Chalk', blurb: 'Solid grip, zero sweaty slips.' },
  belt: { name: 'Leather belt', blurb: 'An armored core for heavy loads.' },
  knees: { name: 'Knee sleeves', blurb: 'Warm knees, longer sets.' },
  straps: { name: 'Straps', blurb: 'Heavy pulls without your grip giving out.' },
  shoes: { name: 'Lifting shoes', blurb: 'Stable base, elite technique.' },
}

export const ACHIEVEMENTS_EN: Record<string, string> = {
  first: 'First day at Bonnetty',
  'sessions-25': 'Regular customer',
  'sessions-100': 'Lives at the gym',
  'reps-100': '100 reps',
  'reps-1000': 'A thousand reps',
  'perfect-50': 'Clean technique',
  'perfect-300': 'Master of form',
  'kg-10k': '10 tons moved',
  'kg-100k': '100 tons moved',
  'combo-8': 'Unstoppable combo',
  'pr-1': 'First PR',
  'pr-20': 'Record breaker',
  'quiz-10': "Coach's student",
  'routine-5': 'Routine discipline',
  'share-1': 'Fitness influencer',
  'level-5': 'Level 5',
  'level-10': 'Level 10',
  'level-25': 'Level 25',
  'streak-7': 'Full week',
  roster: 'Full squad',
}

export const ROUTINES_EN: Record<string, { name: string; blurb: string }> = {
  'push-day': { name: 'Push Day', blurb: 'Chest, shoulders and triceps, PPL style.' },
  'full-body': { name: 'Basic Full Body', blurb: 'The essentials to start: push, pull and legs.' },
  'pull-day': { name: 'Pull Day', blurb: 'V-shaped back and steel biceps.' },
  hiit: { name: 'HIIT Circuit', blurb: 'No breaks: 3 exercises back to back with minimal rest.' },
  'leg-day': { name: 'Leg Day', blurb: 'Nobody skips leg day at Bonnetty.' },
  glute: { name: "Kiara's Glute Circuit", blurb: 'The glute zone favorite.' },
  daily: { name: 'Bonnetty routine of the day', blurb: 'Changes every day. Double bonus the first time.' },
}

export const TIPS_EN: string[] = [
  'Muscle does not grow at the gym: it grows while you rest and sleep.',
  'Sleeping less than 6 hours can lower your strength and slow your recovery.',
  '1.6 to 2.2 g of protein per kg of bodyweight per day is ideal to build muscle.',
  'Lowering the weight over 2 to 3 seconds increases time under tension.',
  'Creatine is one of the most studied supplements: 3 to 5 g per day.',
  'Warm up with light sets before going heavy: your joints will thank you.',
  'You cannot burn belly fat with crunches alone: fat loss comes from a calorie deficit.',
  'For strength rest 2 to 3 minutes; for hypertrophy, 60 to 90 seconds.',
  'Soreness does not mean you trained better; it is normal when you start.',
  'Training each muscle twice a week usually gives better results.',
  'Rotisserie chicken is protein... but watch out for the fries and sauces.',
  'Ceviche is a great source of lean protein. Very Peruvian and very fit!',
  'Quinoa has complete protein and gives you energy to train.',
  'Drink water before, during and after training. Losing 2% of fluids already lowers performance.',
  'Technique first: a well-moved weight is worth more than an ugly record.',
  'Brace your core before every heavy rep: it protects your spine.',
  'Every 6 to 8 weeks, a deload week helps you keep progressing.',
  'Never skip leg day: they are the biggest muscles in your body.',
  'Deep squats with good technique are safe for healthy knees.',
  'Visible changes show up after 6 to 12 weeks of consistency. Do not give up!',
  'Writing down your weights and reps is the easiest way to ensure progressive overload.',
  'Full range of motion builds more strength than half reps.',
  'Caffeine helps performance, but at night it ruins your sleep.',
  'A belt does not replace a strong core: use it only for heavy loads.',
  'Breathing is part of technique: inhale before lowering, exhale as you lift.',
]

export const QUIZ_EN: Record<string, { q: string; options: string[]; explain: string }> = {
  q1: { q: 'How long should you rest between heavy strength sets (3 to 5 reps)?', options: ['20 seconds', '2 to 3 minutes', '10 minutes'], explain: 'With heavy loads your nervous system and energy (phosphocreatine) need 2 to 3 minutes to perform the same on the next set.' },
  q2: { q: 'What is the classic rep range for hypertrophy?', options: ['1 to 3', '8 to 12', '30 to 50'], explain: '8 to 12 reps close to failure is the most used range to build mass, although other ranges work too if you get close to failure.' },
  q3: { q: 'How much protein per day is recommended to build muscle?', options: ['0.5 g per kg of bodyweight', '1.6 to 2.2 g per kg of bodyweight', '5 g per kg of bodyweight'], explain: 'Evidence points to 1.6 to 2.2 g of protein per kg of bodyweight per day to maximize muscle gain.' },
  q4: { q: 'When does muscle actually grow?', options: ['While you train', 'While you rest and sleep', 'Only on Sundays'], explain: 'Training is the stimulus; repair and growth happen during rest, especially while sleeping.' },
  q5: { q: 'How many hours of sleep are recommended to recover well?', options: ['4 to 5', '7 to 9', '12 to 14'], explain: 'Sleeping 7 to 9 hours improves recovery and strength, and regulates hormones like testosterone and cortisol.' },
  q6: { q: 'In the squat, where should your knees point?', options: ['Inward', 'In the direction of your toes', 'Backward'], explain: 'Knees should follow the line of your feet. Letting them cave in (valgus) raises the risk of injury.' },
  q7: { q: 'What is "progressive overload"?', options: ['Training through pain', 'Gradually increasing the stimulus (weight, reps or sets)', 'Eating twice as much'], explain: 'To keep progressing your body needs a slightly bigger stimulus over time: more weight, more reps or better technique.' },
  q8: { q: 'What does creatine do?', options: ['Burns fat directly', 'Helps you have more energy in short, intense efforts', 'Replaces food'], explain: 'Creatine monohydrate increases phosphocreatine stores, which helps on short, intense sets. It is one of the most studied supplements.' },
  q9: { q: 'What is the typical dose of creatine monohydrate?', options: ['3 to 5 g per day', '50 g per day', '1 g per week'], explain: '3 to 5 g daily is enough. You do not need a "loading phase" if you are consistent.' },
  q10: { q: 'On the bench press, how should your shoulder blades be?', options: ['Apart and relaxed', 'Together and down', 'It does not matter'], explain: 'Retracted and depressed shoulder blades protect the shoulder and give you a stable base to press from.' },
  q11: { q: 'Which muscles does the Romanian deadlift mainly work?', options: ['Biceps', 'Hamstrings and glutes', 'Chest'], explain: 'The hip hinge of the RDL stretches and heavily works the hamstrings and glutes.' },
  q12: { q: 'Why is it important to warm up before training?', options: ['It is not important', 'It raises muscle temperature and prepares the joints', 'It is only for sweating'], explain: 'Warming up improves performance and lowers injury risk. Do ramp-up sets with less weight.' },
  q13: { q: 'How much water should you drink on a training day?', options: ['Only when you feel dizzy', 'About 35 ml per kg of bodyweight, plus what you sweat', 'None, to look shredded'], explain: 'A useful reference is ~35 ml per kg of bodyweight, plus replacing sweat. Losing 2% of water already lowers performance.' },
  q14: { q: 'What does "training to failure" mean?', options: ['Doing reps until you cannot complete another with good form', 'Canceling the workout', 'Dropping the bar'], explain: 'It means reaching the point where you cannot complete another rep with good technique. You do not need it on every set.' },
  q15: { q: 'What is "RIR 2"?', options: ['Resting 2 minutes', 'Ending the set with 2 reps in reserve', 'Doing 2 sets'], explain: 'RIR = reps in reserve. RIR 2 means you could have done 2 more reps.' },
  q16: { q: 'How many times per week should you train each muscle to grow?', options: ['Once a month', 'About 2 times per week', '7 times per week to failure'], explain: 'Training each group about twice a week usually gives better results than once.' },
  q17: { q: 'On the lat pulldown, where do you bring the bar?', options: ['Behind the neck', 'To the upper chest', 'To the belly button'], explain: 'Bringing it to the upper chest with a slight lean back is safer for the shoulder than behind the neck.' },
  q18: { q: 'What is a lifting belt for?', options: ['To look cool', 'To increase abdominal pressure and stabilize the trunk on heavy loads', 'To slim your waist'], explain: 'The belt gives your abs something to push against, increasing intra-abdominal pressure on heavy lifts.' },
  q19: { q: 'Which Peruvian food is a good source of protein?', options: ['Toasted corn (cancha)', 'Rotisserie chicken (easy on the fries)', 'Chicha morada'], explain: 'Chicken is quality protein. Ceviche and fish are excellent options too.' },
  q20: { q: 'What does quinoa provide?', options: ['Only sugar', 'Carbs, fiber and complete protein', 'Nothing'], explain: 'Quinoa is an Andean superfood: it has the essential amino acids, fiber and energy to train.' },
  q21: { q: 'What is best for burning fat?', options: ['Doing a thousand crunches', 'Calorie deficit + strength training', 'Wearing a waist trainer all day'], explain: 'You cannot burn fat from one spot. You lose fat with a calorie deficit; strength training helps keep muscle.' },
  q22: { q: 'On the leg press, what should you NOT do at the top?', options: ['Breathe', 'Slam your knees into lockout', 'Push with your whole foot'], explain: 'Locking the knees under a heavy load puts a lot of stress on the joint. Keep a slight bend.' },
  q23: { q: 'What is the typical lowering time on a controlled rep?', options: ['Just drop it', '2 to 3 seconds', '30 seconds'], explain: 'Lowering over 2 to 3 seconds increases time under tension and improves technique.' },
  q24: { q: 'How should you breathe on a heavy lift?', options: ['Hold your breath for the whole set', 'Take air and brace your core before each rep (bracing)', 'Breathe fast nonstop'], explain: 'Inhale, brace, do the rep and exhale. That is how you stabilize your spine.' },
  q25: { q: 'What is a good post-workout meal?', options: ['Nothing, fasting', 'Protein + carbs in the following hours', 'Just soda'], explain: 'Protein to repair and carbs to refill glycogen. It is not urgent to the minute, but within the next hours.' },
  q26: { q: 'What is a superset?', options: ['Two exercises back to back with no rest between them', 'A set of 100 reps', 'Training twice a day'], explain: 'A superset chains two exercises with no rest between them. It saves time and raises intensity.' },
  q27: { q: 'What is a circuit?', options: ['A car race', 'Several exercises in a row with little rest, repeated in rounds', 'A single very heavy exercise'], explain: 'Circuits chain several exercises with little rest: great for endurance and conditioning.' },
  q28: { q: 'What should you do if you feel sharp joint pain while training?', options: ['Keep going with more weight', 'Stop and check your technique or see a professional', 'Take pre-workout'], explain: 'Sharp pain is a warning sign. Muscle soreness is normal; stabbing joint pain is not.' },
  q29: { q: 'What is muscle soreness (DOMS)?', options: ['Delayed muscle pain after a new or intense stimulus', 'A serious injury', 'Lactic acid stuck for days'], explain: 'It is delayed onset muscle soreness (24 to 72 h). It is not lactic acid and does not necessarily mean a better workout.' },
  q30: { q: 'Why technique before weight?', options: ['To take longer', 'To progress without injury and work the right muscle', 'It is pointless'], explain: 'With good technique the target muscle really works and you lower injury risk. The weight comes later.' },
  q31: { q: 'Which muscle group does the hip thrust work?', options: ['Glutes', 'Chest', 'Traps'], explain: 'The hip thrust is one of the best exercises for the glutes because of the tension it creates in hip extension.' },
  q32: { q: 'What is a 1RM?', options: ['The max weight you can lift 1 time', 'A one-month routine', 'A type of protein'], explain: 'It is your one-rep max. You can estimate it safely with formulas like Epley.' },
  q33: { q: 'How long does it take to notice visible muscle changes?', options: ['One week', '6 to 12 weeks of consistency', 'One day'], explain: 'The first weeks mostly improve coordination. Visible changes usually show after 6 to 12 consistent weeks.' },
  q34: { q: 'What does caffeinated pre-workout do?', options: ['Builds muscle on its own', 'Gives energy and focus; it does not replace sleep or eating well', 'It is mandatory'], explain: 'Caffeine (3 to 6 mg per kg) improves performance, but does not replace rest. Avoid it at night.' },
  q35: { q: 'On the barbell row, how should your back be?', options: ['Rounded', 'Neutral and tight', 'Fully vertical'], explain: 'A neutral back protects the spine while the lats and rhomboids do the work.' },
  q36: { q: 'What is a "deload" week?', options: ['A week with less volume or weight to recover', 'Quitting the gym forever', 'Training twice as much'], explain: 'Lowering the load every so often lets joints and the nervous system recover so you keep progressing.' },
  q37: { q: 'Why train legs too?', options: ['No need', 'Muscle balance, overall strength and more calories burned', 'Only for athletes'], explain: 'Legs have the biggest muscles in your body: they improve strength, posture and metabolism. Never skip leg day!' },
  q38: { q: 'What is "full range of motion"?', options: ['Moving the weight as far as the joint allows, under control', 'Doing fast half reps', 'Walking around the whole gym'], explain: 'Full range usually gives more strength and muscle gains than half reps.' },
  q39: { q: 'Is it a good idea to train the same muscle to failure every day?', options: ['Yes, more is better', 'No, a muscle needs 48 to 72 h to recover from hard work', 'Only on Mondays'], explain: 'Training a muscle hard without recovery stalls progress and raises injury risk.' },
  q40: { q: 'What is best when starting at the gym?', options: ["Copying a champion's routine", 'A simple routine with basic lifts and good technique', 'Only arm machines'], explain: 'The basics (squat, press, row, deadlift) with good technique give the best results when starting.' },
}

type LessonText = {
  title: string
  badge: string
  body: string[]
  quiz: { q: string; options: string[]; why: string }[]
}

export const LESSONS_EN: Record<string, LessonText> = {
  rir: {
    title: 'RIR: reps in reserve',
    badge: 'Iron brain',
    body: [
      'RIR = how many more reps you could do with good technique when you end the set.',
      'RIR 2 means you stopped when you still had 2 clean reps left.',
      'To grow, most sets go between RIR 1 and 3. You do not need to hit failure every time.',
      'If you finish with RIR 5 or more, the weight is too light: go up.',
    ],
    quiz: [
      { q: 'You finish the set and feel you could do 2 more good ones. Your RIR?', options: ['0', '2', '5'], why: 'RIR counts the clean reps you had left: 2.' },
      { q: 'At what RIR do most muscle-building sets go?', options: ['Between 1 and 3', 'Always 0 (failure)', 'More than 6'], why: 'Close to failure without reaching it: high stimulus, controlled fatigue.' },
      { q: 'You do 10 reps and had 6 more left. What do you do?', options: ['Same weight', 'Lower the weight', 'Raise the weight'], why: 'With that much margin the stimulus is low: add weight.' },
    ],
  },
  '1rm': {
    title: '1RM: your max',
    badge: 'Human calculator',
    body: [
      '1RM is the most weight you can lift ONE time with good technique.',
      'You do not need to test it: you estimate it. Epley formula: 1RM ≈ weight × (1 + reps / 30).',
      'Example: 80 kg × 6 reps → 80 × 1.2 = 96 kg estimated 1RM.',
      'Strength: 80–90% of 1RM. Hypertrophy: 65–80%. Endurance: under 65%.',
    ],
    quiz: [
      { q: 'What is the 1RM?', options: ['The weight you lift 10 times', 'The max for 1 repetition', 'Your bodyweight'], why: '1RM = one-rep max.' },
      { q: '100 kg × 3 reps. Approximate 1RM (Epley)?', options: ['103 kg', '110 kg', '130 kg'], why: '100 × (1 + 3/30) = 110 kg.' },
      { q: 'What % of 1RM is typically used for hypertrophy?', options: ['30–50%', '65–80%', '95–100%'], why: 'The classic 6–12 rep range.' },
    ],
  },
  overload: {
    title: 'Progressive overload',
    badge: 'Always a little more',
    body: [
      'Muscle grows when you ask it for a little more than last time.',
      'You can add weight, do 1–2 more reps, one more set or improve your technique.',
      'Simple rule: when you complete all sets at the top of the rep range, add 2.5 kg.',
      'Write down your weights. What is not measured does not improve.',
    ],
    quiz: [
      { q: 'What is progressive overload?', options: ['Training every day', 'Asking your body for a little more over time', 'Changing routines every week'], why: 'Progressing little by little is what drives adaptation.' },
      { q: 'You did 4×10 with 40 kg easily. Next session?', options: ['42.5 kg', '60 kg', '30 kg'], why: 'Small, steady jumps: +2.5 kg.' },
      { q: 'Which one is NOT a way to progress?', options: ['More reps with the same weight', 'Worse technique to move more', 'One extra set'], why: 'Sacrificing technique is not progress, it is risk.' },
    ],
  },
  warmup: {
    title: 'A proper warm-up',
    badge: 'Engine on',
    body: [
      '5 minutes of easy cardio to raise your temperature (bike, elliptical, jumping jacks).',
      'Mobility for the joints you are about to use: shoulders, hips, ankles.',
      'Ramp-up sets: empty bar, then 50% and 75% of your working weight with few reps.',
      'Long static stretching works better after training, not before.',
    ],
    quiz: [
      { q: 'What is a good ramp-up set for an 80 kg squat?', options: ['80 kg × 15', '40 kg × 5', '100 kg × 1'], why: 'Light weight, few reps: you warm up without getting tired.' },
      { q: 'How much easy cardio to start?', options: ['About 5 minutes', '45 minutes', 'None'], why: 'Enough to raise your temperature without burning energy.' },
      { q: 'When is long static stretching best?', options: ['Before lifting heavy', 'After training', 'Between strength sets'], why: 'Before it can sap strength; after it helps you relax.' },
    ],
  },
  plates: {
    title: 'How to load the bar',
    badge: 'Plate master',
    body: [
      "The Olympic bar weighs 20 kg (the women's bar 15 kg). It counts toward the total.",
      'Olympic colors: red 25, blue 20, yellow 15, green 10, white 5 kg.',
      'For 60 kg: (60 − 20) / 2 = 20 kg per side → one blue plate on each side.',
      'Always use the collars and load both sides evenly. And put your plates back!',
    ],
    quiz: [
      { q: 'How much does a standard Olympic bar weigh?', options: ['10 kg', '20 kg', '25 kg'], why: "20 kg; the women's bar is 15 kg." },
      { q: 'You want 100 kg total. What goes on each side?', options: ['50 kg', '40 kg', '25 kg'], why: '(100 − 20) / 2 = 40 kg per side: one red and one yellow.' },
      { q: 'What color is the 20 kg plate?', options: ['Red', 'Blue', 'Green'], why: 'Blue = 20, red = 25, green = 10.' },
    ],
  },
  pin: {
    title: 'The cable stack pin',
    badge: 'Machine king',
    body: [
      'On plate-stack machines (pulldown, cable) you pick the weight with the pin.',
      'Push the pin all the way into the plate with the number you want: that plate and all above it lift.',
      'Adjust the seat and thigh pad before starting: your thighs should be locked under the pad.',
      'Never let it slam: the plates crash and the cable suffers. Return it under control.',
    ],
    quiz: [
      { q: 'You put the pin in the 40 plate. How much do you lift?', options: ['Only that plate', 'The plates from the top down to 40', 'The whole stack'], why: 'The pin hooks that plate and every plate above it.' },
      { q: 'What do you adjust before a lat pulldown?', options: ['Seat and thigh pad', 'Nothing', 'The height of the low pulley'], why: 'The pad locks you in so the weight does not lift you up.' },
      { q: 'When you finish the set, how do you let go?', options: ['Let it slam', 'Under control until the plates rest', 'Let go mid-air'], why: 'Slamming damages the machine and can hurt someone.' },
    ],
  },
}

export const TECH_LESSON_EN = {
  badge: (name: string) => `Technique: ${name}`,
  q1: (name: string) => `What does the ${name.toLowerCase()} mainly work?`,
  why1: (name: string, muscles: string) => `${name}: ${muscles}.`,
  q2: 'Which one is a CORRECT technique cue?',
  q3: 'Which of these is a common MISTAKE?',
  why3: 'Spotting the mistake in time keeps you injury-free.',
}

export const SCHOOL_EN = {
  dayTips: {
    push: 'Warm up your shoulders with 2 light sets before pressing.',
    pull: 'Think about driving your elbows back, not pulling with your hands.',
    legs: 'Wear knee sleeves if your knees like them and drink water between sets.',
  },
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  badges: ['Consistent', 'Iron week', 'Gym legend'],
  me: 'Me',
}

export const MISSIONS_EN = {
  reps: (t: number) => `Do ${t} good reps`,
  perfect: (t: number) => `Nail ${t} perfect reps`,
  station: (t: number, s: string) => `Complete ${t} ${s} blocks`,
  kg: (t: number) => `Move ${t.toLocaleString('en-US')} kg in total`,
  sessions: (t: number) => `Train ${t} times`,
  combo: (t: number) => `Hit a ${t} combo`,
  quiz: (t: number) => `Answer ${t} of the Coach's ${t > 1 ? 'questions' : 'question'} right`,
  routine: () => 'Complete a routine or circuit',
  pr: () => 'Break a personal record',
}

export const COACH_EN: Record<CoachMoment, string[]> = {
  demoIntro: [
    'Watch closely, I will teach you the {name}. This works {muscles}.',
    'Pay attention: {name}. What lights up red is what works: {muscles}.',
    'Technique first, weight later. {name}: {muscles}.',
  ],
  demoMistake: [
    'Careful, this is WRONG: {mistake}. That is how you get hurt.',
    'Classic gym mistake: {mistake}. Do not do it.',
    'NOT like this, champ: {mistake}.',
  ],
  demoCorrect: [
    'Now that is it! Controlled, breathing and full range.',
    'This is clean technique: slow on the way down, strong on the way up.',
    'That is it! Quality over quantity.',
  ],
  demoDone: [
    'Now it is your turn! Tomorrow at the gym you do it just like this.',
    'You know how it goes. Now prove it.',
    'Done, you learned it. Now get to work!',
  ],
  lesson: ['Quick class, this will help you at the real gym.', 'Listen up, they do not teach you this on TikTok.'],
  welcome: [
    'You made it, {name}! Today we go all in.',
    'Hey, {name}! The iron was waiting for you.',
    'Welcome to Bonnetty, {name}! Today is non-negotiable.',
    '{name}, warm up well because today we go hard.',
  ],
  welcomeBack: [
    'Where were you yesterday, {name}? The iron waits for no one.',
    'You lost your streak, {name}. Make up for it today, okay?',
    'Long time no see, champ. Muscles do not grow on their own.',
  ],
  sunday: [
    'Sunday rest day, {name}. Muscle grows while you rest.',
    'Today is recovery: sleep well, eat protein and tomorrow you crush it.',
  ],
  tip: [
    'Tap inside the green zone. The gold center is the perfect rep.',
    'More weight gives more XP, but the zone shrinks. Your call.',
    'Daily missions pay well. Check them, do not be lazy.',
    'Shop gear boosts your stats forever.',
    'Combos multiply your XP. Do not break them!',
    'Come back tomorrow: the daily streak pays more every time.',
    'Every level makes you bigger. Look in the mirror.',
    'Routines give bonuses. Good things take work, champ.',
    'Open your supplement box, it should be ready by now.',
    'Challenge a friend on WhatsApp: if they beat you and send it back, you both win lucas.',
  ],
  pickStation: [
    'What is it today? Chest, back or legs?',
    'Pick a machine. And do not tell me there is no leg day today.',
    'Come on, decide quick before your muscles cool down.',
  ],
  preLift: [
    'Breathe, brace your core and UP!',
    'Technique first, ego later.',
    'Total focus. No looking at your phone.',
    'Shoulder blades together, chest up. Let us go!',
  ],
  perfect: ['PERFECT!', 'That is technique, champ!', 'So clean!', 'Textbook!', 'That is how it is done!'],
  good: ['Good one!', 'Another!', 'Keep going!', 'Yes!', 'Come on, you got this!'],
  miss: [
    'That one does not count! Control it.',
    'Straight back! Focus.',
    'Do not give away reps, champ!',
    'More control on the way down!',
    'Wake up! That weight will not lift itself.',
  ],
  combo: ['Combo x{n}! Do not stop!', 'You are on fire, x{n}!', 'x{n}! That is the attitude!'],
  failed: [
    'You failed... but failure builds too. Drop the weight a bit.',
    'Was that all? Breathe and come back stronger.',
    'No worries, champ. Adjust the weight and go again.',
  ],
  done: [
    'Block complete! That is how champions are built.',
    'Great work! Look at that XP.',
    'That is discipline! I am proud of you.',
  ],
  levelUp: [
    'LEVEL UP! Look at those arms.',
    'New level! You look competition-ready.',
    'You are growing, champ! Energy refilled.',
  ],
  noEnergy: ['Out of energy. Rest a bit or refill it.', 'Even champions rest. Drink some water.'],
  missionReady: ['You have a mission ready to claim, hey!', 'Claim your mission before you forget!'],
  shop: ['Good buy. Good gear makes a good athlete.', 'You are going to look sharp at the gym with that.'],
  lowWeight: [
    'Is that all? Add weight, champ. We come here to grow.',
    'My grandma warms up with that. More load!',
    'If it does not challenge you, it does not change you. Add some kilos.',
  ],
  heavy: ['Whoa, that is heavy! Focus.', 'Legend weight! Watch your technique.'],
  pr: [
    'NEW RECORD! That is what I wanted to see!',
    'PR, champ! Share it, let everyone know.',
    'You broke your mark! You earned a big dinner tonight.',
  ],
  rest: [
    'Breathe. Drink water. The next set is yours.',
    'Rest, but do not cool down.',
    'Read the tip while you rest. Training smart is training too.',
  ],
  secondChance: ['I will give you one more. Do not let me down.', 'Get up! One more chance.'],
  quizRight: ['Correct! Strong and smart.', 'Yes! You can tell you study.'],
  quizWrong: ['Nope. Read the explanation, it helps at the real gym.', 'Close. Learn it for next time.'],
  routineDone: ['Routine complete! That is training like a pro.', 'Circuit done! You are built like a tank.'],
  challenge: ['You got challenged! Are you going to let them win?', 'A challenge is a challenge. Show them who is boss!'],
}

export const PLAYER_EN: Partial<Record<CoachMoment, string[]>> = {
  perfect: ['Let us go!', 'Yes!', 'Easy!', 'Boom!'],
  miss: ['Ugh...', 'Heavy!', 'Oh, my back...', 'Grind!'],
  done: ['I did it!', 'Awesome!', 'Take that!'],
  levelUp: ['Bigger!', 'New level!'],
  welcome: ['Hey, coach!', 'Let us give it everything!', 'Let us go, coach!'],
  pr: ['RECORD!', 'Nobody stops me!'],
  lowWeight: ['Okay, okay, adding more...', 'Fine coach, more weight.'],
}
