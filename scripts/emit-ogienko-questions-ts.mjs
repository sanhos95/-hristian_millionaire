/**
 * Генерує src/data/ogienkoQuestions.gen.ts із банком питань для гри.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const rows = JSON.parse(fs.readFileSync(path.join(root, 'src/questions-uk-ogienko.json'), 'utf8'));

function esc(s) {
  return JSON.stringify(s ?? '');
}

const blocks = rows.map((row, i) => {
  const correct = String(row.answer ?? '').trim();
  const w = row.wrongAnswers || [];
  if (w.length !== 3) throw new Error(`wrongAnswers length ${w.length} at ${i}`);
  const ref = row.reference_uk || row.reference || '';
  const og = row.ogienko;
  const docAns = String(row.answer ?? '').trim();
  const vLoc = og?.loc || ref;
  const vText = og?.text ? String(og.text) : '';

  return `  {
    id: ${esc(`og-${i + 1}`)},
    text: ${esc(row.question)},
    answers: [${esc(correct)}, ${esc(w[0])}, ${esc(w[1])}, ${esc(w[2])}] as [string, string, string, string],
    correctIndex: 0,
    topic: ${esc(row.gameTopic)},
    ladderStep: ${row.ladderStep},
    reference: ${esc(ref)},
    documentAnswer: ${esc(docAns)},
    verseLocation: ${esc(vLoc)},
    verseText: ${esc(vText)},
  }`;
});

const out = `/** Автогенерація: npm run gen:ogienko-questions */
import type { BibleQuestion } from './bibleQuestionType'

export const OGIENKO_QUESTIONS: BibleQuestion[] = [
${blocks.join(',\n')},
]
`;

const outPath = path.join(root, 'src/data/ogienkoQuestions.gen.ts');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', rows.length, outPath);
