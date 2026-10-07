import { getLang } from '../i18n'
import { TIPS_EN } from '../i18n/content.en'

export const TIPS: string[] = [
  'El músculo no crece en el gym: crece cuando descansas y duermes.',
  'Dormir menos de 6 horas puede bajar tu fuerza y frenar tu recuperación.',
  'Entre 1.6 y 2.2 g de proteína por kg de peso al día es lo ideal para ganar músculo.',
  'Bajar el peso en 2 a 3 segundos aumenta el tiempo bajo tensión.',
  'La creatina es de los suplementos más estudiados: 3 a 5 g al día.',
  'Calienta con series ligeras antes de ir pesado: tus articulaciones te lo agradecerán.',
  'No puedes quemar grasa solo de la barriga con abdominales: se baja grasa con déficit calórico.',
  'Para fuerza descansa 2 a 3 minutos; para hipertrofia, 60 a 90 segundos.',
  'Las agujetas no significan que entrenaste mejor; son normales al empezar.',
  'Entrenar cada músculo 2 veces por semana suele dar mejores resultados.',
  'El pollo a la brasa es proteína... pero cuidado con las papas y las cremas.',
  'El cebiche es una gran fuente de proteína magra. ¡Bien peruano y bien fit!',
  'La quinua tiene proteína completa y te da energía para entrenar.',
  'Toma agua antes, durante y después de entrenar. Perder 2% de líquido ya baja el rendimiento.',
  'La técnica primero: un peso bien movido vale más que un récord mal hecho.',
  'Aprieta el core antes de cada rep pesada: protege tu columna.',
  'Cada 6 a 8 semanas, una semana de descarga ayuda a seguir progresando.',
  'Nunca te saltes el día de pierna: son los músculos más grandes del cuerpo.',
  'Las sentadillas profundas con buena técnica son seguras para las rodillas sanas.',
  'Los cambios visibles llegan entre 6 y 12 semanas de constancia. ¡No te rindas!',
  'Anotar tus pesos y reps es la forma más fácil de asegurar la sobrecarga progresiva.',
  'El rango completo de movimiento da más fuerza que las medias repeticiones.',
  'La cafeína ayuda a rendir, pero tomada de noche arruina tu sueño.',
  'Un cinturón no reemplaza un core fuerte: úsalo solo en cargas altas.',
  'Respirar bien es parte de la técnica: inspira antes de bajar, exhala al subir.',
]

export function randomTip() {
  const list = getLang() === 'en' ? TIPS_EN : TIPS
  return list[Math.floor(Math.random() * list.length)]
}
