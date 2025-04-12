// Quiz cevapları analiz eden yardımcı sınıf
import { AnswerSummary } from '../types/auraTypes';

/**
 * Quiz cevaplarını analiz edip özetler
 */
export function getAnswerSummary(answers: { [key: number]: string }): AnswerSummary {
  // Cevapların sayılarını say
  const answerCounts = { a: 0, b: 0, c: 0, d: 0 };

  // Her cevabı değerlendir
  Object.values(answers).forEach(answer => {
    if (answer === 'a') answerCounts.a++;
    else if (answer === 'b') answerCounts.b++;
    else if (answer === 'c') answerCounts.c++;
    else if (answer === 'd') answerCounts.d++;
  });

  // En çok ve ikinci en çok verilen cevabı bul
  let dominant = 'a';
  let secondary = 'a';
  let maxCount = answerCounts.a;
  let secondMaxCount = -1;

  // En çok verilen cevabı bul
  for (const [answer, count] of Object.entries(answerCounts)) {
    if (count > maxCount) {
      secondary = dominant;
      secondMaxCount = maxCount;
      dominant = answer;
      maxCount = count;
    } else if (count > secondMaxCount && answer !== dominant) {
      secondary = answer;
      secondMaxCount = count;
    }
  }

  // Cevapların desenini oluştur (örn: "3a2b1c2d")
  const answerPattern = `${answerCounts.a}a${answerCounts.b}b${answerCounts.c}c${answerCounts.d}d`;

  // Dominant ve secondary özelliklere göre kişilik özelliklerini belirle
  let dominantTrait = '';
  let secondaryTrait = '';

  switch (dominant) {
    case 'a':
      dominantTrait = 'analitik';
      break;
    case 'b':
      dominantTrait = 'yaratıcı';
      break;
    case 'c':
      dominantTrait = 'empatik';
      break;
    case 'd':
      dominantTrait = 'enerjik';
      break;
  }

  switch (secondary) {
    case 'a':
      secondaryTrait = 'analitik';
      break;
    case 'b':
      secondaryTrait = 'yaratıcı';
      break;
    case 'c':
      secondaryTrait = 'empatik';
      break;
    case 'd':
      secondaryTrait = 'enerjik';
      break;
  }

  // Cevap detaylarını okunabilir metin olarak hazırla
  const answerDetails = Object.entries(answers)
    .map(([questionNumber, answer]) => {
      return `Soru ${questionNumber}: ${answer}`;
    })
    .join('\n');

  return {
    answerCounts,
    answerPattern,
    answerDetails,
    dominantTrait,
    secondaryTrait
  };
}

/**
 * Cevaplara göre dinamik aura tipi belirler
 */
export function determineDynamicAuraType(answers: { [key: number]: string }): string {
  const summary = getAnswerSummary(answers);
  // Basitçe dominant özelliği döndür
  return summary.dominantTrait;
} 