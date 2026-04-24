<script setup lang="ts">
import { computed, Teleport } from 'vue'
import { useGame } from './composables/useGame'

const {
  phase,
  sessionTimeLimit,
  timeLeft,
  timedOut,
  totalRounds,
  roundIndex,
  current,
  activeQuestion,
  fiftyUsed,
  hiddenBy50,
  selectedIndex,
  isWin,
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
} = useGame()

const letters = ['A', 'B', 'C', 'D'] as const

function answerClass(idx: number) {
  const base =
    'group relative flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/80 sm:px-6'
  if (hiddenBy50.value.has(idx)) return `${base} hidden`
  if (selectedIndex.value === null) {
    return `${base} border-white/10 bg-white/5 text-slate-100 hover:border-amber-400/35 hover:bg-white/10`
  }
  const correct = current.value && idx === current.value.correctIndex
  const wrongPick = selectedIndex.value === idx && !correct
  if (correct) return `${base} border-emerald-400/60 bg-emerald-500/15 text-emerald-50`
  if (wrongPick) return `${base} border-rose-400/60 bg-rose-500/15 text-rose-50`
  return `${base} border-white/10 bg-white/[0.03] text-slate-400`
}

function formatClock(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const timerUrgent = computed(
  () =>
    timeLeft.value <= (sessionTimeLimit.value <= 45 ? 5 : 10) && phase.value === 'playing',
)
</script>

<template>
  <div
    class="min-h-dvh bg-[radial-gradient(1200px_circle_at_20%_0%,rgba(251,191,36,0.14),transparent_55%),radial-gradient(900px_circle_at_80%_10%,rgba(59,130,246,0.12),transparent_55%),linear-gradient(180deg,#070b14,#0b1224)] pb-[env(safe-area-inset-bottom)] text-slate-100"
  >
    <div
      class="mx-auto flex min-h-dvh max-w-6xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:flex-row lg:gap-10 lg:px-8"
    >
      <aside class="lg:w-80 lg:shrink-0">
        <div
          class="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-5"
          :class="phase === 'menu' ? '' : 'hidden lg:block'"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">Біблійний квіз</p>
          <h1 class="mt-2 text-xl font-semibold leading-tight text-white sm:text-3xl">Хто хоче… знати Писання?</h1>
          <p class="mt-3 text-sm leading-relaxed text-slate-300/90">
            Чотири варіанти, один правильний. Підказки обмежені — думай уважно.
          </p>
        </div>

        <div
          v-if="phase === 'playing' || phase === 'result'"
          class="mt-4 hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md lg:block"
        >
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Драбина</p>
          <ol class="mt-3 space-y-1">
            <li
              v-for="row in ladderDisplay"
              :key="row.i"
              class="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
              :class="
                row.i === roundIndex && phase === 'playing'
                  ? 'bg-amber-500/15 text-amber-50 ring-1 ring-amber-400/35'
                  : row.i < roundIndex
                    ? 'text-slate-500'
                    : 'text-slate-200/90'
              "
            >
              <span class="tabular-nums text-slate-400">{{ row.i + 1 }}</span>
              <span class="font-semibold tabular-nums">{{ row.value.toLocaleString('uk-UA') }}</span>
            </li>
          </ol>
        </div>
      </aside>

      <main class="flex flex-1 flex-col gap-5">
        <section
          v-if="phase === 'menu'"
          class="flex flex-1 flex-col justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-[0_30px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-10"
        >
          <div>
            <h2 class="mt-2 text-xl font-semibold text-white sm:text-2xl">Почати гру</h2>
            <p class="mt-2 text-sm text-slate-400">
              У кожній грі рівно <strong class="text-slate-200">10 питань</strong>: від легших до важчих.
            </p>
          </div>
          <div class="flex justify-center">
            <button
              type="button"
              class="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 text-center transition hover:border-amber-400/40 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              @click="chooseTopic()"
            >
              <span class="block font-semibold text-white">Почати</span>
            </button>
          </div>
        </section>

        <section v-else-if="phase === 'playing' && current && activeQuestion" class="flex flex-1 flex-col gap-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-md">
              Питання <span class="font-semibold text-white">{{ roundIndex + 1 }}</span> / {{ totalRounds }}
            </div>
            <div
              class="rounded-2xl border px-4 py-2 font-mono text-lg font-semibold tabular-nums backdrop-blur-md"
              :class="
                timerUrgent
                  ? 'border-rose-400/50 bg-rose-500/20 text-rose-100'
                  : 'border-white/10 bg-white/5 text-amber-100'
              "
              :title="`Максимум на питання: ${formatClock(sessionTimeLimit)}`"
            >
              {{ formatClock(timeLeft) }}
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="fiftyUsed || selectedIndex !== null"
                :title="fiftyUsed ? 'Уже використано в цій грі' : ''"
                @click="applyFiftyFifty()"
              >
                50:50
              </button>
              <button
                type="button"
                class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="hallUsed || selectedIndex !== null"
                :title="hallUsed ? 'Уже використано в цій грі' : ''"
                @click="applyHall()"
              >
                Запитати ШІ
              </button>
              <button
                type="button"
                class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="verseUsed || selectedIndex !== null"
                :title="verseUsed ? 'Уже використано в цій грі' : ''"
                @click="applyVerse()"
              >
                Вірш
              </button>
            </div>
            <p class="w-full text-center text-[11px] text-slate-500 sm:text-left">
              50:50, Запитати ШІ і вірш — по одному разу за всю гру.
            </p>
          </div>

          <div
            v-if="hallPercents"
            class="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md"
          >
            <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Відповідь ШІ</p>
            <ul class="mt-3 space-y-2">
              <li
                v-for="idx in 4"
                v-show="!hiddenBy50.has(idx - 1)"
                :key="`hall-${idx - 1}`"
                class="flex items-center gap-3 text-sm"
              >
                <span class="w-4 font-bold text-amber-200/90">{{ letters[idx - 1] }}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    class="h-full rounded-full bg-gradient-to-r from-amber-400/90 to-amber-600/90 transition-[width] duration-500"
                    :style="{ width: `${hallPercents[idx - 1]}%` }"
                  />
                </div>
                <span class="w-10 text-right tabular-nums text-slate-200">{{ hallPercents[idx - 1] }}%</span>
              </li>
            </ul>
          </div>

          <div
            class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_30px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-8"
          >
            <h2 class="text-lg font-semibold leading-snug text-white sm:text-xl">
              {{ activeQuestion.text }}
            </h2>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <button
              v-for="(label, idx) in current.answers"
              :key="`${roundIndex}-${idx}`"
              type="button"
              class="text-left"
              :class="answerClass(idx)"
              :disabled="hiddenBy50.has(idx) || selectedIndex !== null"
              :aria-label="`Відповідь ${letters[idx]}: ${label}`"
              @click="pickAnswer(idx)"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-sm font-bold text-amber-200/90 group-hover:border-amber-300/40"
                >{{ letters[idx] }}</span
              >
              <span class="text-base font-medium leading-snug">{{ label }}</span>
            </button>
          </div>
        </section>

        <section
          v-else-if="phase === 'result'"
          class="flex flex-1 flex-col items-center justify-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-[0_30px_120px_-50px_rgba(0,0,0,0.9)] backdrop-blur-md"
        >
          <h2 class="text-3xl font-semibold text-white">
            {{ isWin ? 'Перемога!' : timedOut ? 'Час вичерпано' : 'Гру завершено' }}
          </h2>
          <p class="max-w-md text-slate-300">
            <template v-if="isWin"> Ви пройшли всі {{ totalRounds }} питань. </template>
            <template v-else>
              <span v-if="timedOut" class="mb-4 block text-sm text-amber-200/90">
                Час на відповідь закінчився — гра зупиняється.
              </span>
              <span class="block text-slate-400">Правильна відповідь з банку питань</span>
              <span class="mt-2 block text-xl font-semibold leading-snug text-white">
                {{
                  activeQuestion?.documentAnswer ??
                  activeQuestion?.correctAnswerWords ??
                  current?.answers[current.correctIndex]
                }}
              </span>
              <span
                v-if="activeQuestion?.correctAnswerWords && current"
                class="mt-1 block text-sm text-slate-500"
              >
                У варіантах гри: {{ current.answers[current.correctIndex] }}
              </span>
              <div
                v-if="activeQuestion?.verseText"
                class="mt-5 max-h-[42vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-left"
              >
                <p class="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                  Біблійний вірш (переклад І. Огієнка)
                </p>
                <p v-if="activeQuestion.verseLocation" class="mt-2 text-sm font-medium text-slate-300">
                  {{ activeQuestion.verseLocation }}
                </p>
                <p class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
                  {{ activeQuestion.verseText }}
                </p>
              </div>
              <p
                v-else-if="activeQuestion?.reference"
                class="mt-4 text-sm text-slate-400"
              >
                Посилання: {{ activeQuestion.reference }}
              </p>
            </template>
          </p>
          <p class="text-lg text-amber-100">
            Ваш результат:
            <span class="font-bold tabular-nums text-white">{{ earnedPoints.toLocaleString('uk-UA') }}</span>
            балів
          </p>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-8 py-3 font-semibold text-white transition hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            @click="returnToMainMenu()"
          >
            Грати знову
          </button>
        </section>
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="verseModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verse-hint-title"
      >
        <button
          type="button"
          class="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
          aria-label="Закрити"
          @click="closeVerseModal()"
        />
        <div
          class="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-slate-900/95 p-6 text-left shadow-2xl"
        >
          <div class="flex items-start justify-between gap-4">
            <h3 id="verse-hint-title" class="text-lg font-semibold text-white">Вірш</h3>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
              aria-label="Закрити"
              @click="closeVerseModal()"
            >
              ✕
            </button>
          </div>
          <div class="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
              Біблійний вірш (переклад І. Огієнка)
            </p>
            <p v-if="activeQuestion?.verseLocation" class="mt-2 text-sm font-medium text-slate-300">
              {{ activeQuestion.verseLocation }}
            </p>
            <p v-if="activeQuestion?.verseText" class="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
              {{ activeQuestion.verseText }}
            </p>
            <p v-else class="mt-3 text-sm leading-relaxed text-slate-200">
              Упс... до даного питання вірш відсутній
            </p>
          </div>
          <button
            type="button"
            class="mt-6 w-full rounded-2xl bg-gradient-to-b from-amber-300 to-amber-600 py-3 font-semibold text-slate-950 transition hover:brightness-105"
            @click="closeVerseModal()"
          >
            Добре
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
