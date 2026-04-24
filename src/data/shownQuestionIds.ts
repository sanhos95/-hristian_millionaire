import type { BibleQuestion } from './bibleQuestionType'

/** Базовий id питання в банку (без суфікса дубліката колоди). */
export function baseQuestionId(id: string): string {
  return id.replace(/__d\d+$/, '')
}

const STORAGE_KEY = 'cristian-games-shown-question-ids'
const MAX_STORED_IDS = 5000

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined'
}

/** Завантажує множину вже показаних питань (між сесіями). */
export function loadShownQuestionIds(): Set<string> {
  if (!canUseStorage()) return new Set()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as unknown
    if (!Array.isArray(arr)) return new Set()
    return new Set(arr.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function saveShownQuestionIds(ids: Set<string>): void {
  if (!canUseStorage()) return
  let arr = [...ids]
  if (arr.length > MAX_STORED_IDS) arr = arr.slice(-MAX_STORED_IDS)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr))
}

/**
 * Якщо у поточному пулі (тема / змішано) замало ще не показаних — очищаємо історію лише для id з цього пулу,
 * щоб гра не застрягала й можна було знову проходити обрану тему.
 */
export function prepareShownSetForPool(pool: BibleQuestion[], deckSize: number): Set<string> {
  const set = loadShownQuestionIds()
  const unused = pool.filter((q) => !set.has(baseQuestionId(q.id)))
  if (unused.length < deckSize) {
    for (const q of pool) set.delete(baseQuestionId(q.id))
    saveShownQuestionIds(set)
  }
  return set
}

/** Додає питання з колоди до «вже показані». */
export function addShownQuestionIdsFromDeck(deck: BibleQuestion[]): void {
  const set = loadShownQuestionIds()
  for (const q of deck) set.add(baseQuestionId(q.id))
  saveShownQuestionIds(set)
}
