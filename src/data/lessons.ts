import { EXERCISES } from './exercises'
import { getLang } from '../i18n'
import { LESSONS_EN, TECH_LESSON_EN } from '../i18n/content.en'

export interface QuizQ {
  q: string
  options: string[]
  answer: number
  why: string
}

export interface Lesson {
  id: string
  kind: 'technique' | 'basics'
  icon: string
  title: string
  /** Short paragraphs / bullets the Profe explains. */
  body: string[]
  quiz: QuizQ[]
  /** Badge earned with a perfect quiz. */
  badge: string
  exerciseId?: string
}

export const LESSON_REWARD = 40
export const LESSON_PERFECT_BONUS = 20

const BASICS: Lesson[] = [
  {
    id: 'rir',
    kind: 'basics',
    icon: '🎯',
    title: 'RIR: reps en reserva',
    badge: 'Cerebro de acero',
    body: [
      'RIR = cuántas repeticiones más podrías hacer con buena técnica al terminar la serie.',
      'RIR 2 significa que paraste cuando aún te quedaban 2 reps limpias.',
      'Para crecer, la mayoría de series van entre RIR 1 y 3. No necesitas llegar al fallo siempre.',
      'Si terminas con RIR 5 o más, el peso está muy liviano: súbele.',
    ],
    quiz: [
      { q: 'Terminas la serie y sientes que podías hacer 2 más bien hechas. ¿Tu RIR?', options: ['0', '2', '5'], answer: 1, why: 'RIR cuenta las reps limpias que te quedaban: 2.' },
      { q: '¿En qué RIR van la mayoría de series para ganar músculo?', options: ['Entre 1 y 3', 'Siempre 0 (fallo)', 'Más de 6'], answer: 0, why: 'Cerca del fallo pero sin llegar: estímulo alto, fatiga controlada.' },
      { q: 'Haces 10 reps y te quedaban 6 más. ¿Qué haces?', options: ['Igual peso', 'Bajar peso', 'Subir peso'], answer: 2, why: 'Con tanto margen el estímulo es bajo: sube el peso.' },
    ],
  },
  {
    id: '1rm',
    kind: 'basics',
    icon: '🏆',
    title: '1RM: tu máximo',
    badge: 'Calculadora humana',
    body: [
      '1RM es el peso máximo que levantas UNA vez con buena técnica.',
      'No hace falta probarlo: se estima. Fórmula de Epley: 1RM ≈ peso × (1 + reps / 30).',
      'Ejemplo: 80 kg × 6 reps → 80 × 1,2 = 96 kg de 1RM estimado.',
      'Fuerza: 80–90 % del 1RM. Hipertrofia: 65–80 %. Resistencia: menos del 65 %.',
    ],
    quiz: [
      { q: '¿Qué es el 1RM?', options: ['El peso que levantas 10 veces', 'El máximo para 1 repetición', 'Tu peso corporal'], answer: 1, why: '1RM = una repetición máxima.' },
      { q: '100 kg × 3 reps. ¿1RM aproximado (Epley)?', options: ['103 kg', '110 kg', '130 kg'], answer: 1, why: '100 × (1 + 3/30) = 110 kg.' },
      { q: '¿Qué % del 1RM se usa típicamente para hipertrofia?', options: ['30–50 %', '65–80 %', '95–100 %'], answer: 1, why: 'Rango clásico de 6–12 reps.' },
    ],
  },
  {
    id: 'overload',
    kind: 'basics',
    icon: '📈',
    title: 'Sobrecarga progresiva',
    badge: 'Siempre un poquito más',
    body: [
      'El músculo crece cuando le pides un poquito más que la vez pasada.',
      'Puedes subir peso, hacer 1–2 reps más, una serie más o mejorar la técnica.',
      'Regla simple: cuando completas todas las series con el máximo de reps, sube 2,5 kg.',
      'Anota tus pesos. Lo que no se mide, no mejora.',
    ],
    quiz: [
      { q: '¿Qué es la sobrecarga progresiva?', options: ['Entrenar todos los días', 'Pedirle un poco más al cuerpo con el tiempo', 'Cambiar de rutina cada semana'], answer: 1, why: 'Progresar poco a poco es lo que genera adaptación.' },
      { q: 'Hiciste 4×10 con 40 kg fácil. ¿Siguiente sesión?', options: ['42,5 kg', '60 kg', '30 kg'], answer: 0, why: 'Saltos pequeños y constantes: +2,5 kg.' },
      { q: '¿Cuál NO es una forma de progresar?', options: ['Más reps con igual peso', 'Peor técnica para mover más', 'Una serie extra'], answer: 1, why: 'Sacrificar técnica no es progreso, es riesgo.' },
    ],
  },
  {
    id: 'warmup',
    kind: 'basics',
    icon: '🔥',
    title: 'Calentamiento bien hecho',
    badge: 'Motor encendido',
    body: [
      '5 minutos de cardio suave para subir la temperatura (bici, elíptica, saltos).',
      'Movilidad de las articulaciones que vas a usar: hombros, cadera, tobillos.',
      'Series de aproximación: barra sola, luego 50 % y 75 % del peso de trabajo con pocas reps.',
      'El estiramiento largo y estático mejor después del entreno, no antes.',
    ],
    quiz: [
      { q: '¿Cuál es una buena serie de aproximación para 80 kg de sentadilla?', options: ['80 kg × 15', '40 kg × 5', '100 kg × 1'], answer: 1, why: 'Poco peso, pocas reps: calientas sin cansarte.' },
      { q: '¿Cuánto cardio suave para empezar?', options: ['Unos 5 minutos', '45 minutos', 'Nada'], answer: 0, why: 'Suficiente para subir temperatura sin gastar energía.' },
      { q: '¿Cuándo va mejor el estiramiento estático largo?', options: ['Antes de levantar pesado', 'Después del entreno', 'Entre series de fuerza'], answer: 1, why: 'Antes puede restar fuerza; después ayuda a relajar.' },
    ],
  },
  {
    id: 'plates',
    kind: 'basics',
    icon: '🔴',
    title: 'Cómo cargar la barra',
    badge: 'Maestro de discos',
    body: [
      'La barra olímpica pesa 20 kg (la de mujeres 15 kg). Ya cuenta en el total.',
      'Colores olímpicos: rojo 25, azul 20, amarillo 15, verde 10, blanco 5 kg.',
      'Para 60 kg: (60 − 20) / 2 = 20 kg por lado → un disco azul a cada lado.',
      'Siempre pon los seguros (clips) y carga igual en ambos lados. ¡Y vuelve los discos a su lugar!',
    ],
    quiz: [
      { q: '¿Cuánto pesa la barra olímpica estándar?', options: ['10 kg', '20 kg', '25 kg'], answer: 1, why: '20 kg; la femenina es de 15 kg.' },
      { q: 'Quieres 100 kg en total. ¿Qué va en cada lado?', options: ['50 kg', '40 kg', '25 kg'], answer: 1, why: '(100 − 20) / 2 = 40 kg por lado: un rojo y un amarillo.' },
      { q: '¿De qué color es el disco de 20 kg?', options: ['Rojo', 'Azul', 'Verde'], answer: 1, why: 'Azul = 20, rojo = 25, verde = 10.' },
    ],
  },
  {
    id: 'pin',
    kind: 'basics',
    icon: '📌',
    title: 'El pin de la polea',
    badge: 'Rey de las máquinas',
    body: [
      'En las máquinas de placas (jalón, polea) el peso se elige con el pin.',
      'Mete el pin hasta el fondo en la placa del número que quieres: se levantan esa placa y todas las de arriba.',
      'Ajusta asiento y rodillo antes de empezar: los muslos deben quedar fijos bajo el rodillo.',
      'Nunca sueltes de golpe: las placas chocan y el cable sufre. Regresa controlado.',
    ],
    quiz: [
      { q: 'Pones el pin en la placa de 40. ¿Cuánto levantas?', options: ['Solo esa placa', 'Las placas desde arriba hasta 40', 'Toda la torre'], answer: 1, why: 'El pin engancha esa placa y todas las de encima.' },
      { q: '¿Qué ajustas antes de un jalón al pecho?', options: ['Asiento y rodillo de muslos', 'Nada', 'La altura de la polea de abajo'], answer: 0, why: 'El rodillo te fija para no levantarte con el peso.' },
      { q: 'Al terminar la serie, ¿cómo sueltas?', options: ['De golpe', 'Controlado hasta que las placas se apoyen', 'Lo sueltas en el aire'], answer: 1, why: 'Soltar de golpe daña la máquina y puede lastimar a alguien.' },
    ],
  },
]

/** Deterministic shuffle so the right answer isn't always first. */
function place<T>(right: T, wrong: T[], seed: number): { options: T[]; answer: number } {
  const answer = seed % (wrong.length + 1)
  const options = [...wrong]
  options.splice(answer, 0, right)
  return { options, answer }
}

function techniqueLessons(): Lesson[] {
  const en = getLang() === 'en'
  return EXERCISES.map((ex, i) => {
    const other = EXERCISES[(i + 5) % EXERCISES.length]
    const other2 = EXERCISES[(i + 11) % EXERCISES.length]
    const q1 = place(ex.muscles, [other.muscles, other2.muscles].filter((m) => m !== ex.muscles).slice(0, 2), i)
    const q2 = place(ex.cues[0], [ex.mistakes[0], other.mistakes[0]].filter(Boolean), i + 1)
    const q3 = place(ex.mistakes[ex.mistakes.length > 1 ? 1 : 0], [ex.cues[1] ?? other.cues[0], other2.cues[0]], i + 2)
    return {
      id: `tech-${ex.id}`,
      kind: 'technique' as const,
      icon: '🎬',
      title: ex.name,
      badge: en ? TECH_LESSON_EN.badge(ex.name) : `Técnica: ${ex.name}`,
      exerciseId: ex.id,
      body: [ex.blurb, ...ex.cues.map((c) => `✓ ${c}`), ...ex.mistakes.map((m) => `✗ ${m}`)],
      quiz: [
        {
          q: en ? TECH_LESSON_EN.q1(ex.name) : `¿Qué trabaja principalmente ${ex.name.toLowerCase()}?`,
          ...q1,
          why: en ? TECH_LESSON_EN.why1(ex.name, ex.muscles) : `${ex.name}: ${ex.muscles}.`,
        },
        { q: en ? TECH_LESSON_EN.q2 : '¿Cuál es una clave CORRECTA de técnica?', ...q2, why: ex.cues[0] },
        {
          q: en ? TECH_LESSON_EN.q3 : '¿Cuál de estos es un ERROR común?',
          ...q3,
          why: en ? TECH_LESSON_EN.why3 : 'Detectar el error a tiempo te evita lesiones.',
        },
      ],
    }
  })
}

function basicLessons(): Lesson[] {
  if (getLang() !== 'en') return BASICS
  return BASICS.map((l) => {
    const en = LESSONS_EN[l.id]
    if (!en) return l
    return { ...l, title: en.title, badge: en.badge, body: en.body, quiz: l.quiz.map((q, i) => ({ ...q, ...en.quiz[i] })) }
  })
}

export const LESSONS: Lesson[] = [...basicLessons(), ...techniqueLessons()]

/** Rebuilds the lessons in place after a language change (exercise texts are already swapped). */
export function relocalizeLessons() {
  LESSONS.splice(0, LESSONS.length, ...basicLessons(), ...techniqueLessons())
}

export const lessonById = (id: string) => LESSONS.find((l) => l.id === id)
