import type { TopicFilter } from './topics'
import type { BibleQuestion } from './bibleQuestionType'
import OG_ROWS from '../questions-uk-ogienko.json'
import {
  addShownQuestionIdsFromDeck,
  baseQuestionId,
  prepareShownSetForPool,
} from './shownQuestionIds'

export type { BibleQuestion } from './bibleQuestionType'

/** Повний банк: переклад Огієнка + додаткові питання (`extraQuestions.ts`) */
export const QUESTIONS: BibleQuestion[] = OG_ROWS.map((row, i) => {
  const correct = String((row as any).answer ?? '').trim()
  const wrong = ((row as any).wrongAnswers ?? []) as string[]
  const ref = String((row as any).reference_uk || (row as any).reference || '')
  const og = (row as any).ogienko
  const vLoc = String(og?.loc || ref)
  const vText = String(og?.text || '')

  return {
    id: `og-${i + 1}`,
    text: String((row as any).question ?? ''),
    answers: [correct, String(wrong[0] ?? ''), String(wrong[1] ?? ''), String(wrong[2] ?? '')],
    correctIndex: 0,
    topic: String((row as any).gameTopic ?? 'general') as any,
    ladderStep: (row as any).ladderStep as any,
    reference: ref,
    documentAnswer: correct,
    verseLocation: vLoc,
    verseText: vText,
  } satisfies BibleQuestion
})

/** Завжди стільки питань за раунд, як у класичному форматі */
export const DECK_SIZE = 10

function shuffleQuestionsOrder(list: BibleQuestion[]): BibleQuestion[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Вибір з пулу: не повторювати в межах колоди; спочатку уникати вже показаних у сховищі браузера. */
function pickForDeck(
  pool: BibleQuestion[],
  sessionUsed: Set<string>,
  historyShown: Set<string>,
): BibleQuestion | null {
  const notInSession = pool.filter((q) => !sessionUsed.has(baseQuestionId(q.id)))
  if (notInSession.length === 0) return null
  const fresh = notInSession.filter((q) => !historyShown.has(baseQuestionId(q.id)))
  const source = fresh.length > 0 ? fresh : notInSession
  const shuffled = shuffleQuestionsOrder(source)
  return shuffled[0] ?? null
}

/**
 * Колода з DECK_SIZE питань: сходинки 1…10 по порядку (легше → важче),
 * у межах обраної теми; відповіді на кожному кроці далі перемішуються окремо.
 */
export function buildDeck(filter: TopicFilter): BibleQuestion[] {
  const poolAll = QUESTIONS.filter((q) => filter === 'mixed' || q.topic === filter)
  const historyShown = prepareShownSetForPool(poolAll, DECK_SIZE)
  const sessionUsed = new Set<string>()
  const out: BibleQuestion[] = []

  for (let step = 1; step <= DECK_SIZE; step++) {
    const candidates = poolAll.filter(
      (q) => q.ladderStep === step || q.ladderStep === step - 1 || q.ladderStep === step + 1,
    )

    let picked = pickForDeck(candidates, sessionUsed, historyShown) ?? null
    if (!picked) {
      // Якщо все з потрібних сходинок уже "в історії", дозволяємо брати показані раніше (але не в цій сесії).
      picked = pickForDeck(candidates, sessionUsed, new Set()) ?? null
    }
    if (!picked) throw new Error(`buildDeck: нема питань для step=${step} у межах ±1`)
    sessionUsed.add(baseQuestionId(picked.id))
    out.push(picked)
  }
  addShownQuestionIdsFromDeck(out)
  return out
}

/** Драбина балів під довжину колоди (до 15 сходинок) */
export function prizeLadderForCount(n: number): number[] {
  const full = [100, 500, 1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 500_000, 1_000_000, 1_250_000, 1_500_000, 1_750_000, 2_000_000, 2_500_000]
  if (n <= full.length) return full.slice(0, n)
  const extra = n - full.length
  const tail = Array.from({ length: extra }, (_, i) => 2_500_000 + (i + 1) * 250_000)
  return [...full, ...tail]
}

/** Перемішує варіанти відповіді для одного питання */
export function shuffleAnswers(q: BibleQuestion) {
  const order = [0, 1, 2, 3]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const answers = order.map((i) => q.answers[i]) as [string, string, string, string]
  const correctIndex = order.indexOf(q.correctIndex) as 0 | 1 | 2 | 3
  return { answers, correctIndex }
}
