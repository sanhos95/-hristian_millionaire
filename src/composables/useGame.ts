import { computed, onScopeDispose, ref } from 'vue'
import {
  buildDeck,
  prizeLadderForCount,
  shuffleAnswers,
  type BibleQuestion,
} from '../data/questions'
import { TIMER_SECONDS_PER_QUESTION, type TopicFilter } from '../data/topics'

export type GamePhase = 'menu' | 'playing' | 'result'

function audienceShares(eligible: number[], correct: number): number[] {
  const pct: number[] = [0, 0, 0, 0]
  const wrong = eligible.filter((i) => i !== correct)
  if (wrong.length === 0) {
    pct[correct] = 100
    return pct
  }
  let remaining = 100
  wrong.forEach((i, idx) => {
    const restSlots = wrong.length - idx - 1
    const hi = Math.max(4, Math.min(24, remaining - restSlots * 4))
    const lo = 4
    const p = lo + Math.floor(Math.random() * Math.max(1, hi - lo + 1))
    pct[i] = p
    remaining -= p
  })
  pct[correct] = remaining
  const maxW = Math.max(...wrong.map((w) => pct[w]!))
  if (pct[correct]! <= maxW) {
    const bump = maxW - pct[correct]! + 6 + Math.floor(Math.random() * 8)
    pct[correct]! += bump
    const donor = wrong.reduce((a, b) => (pct[a]! >= pct[b]! ? a : b))
    pct[donor]! = Math.max(3, pct[donor]! - bump)
  }
  const tot = pct.reduce((a, b) => a + b, 0)
  pct[correct]! += 100 - tot
  return pct
}

function eligibleIndices(hidden: Set<number>): number[] {
  return [0, 1, 2, 3].filter((i) => !hidden.has(i))
}

export function useGame() {
  let tickHandle: ReturnType<typeof setInterval> | null = null

  const phase = ref<GamePhase>('menu')
  const pendingTopic = ref<TopicFilter>('mixed')

  const deck = ref<BibleQuestion[]>([])
  const roundIndex = ref(0)
  const current = ref<ReturnType<typeof shuffleAnswers> | null>(null)
  const activeQuestion = ref<BibleQuestion | null>(null)
  const fiftyUsed = ref(false)
  const hiddenBy50 = ref<Set<number>>(new Set())
  const selectedIndex = ref<number | null>(null)
  const isWin = ref(false)

  const hallUsed = ref(false)
  const hallPercents = ref<number[] | null>(null)
  const verseUsed = ref(false)
  const verseModalOpen = ref(false)

  const sessionTimeLimit = ref(60)
  const timeLeft = ref(60)
  const timedOut = ref(false)

  const ladderValues = computed(() => prizeLadderForCount(deck.value.length || 1))

  const totalRounds = computed(() => deck.value.length)

  const ladderDisplay = computed(() =>
    [...ladderValues.value].map((value, i) => ({ value, i })).reverse(),
  )

  function clearQuestionTimer() {
    if (tickHandle !== null) {
      clearInterval(tickHandle)
      tickHandle = null
    }
  }

  function onQuestionTimedOut() {
    if (phase.value !== 'playing' || selectedIndex.value !== null) return
    timedOut.value = true
    isWin.value = false
    phase.value = 'result'
  }

  function startQuestionTimer() {
    clearQuestionTimer()
    if (phase.value !== 'playing') return
    timeLeft.value = sessionTimeLimit.value
    tickHandle = setInterval(() => {
      if (phase.value !== 'playing' || selectedIndex.value !== null) {
        clearQuestionTimer()
        return
      }
      timeLeft.value -= 1
      if (timeLeft.value <= 0) {
        clearQuestionTimer()
        onQuestionTimedOut()
      }
    }, 1000)
  }

  onScopeDispose(() => clearQuestionTimer())

  function refreshHall() {
    if (!current.value || phase.value !== 'playing') return
    const el = eligibleIndices(hiddenBy50.value)
    if (!el.includes(current.value.correctIndex)) return
    hallPercents.value = audienceShares(el, current.value.correctIndex)
  }

  function chooseTopic() {
    beginQuiz()
  }

  function beginQuiz() {
    clearQuestionTimer()
    timedOut.value = false
    sessionTimeLimit.value = TIMER_SECONDS_PER_QUESTION
    deck.value = buildDeck('mixed')
    phase.value = 'playing'
    roundIndex.value = 0
    fiftyUsed.value = false
    selectedIndex.value = null
    isWin.value = false
    hiddenBy50.value = new Set()
    hallUsed.value = false
    hallPercents.value = null
    verseUsed.value = false
    verseModalOpen.value = false
    loadRound()
  }

  function returnToMainMenu() {
    clearQuestionTimer()
    timedOut.value = false
    phase.value = 'menu'
    deck.value = []
    roundIndex.value = 0
    current.value = null
    activeQuestion.value = null
    selectedIndex.value = null
    isWin.value = false
    hallUsed.value = false
    hallPercents.value = null
    verseUsed.value = false
    verseModalOpen.value = false
    fiftyUsed.value = false
    hiddenBy50.value = new Set()
  }

  function loadRound() {
    clearQuestionTimer()
    const q = deck.value[roundIndex.value]
    if (!q) return
    activeQuestion.value = q
    current.value = shuffleAnswers(q)
    hiddenBy50.value = new Set()
    selectedIndex.value = null
    hallPercents.value = null
    verseModalOpen.value = false
    timeLeft.value = sessionTimeLimit.value
    startQuestionTimer()
  }

  function applyFiftyFifty() {
    if (fiftyUsed.value || !current.value || phase.value !== 'playing') return
    const correct = current.value.correctIndex
    const wrong = [0, 1, 2, 3].filter((i) => i !== correct)
    const pick = wrong[Math.floor(Math.random() * wrong.length)]
    const hide = wrong.filter((i) => i !== pick)
    hiddenBy50.value = new Set(hide)
    fiftyUsed.value = true
    if (hallPercents.value !== null) refreshHall()
  }

  function applyHall() {
    if (hallUsed.value || !current.value || phase.value !== 'playing') return
    refreshHall()
    hallUsed.value = true
  }

  function applyVerse() {
    if (verseUsed.value || phase.value !== 'playing') return
    verseUsed.value = true
    verseModalOpen.value = true
  }

  function closeVerseModal() {
    verseModalOpen.value = false
  }

  function pickAnswer(idx: number) {
    if (phase.value !== 'playing' || !current.value || selectedIndex.value !== null) return
    if (hiddenBy50.value.has(idx)) return
    clearQuestionTimer()
    selectedIndex.value = idx
    const ok = idx === current.value.correctIndex
    if (ok) {
      const last = roundIndex.value >= totalRounds.value - 1
      if (last) {
        isWin.value = true
        phase.value = 'result'
      } else {
        roundIndex.value += 1
        setTimeout(() => loadRound(), 650)
      }
    } else {
      timedOut.value = false
      isWin.value = false
      phase.value = 'result'
    }
  }

  const earnedPoints = computed(() => {
    if (phase.value !== 'result') return 0
    const ladder = ladderValues.value
    const n = ladder.length
    if (n === 0) return 0
    if (isWin.value) return ladder[n - 1] ?? 0
    const r = roundIndex.value
    return r > 0 ? ladder[r - 1]! : 0
  })

  return {
    phase,
    pendingTopic,
    sessionTimeLimit,
    timeLeft,
    timedOut,
    deck,
    roundIndex,
    current,
    activeQuestion,
    fiftyUsed,
    hiddenBy50,
    selectedIndex,
    isWin,
    totalRounds,
    ladderDisplay,
    hallUsed,
    hallPercents,
    verseUsed,
    verseModalOpen,
    chooseTopic,
    returnToMainMenu,
    applyFiftyFifty,
    applyHall,
    applyVerse,
    closeVerseModal,
    pickAnswer,
    earnedPoints,
  }
}
