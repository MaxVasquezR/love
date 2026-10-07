import type { Pose } from '../core/types'
import { getLang } from '../i18n'
import { COACH_EN, PLAYER_EN } from '../i18n/content.en'

export type CoachMoment =
  | 'welcome'
  | 'welcomeBack'
  | 'sunday'
  | 'tip'
  | 'pickStation'
  | 'preLift'
  | 'perfect'
  | 'good'
  | 'miss'
  | 'combo'
  | 'failed'
  | 'done'
  | 'levelUp'
  | 'noEnergy'
  | 'missionReady'
  | 'shop'
  | 'lowWeight'
  | 'heavy'
  | 'pr'
  | 'rest'
  | 'secondChance'
  | 'quizRight'
  | 'quizWrong'
  | 'routineDone'
  | 'challenge'
  | 'demoIntro'
  | 'demoMistake'
  | 'demoCorrect'
  | 'demoDone'
  | 'lesson'
  | 'stall'
  | 'lowTank'
  | 'oneMore'
  | 'rirBonus'
  | 'greedy'

export type Mood = 'hype' | 'exigente' | 'decepcionado' | 'orgulloso' | 'calmado'

const MOOD_POSE: Record<Mood, Pose[]> = {
  hype: ['cheer', 'fist'],
  exigente: ['point', 'cross'],
  decepcionado: ['facepalm', 'cross'],
  orgulloso: ['clap', 'flex'],
  calmado: ['idle', 'point'],
}

const MOMENT_MOOD: Record<CoachMoment, Mood> = {
  welcome: 'hype',
  welcomeBack: 'exigente',
  sunday: 'calmado',
  tip: 'calmado',
  pickStation: 'exigente',
  preLift: 'exigente',
  perfect: 'orgulloso',
  good: 'hype',
  miss: 'exigente',
  combo: 'hype',
  failed: 'decepcionado',
  done: 'orgulloso',
  levelUp: 'orgulloso',
  noEnergy: 'calmado',
  missionReady: 'hype',
  shop: 'calmado',
  lowWeight: 'exigente',
  heavy: 'hype',
  pr: 'orgulloso',
  rest: 'calmado',
  secondChance: 'exigente',
  quizRight: 'orgulloso',
  quizWrong: 'decepcionado',
  routineDone: 'orgulloso',
  challenge: 'hype',
  demoIntro: 'calmado',
  demoMistake: 'decepcionado',
  demoCorrect: 'orgulloso',
  demoDone: 'hype',
  lesson: 'calmado',
  stall: 'hype',
  lowTank: 'exigente',
  oneMore: 'exigente',
  rirBonus: 'orgulloso',
  greedy: 'decepcionado',
}

const COACH: Record<CoachMoment, string[]> = {
  demoIntro: [
    'Mira bien, te enseño el {name}. Aquí trabajas {muscles}.',
    'Atento: {name}. Lo que se pone rojo es lo que trabaja: {muscles}.',
    'Primero la técnica, después el peso. {name}: {muscles}.',
  ],
  demoMistake: [
    'Ojo, esto está MAL: {mistake}. Así te lesionas.',
    'Error típico del gym: {mistake}. No lo hagas.',
    'Así NO, causa: {mistake}.',
  ],
  demoCorrect: [
    '¡Así sí! Controlado, respirando y con todo el recorrido.',
    'Esto es técnica limpia: lento al bajar, fuerte al subir.',
    '¡Eso es! Calidad antes que cantidad.',
  ],
  demoDone: [
    '¡Ahora te toca a ti! Mañana en el gym lo haces igualito.',
    'Ya sabes cómo es. Ahora a demostrarlo.',
    'Listo, aprendiste. ¡Ahora a chambear!',
  ],
  lesson: [
    'Clase rápida, que esto te sirve en el gym de verdad.',
    'Escucha bien, esto no te lo enseñan en TikTok.',
  ],
  stall: ['¡EMPUJA! ¡Toca, toca, toca!', '¡No la sueltes! ¡Pasa el punto duro!', '¡Ahí es donde se crece! ¡Empuja!'],
  lowTank: [
    'Te queda poco en el tanque. Piensa bien la siguiente.',
    'Ya te estás quemando. ¿Cuántas te quedan de verdad?',
  ],
  oneMore: [
    '¡Serie cumplida! ¿Una más o paras? Si te quedan 1 o 2, para y cobras el bonus.',
    '¡Listo el objetivo! Ahora tú decides: arriesgas una más o terminas.',
    'Bien ahí. ¿Te queda gasolina? Una más paga 50% más de XP.',
  ],
  rirBonus: [
    '¡RIR {n}! Paraste justo a tiempo, como un pro. Bonus de XP.',
    '¡Eso es entrenar inteligente! Dejaste {n} en el tanque.',
  ],
  greedy: [
    '¡Te pasaste de ambicioso! La serie cuenta, pero sin bonus.',
    'Eso fue el fallo. Para la próxima, para con 1 o 2 en el tanque.',
  ],
  welcome: [
    '¡Llegaste, {name}! Hoy se chambea a full.',
    '¡Habla, {name}! El fierro te estaba esperando.',
    '¡Bienvenido a Bonnetty, {name}! Hoy no se negocia.',
    '{name}, calienta bien que hoy vamos con todo.',
  ],
  welcomeBack: [
    '¿Dónde estuviste ayer, {name}? El fierro no espera a nadie.',
    'Perdiste la racha, {name}. Hoy lo compensas, ¿ya?',
    'Mucho tiempo sin verte, causa. Los músculos no crecen solos.',
  ],
  sunday: [
    'Domingo de descanso, {name}. El músculo crece cuando descansas.',
    'Hoy toca recuperar: duerme bien, come proteína y mañana revientas.',
  ],
  tip: [
    'Arrastra la barra hacia arriba y bájala lento: así sale la rep perfecta.',
    'Más peso da más XP, pero sube más lento y el punto duro pesa más. Tú decides.',
    'Mira tu tanque: si paras con 1 o 2 reps de sobra, te llevas el bonus RIR.',
    'Las misiones del día pagan bien. Revísalas, no seas flojo.',
    'El equipo de la tienda sube tus stats para siempre.',
    'Los combos multiplican tu XP. ¡No los rompas!',
    'Regresa mañana: la racha diaria paga cada vez más.',
    'Cada nivel te pone más grande. Mírate en el espejo.',
    'Las rutinas dan bonus. Lo bueno cuesta, causa.',
    'Abre tu caja de suplementos, que ya debe estar lista.',
    '¡Reta a un pata por WhatsApp! Si te supera y te lo devuelve, los dos ganan lucas.',
  ],
  pickStation: [
    '¿Qué toca hoy? ¿Pecho, espalda o pierna?',
    'Elige máquina. Y no me digas que hoy no hay pierna.',
    'Vamos, decide rápido que se enfría el músculo.',
  ],
  preLift: [
    'Respira, aprieta el core y ¡arriba!',
    'Técnica primero, ego después.',
    'Concentración total. Nada de mirar el celular.',
    'Escápulas juntas, pecho arriba. ¡Vamos!',
  ],
  perfect: ['¡PERFECTA!', '¡Eso es técnica, causa!', '¡Limpiecita!', '¡De manual!', '¡Así se hace!'],
  good: ['¡Buena!', '¡Otra!', '¡Sigue, sigue!', '¡Eso!', '¡Vamos que se puede!'],
  miss: [
    '¡Esa no cuenta! Controla.',
    '¡Espalda recta! Concéntrate.',
    '¡No regales reps, causa!',
    '¡Más control en la bajada!',
    '¡Despierta! Ese peso no se levanta solo.',
  ],
  combo: ['¡Combo x{n}! ¡No pares!', '¡Estás on fire, x{n}!', '¡x{n}! ¡Esa es la actitud!'],
  failed: [
    'Fallaste... pero el fallo también construye. Baja un poco el peso.',
    '¿Eso fue todo? Respira y vuelve más fuerte.',
    'No pasa nada, campeón. Ajusta el peso y dale de nuevo.',
  ],
  done: [
    '¡Bloque completo! Así se construye un campeón.',
    '¡Bien chambeado! Mira esa XP.',
    '¡Eso es disciplina! Me tienes orgullosa.',
  ],
  levelUp: [
    '¡SUBISTE DE NIVEL! Mírate esos brazos.',
    '¡Nuevo nivel! Ya pareces de competencia.',
    '¡Estás creciendo, causa! Energía recargada.',
  ],
  noEnergy: [
    'Sin energía. Descansa un toque o recárgala.',
    'Hasta los campeones descansan. Tómate tu agua.',
  ],
  missionReady: ['¡Tienes una misión lista para cobrar, oe!', '¡Cobra tu misión antes que se te olvide!'],
  shop: ['Buena compra. El buen equipo hace al buen atleta.', 'Con eso vas a verte bacán en el gym.'],
  lowWeight: [
    '¿Eso es todo? Sube el peso, causa. Aquí venimos a crecer.',
    'Con ese peso calienta mi abuelita. ¡Más carga!',
    'Si no te cuesta, no te cambia. Ponle más kilos.',
  ],
  heavy: ['¡Uy, eso está pesado! Concéntrate.', '¡Peso de leyenda! Cuidado con la técnica.'],
  pr: [
    '¡NUEVO RÉCORD! ¡Eso es lo que quería ver!',
    '¡PR, causa! Compártelo, que todos se enteren.',
    '¡Rompiste tu marca! Hoy te ganaste el lomo saltado.',
  ],
  rest: [
    'Respira. Toma agua. La siguiente serie es tuya.',
    'Descansa, pero no te enfríes.',
    'Aprovecha y lee el tip. Entrenar con cabeza también es entrenar.',
  ],
  secondChance: ['Te doy una más. No me falles.', '¡Levántate! Una oportunidad más.'],
  quizRight: ['¡Correcto! Además de fuerte, sabido.', '¡Eso! Se nota que estudias.'],
  quizWrong: ['Nop. Lee bien la explicación, que eso te sirve en el gym real.', 'Casi. Apréndelo para la próxima.'],
  routineDone: ['¡Rutina completa! Eso es entrenar como profesional.', '¡Terminaste el circuito! Estás hecho un tanque.'],
  challenge: ['¡Te retaron! ¿Vas a dejar que te ganen?', 'Un reto es un reto. ¡A demostrar quién manda!'],
}

const PLAYER: Partial<Record<CoachMoment, string[]>> = {
  perfect: ['¡Vamos!', '¡Sí, causa!', '¡Fácil!', '¡Toma!'],
  miss: ['Uff...', '¡Pesa!', 'Ay, mi espalda...', '¡Chamba!'],
  stall: ['¡Aaargh!', '¡Vamos, vamos!', '¡Sube, sube!'],
  done: ['¡Lo logré!', '¡Bacán!', '¡Toma eso!'],
  levelUp: ['¡Más grande!', '¡Nivel nuevo!'],
  welcome: ['¡Habla, profe!', '¡A darle con todo!', '¡Vamos, profe!'],
  pr: ['¡RÉCORD!', '¡Nadie me para!'],
  lowWeight: ['Ya, ya, le subo...', 'Ok profe, más peso.'],
}

function pick(list: string[] | undefined) {
  if (!list?.length) return null
  return list[Math.floor(Math.random() * list.length)]
}

export function coachLine(moment: CoachMoment, vars: Record<string, string | number> = {}) {
  const line = pick((getLang() === 'en' ? COACH_EN : COACH)[moment]) ?? ''
  return line.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''))
}

export function coachPose(moment: CoachMoment): Pose {
  const options = MOOD_POSE[MOMENT_MOOD[moment]]
  return options[Math.floor(Math.random() * options.length)]
}

export function playerLine(moment: CoachMoment) {
  return pick((getLang() === 'en' ? PLAYER_EN : PLAYER)[moment])
}
