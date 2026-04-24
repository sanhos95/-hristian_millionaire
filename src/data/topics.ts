/**
 * Тема питання в банку (узгоджено з полем `gameTopic` у `questions-uk-ogienko.json`).
 * «Змішано» — лише в `TopicFilter`, не значення `topic` у питанні.
 */
export type QuestionTopic =
  | 'general'
  | 'cities'
  | 'manna_desert'
  | 'books'
  | 'gospels'
  | 'letters_paul'
  | 'miracles'
  | 'judges_kings'
  | 'prophets'
  | 'nt_general'
  | 'ot_general'

/** Вибір у першому кроці меню */
export type TopicFilter = 'mixed' | QuestionTopic

export const TOPIC_MENU: readonly { filter: TopicFilter; label: string; hint: string }[] = [
  { filter: 'mixed', label: 'Змішано', hint: 'Усі теми разом' },
  { filter: 'gospels', label: 'Євангелія', hint: 'Життя й чудеса Христа' },
  { filter: 'nt_general', label: 'Новий Заповіт (різне)', hint: 'Діяння, загальні питання НЗ' },
  { filter: 'letters_paul', label: 'Послання Павла', hint: 'Павлові листи' },
  { filter: 'miracles', label: 'Чудеса', hint: 'Зцілення, знамення, воскресіння' },
  { filter: 'ot_general', label: 'Старий Заповіт (різне)', hint: 'Історія, Закон поза Виходом' },
  { filter: 'manna_desert', label: 'Вихід і пустеля', hint: 'Мойсей, манна, пустеля' },
  { filter: 'judges_kings', label: 'Судді та царі', hint: 'Період Суддів і царів' },
  { filter: 'prophets', label: 'Пророки', hint: 'Пророчі книги та постаті' },
  { filter: 'books', label: 'Псалми й мудрість', hint: 'Псалми, Притчі, канон' },
  { filter: 'cities', label: 'Міста', hint: 'Місця та топоніми' },
  { filter: 'general', label: 'Інше', hint: 'Загальні питання без чіткої мітки' },
] as const

/** Секунди на одне питання (однаково для всіх сходинок) */
export const TIMER_SECONDS_PER_QUESTION = 60
