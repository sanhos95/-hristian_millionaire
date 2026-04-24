/**
 * Підставляє wrongAnswers з src/wrongAnswersPlausible.json у обидва JSON питань.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const data = JSON.parse(fs.readFileSync(path.join(root, 'src/wrongAnswersPlausible.json'), 'utf8'));
const paths = [
  path.join(root, 'src/questions-uk-ogienko.json'),
  path.join(root, 'src/questions-ogienko.json'),
];

const questions = JSON.parse(fs.readFileSync(paths[0], 'utf8'));
if (data.items.length !== questions.length) {
  console.error('Length mismatch', data.items.length, questions.length);
  process.exit(1);
}

for (let i = 0; i < questions.length; i++) {
  questions[i].wrongAnswers = data.items[i];
}

const json = JSON.stringify(questions, null, '\t');
for (const p of paths) fs.writeFileSync(p, json, 'utf8');
console.log('OK', questions.length, paths.join(', '));
