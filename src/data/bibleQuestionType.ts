import type { QuestionTopic } from './topics'

/** Одне питання в банку гри «Мільйонер» */
export type BibleQuestion = {
  id: string
  text: string
  answers: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  topic: QuestionTopic
  /** Сходинка «драбини» в грі: 1 — найпростіші, 10 — найважчі (рівномірний розподіл у банку) */
  ladderStep: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
  reference?: string
  correctAnswerWords?: string
  /** Канонічна відповідь з банку (поле `answer` у JSON), без прив’язки до перемішаних варіантів */
  documentAnswer?: string
  /** Адреса уривку в перекладі Огієнка (`ogienko.loc`) */
  verseLocation?: string
  /** Текст біблійного уривка перекладу Огієнка (`ogienko.text`) */
  verseText?: string
}
