/**
 * Додає до questions-uk / questions-og: gameTopic (для buildDeck) і ladderStep 1–10
 * (рівномірні децилі за оцінкою «жорсткості»; спочатку простіші в банку).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const paths = [
  path.join(root, 'src/questions-uk-ogienko.json'),
  path.join(root, 'src/questions-ogienko.json'),
];

function normalizeCats(cats) {
  return (cats || []).map((x) => (x === 'letter_of_paul' ? 'letters_of_paul' : x));
}

/** Явні питання про місто / назву міста (узгоджено з меню «міста»). */
function cityTopicFromQuestion(q) {
  return /У якому місті|Яке місто|місто Боже|місто Давида|місто, яке заснував|У яке місто|відоме місто|місто називають|місто Господь/i.test(
    q,
  );
}

/**
 * Одна ігрова тема на питання (пріоритет: міста → Вихід → книги/псалми → НЗ/ПЗ шари).
 */
function categoriesToGameTopic(questionText, catsRaw) {
  if (cityTopicFromQuestion(questionText)) return 'cities';

  const c = new Set(normalizeCats(catsRaw));

  if (c.has('exodus')) return 'manna_desert';
  if (c.has('psalms') || c.has('psalms_') || c.has('proverbs')) return 'books';
  if (c.has('letters_of_paul')) return 'letters_paul';
  if (c.has('gospels')) return 'gospels';
  if (c.has('judges') || c.has('kings_judges')) return 'judges_kings';
  if (c.has('miracles')) return 'miracles';
  if (c.has('prophets')) return 'prophets';
  if (c.has('new_testament')) return 'nt_general';
  if (c.has('old_testament')) return 'ot_general';
  return 'general';
}

/** Внутрішня оцінка 1–3 для сортування (не зберігається в JSON). */
function inferTier(row) {
  const q = row.question || '';
  const a = String(row.answer ?? '');
  const ref = row.reference || '';
  const cats = new Set(normalizeCats(row.categories));

  let tier = 2;

  if (
    /Скільки апостолів|Скільки річок|Юда.*зрадив|Іскаріот|перш(у|ої) людин|Хто збудував ковчег|Ісус народився|Віфлеєм.*Ісус/i.test(
      q,
    )
  ) {
    tier = 1;
  }
  if (/^(12|4|30|3|7|40)$/.test(a) && /Скільки/.test(q)) tier = 1;

  if (cats.has('prophets')) tier = Math.max(tier, 2);
  if (cats.has('psalms_')) tier = 3;
  if (/\?\?|-nil-|contents page/i.test(ref)) tier = 3;
  if (/^\d{4,}$/.test(a)) tier = 3;
  if (/[;].*\d+:\d+/.test(ref) || ref.length > 52) tier = 3;
  if (a.length > 22) tier = Math.max(tier, 2);
  if (q.length > 100) tier = Math.max(tier, 2);

  if (tier < 1) tier = 1;
  if (tier > 3) tier = 3;
  return tier;
}

/** Числовий ключ сортування: легші менші (розв’язує нічию довжинами). */
function hardnessKey(row) {
  const tier = inferTier(row);
  const q = (row.question || '').length;
  const a = String(row.answer ?? '').length;
  const ref = (row.reference || '').length;
  return tier * 1e6 + q * 100 + a + ref * 0.01;
}

/** Рівномірно розкладає 1..10 по відсортованому списку (перші — легші). */
function assignLadderSteps(rows) {
  const sorted = [...rows].sort((a, b) => hardnessKey(a) - hardnessKey(b));
  const n = sorted.length;
  const base = Math.floor(n / 10);
  const extra = n % 10;
  let idx = 0;
  for (let step = 1; step <= 10; step++) {
    const size = base + (step <= extra ? 1 : 0);
    for (let j = 0; j < size; j++) {
      const row = sorted[idx++];
      row.ladderStep = step;
    }
  }
}

function main() {
  const items = JSON.parse(fs.readFileSync(paths[0], 'utf8'));

  for (const row of items) {
    row.gameTopic = categoriesToGameTopic(row.question, row.categories);
    delete row.difficulty;
  }
  assignLadderSteps(items);

  const json = JSON.stringify(items, null, '\t');
  for (const p of paths) fs.writeFileSync(p, json, 'utf8');

  const dist = {};
  const topics = {};
  for (const row of items) {
    dist[row.ladderStep] = (dist[row.ladderStep] || 0) + 1;
    topics[row.gameTopic] = (topics[row.gameTopic] || 0) + 1;
  }
  console.log('ladderStep', dist);
  console.log('topics', topics);
  console.log('OK', items.length);
}

main();
