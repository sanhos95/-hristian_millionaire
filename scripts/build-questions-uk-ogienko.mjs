/**
 * Збирає src/questions-uk-ogienko.json з українських питань/відповідей
 * та підтягує цитати з src/verses.json (Огієнко).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const books = JSON.parse(fs.readFileSync(path.join(root, 'src/books.json'), 'utf8'));
const bookNumToUk = new Map(books.map((b) => [b.book_number, b.long_name]));

/** Книги з однією главою: якщо «Книга N» без двокрапки — N це вірш. */
const SINGLE_CHAPTER_BOOKS = new Set([380, 640, 700, 710, 720]);

// Довгі англійські назви першими (щоб не сплутати John / 1 John тощо).
const EN_TO_BOOK_NUM = [
  ['2 Corinthians', 540],
  ['1 Corinthians', 530],
  ['2 Thessalonians', 600],
  ['1 Thessalonians', 590],
  ['2 Timothy', 620],
  ['1 Timothy', 610],
  ['2 Peter', 680],
  ['1 Peter', 670],
  ['3 John', 710],
  ['2 John', 700],
  ['1 John', 690],
  ['2 Chronicles', 140],
  ['1 Chronicles', 130],
  ['2 Kings', 120],
  ['1 Kings', 110],
  ['2 Samuel', 100],
  ['1 Samuel', 90],
  ['Song of Solomon', 260],
  ['Song of Songs', 260],
  ['Revelations', 730],
  ['Revelation', 730],
  ['Genesis', 10],
  ['Exodous', 20],
  ['Exodus', 20],
  ['Leviticus', 30],
  ['Numbers', 40],
  ['Deuteronomy', 50],
  ['Joshua', 60],
  ['Judges', 70],
  ['Ruth', 80],
  ['Ezra', 150],
  ['Nehemiah', 160],
  ['Esther', 190],
  ['Job', 220],
  ['Psalms', 230],
  ['Psalm', 230],
  ['Proverbs', 240],
  ['Ecclesiastes', 250],
  ['Isaiah', 290],
  ['Jeremiah', 300],
  ['Lamentations', 310],
  ['Ezekiel', 330],
  ['Daniel', 340],
  ['Hosea', 350],
  ['Joel', 360],
  ['Amos', 370],
  ['Obadiah', 380],
  ['Jonah', 390],
  ['Micah', 400],
  ['Nahum', 410],
  ['Habakkuk', 420],
  ['Zephaniah', 430],
  ['Haggai', 440],
  ['Zechariah', 450],
  ['Malachi', 460],
  ['Matthew', 470],
  ['Mark', 480],
  ['Luke', 490],
  ['John', 500],
  ['Acts', 510],
  ['Romans', 520],
  ['Galatians', 550],
  ['Ephesians', 560],
  ['Philippians', 570],
  ['Colossians', 580],
  ['Titus', 630],
  ['Philemon', 640],
  ['Hebrews', 650],
  ['James', 660],
  ['Jude', 720],
  ['Dan', 340],
];

function normalizeRefString(raw) {
  return raw
    .replace(/\u2013|\u2014/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtml(t) {
  return t
    .replace(/<pb\/?>/gi, '')
    .replace(/<f>[^<]*<\/f>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBookAtStart(s) {
  const t = s.trim();
  for (const [en, num] of EN_TO_BOOK_NUM) {
    const re = new RegExp(`^${en.replace(/ /g, '\\s+')}\\b`, 'i');
    if (re.test(t)) return { bookNum: num, rest: t.slice(en.length).trim(), en };
  }
  return null;
}

/**
 * Повертає початкову позицію та (за потреби) кінець у тій самій книзі.
 * Складні діапазони обрізаються за кількістю віршів (щоб не роздувати JSON).
 */
function parsePassage(refRaw, maxVerses = 28) {
  let ref = normalizeRefString(refRaw);
  if (!ref || ref === '??' || ref === '-nil-' || /^contents page$/i.test(ref)) return null;

  // Витягнути з дужок перше схоже на «Книга гл:вір»
  const paren = ref.match(/\(([^)]+)\)/);
  if (paren) {
    const inner = paren[1].trim();
    if (findBookAtStart(inner)) ref = inner;
  }

  // «By Joshua ...» — залишити після «By» якщо всередині немає книги
  ref = ref.replace(/^By\s+/i, '');

  // Кілька книг через кому — беремо першу розпізнану
  const chunks = ref.split(/[,;]/).map((c) => c.trim()).filter(Boolean);
  for (const chunk of chunks) {
    const hit = findBookAtStart(chunk);
    if (!hit) continue;
    let { bookNum, rest } = hit;

    // «Dan 5» без двокрапки
    let m = rest.match(/^(\d+)\s*:\s*(\d+)(?:\s*-\s*(?:(\d+)\s*:\s*)?(\d+))?/);
    if (m) {
      let ch = +m[1];
      let v1 = +m[2];
      let v2 = v1;
      if (m[3] && m[4]) {
        const ch2 = +m[3];
        const vEnd = +m[4];
        return { bookNum, start: { ch, v: v1 }, end: { ch: ch2, v: vEnd }, maxVerses };
      }
      if (m[3] && !m[4]) v2 = +m[3];
      // Йона: у KJV «1:17» у перекладі Огієнка — початок глави 2 вірш 1
      if (bookNum === 390 && ch === 1 && v1 === 17) {
        ch = 2;
        v1 = 1;
        v2 = 1;
      }
      return { bookNum, start: { ch, v: v1 }, end: { ch, v: v2 }, maxVerses };
    }

    m = rest.match(/^(\d+)\s*-\s*(\d+)\b/);
    if (m) {
      const chA = +m[1];
      const chB = +m[2];
      return {
        bookNum,
        start: { ch: chA, v: 1 },
        end: { ch: chB, v: 999 },
        maxVerses,
      };
    }

    m = rest.match(/^(\d+)\b/);
    if (m) {
      const n = +m[1];
      if (SINGLE_CHAPTER_BOOKS.has(bookNum)) {
        return { bookNum, start: { ch: 1, v: n }, end: { ch: 1, v: n }, maxVerses };
      }
      return { bookNum, start: { ch: n, v: 1 }, end: { ch: n, v: 999 }, maxVerses };
    }
  }

  // Лише назва книги
  const only = findBookAtStart(ref);
  if (only) {
    const low = ref.toLowerCase();
    if (low === 'job') return { bookNum: 220, start: { ch: 1, v: 1 }, end: { ch: 1, v: 5 }, maxVerses };
    if (low === 'esther') return { bookNum: 190, start: { ch: 1, v: 1 }, end: { ch: 1, v: 8 }, maxVerses };
  }

  if (/^ruth and esther$/i.test(ref.trim())) {
    return { bookNum: 80, start: { ch: 1, v: 1 }, end: { ch: 1, v: 5 }, maxVerses };
  }

  if (/john.*1 john/i.test(ref)) {
    return { bookNum: 500, start: { ch: 1, v: 1 }, end: { ch: 1, v: 8 }, maxVerses };
  }

  return null;
}

function buildVerseIndex(verses) {
  const map = new Map();
  for (const row of verses) {
    const k = `${row.book_number}:${row.chapter}:${row.verse}`;
    map.set(k, row.text);
  }
  return map;
}

function collectVerseRange(verseMap, bookNum, start, end, maxVerses) {
  const out = [];
  let ch = start.ch;
  let v = start.v;
  const endCh = end.ch;
  const endV = end.v;
  const fullChapterEnd = endV >= 999;

  for (let n = 0; n < maxVerses; n++) {
    const k = `${bookNum}:${ch}:${v}`;
    const raw = verseMap.get(k);
    if (!raw) break;
    out.push(stripHtml(raw));

    const atStop = fullChapterEnd
      ? ch === endCh && !verseMap.has(`${bookNum}:${ch}:${v + 1}`)
      : ch === endCh && v === endV;
    if (atStop) break;

    if (verseMap.has(`${bookNum}:${ch}:${v + 1}`)) v++;
    else {
      ch++;
      v = 1;
      if (!verseMap.has(`${bookNum}:${ch}:${v}`)) break;
    }
    if (!fullChapterEnd && (ch > endCh || (ch === endCh && v > endV))) break;
    if (fullChapterEnd && ch > endCh) break;
  }
  return out.join(' ');
}

function passageToUkLoc(bookNum, start, end) {
  const name = bookNumToUk.get(bookNum) ?? '';
  const fullEnd = end.v >= 999;
  if (fullEnd && end.ch > start.ch) return `${name} ${start.ch}:${start.v}-${end.ch}`;
  if (fullEnd && end.ch === start.ch) return `${name} ${start.ch}:${start.v}`;
  if (start.ch === end.ch && start.v === end.v) return `${name} ${start.ch}:${start.v}`;
  if (start.ch === end.ch) return `${name} ${start.ch}:${start.v}-${end.v}`;
  return `${name} ${start.ch}:${start.v}-${end.ch}:${end.v}`;
}

function fillOgienko(verseMap, item) {
  const ref = item.reference;
  const parsed = parsePassage(ref);
  if (!parsed) return null;

  const { bookNum, start, end, maxVerses } = parsed;
  const text = collectVerseRange(verseMap, bookNum, start, end, maxVerses);
  if (!text) return null;

  const loc = passageToUkLoc(bookNum, start, end);
  return { loc, text };
}

function fixReferenceUk(item, og) {
  if (!og) return;
  const ref = item.reference;
  if (/^Philemon\s+2$/i.test(ref.trim())) {
    item.reference_uk = 'До Филимона 1:2';
    og.loc = item.reference_uk;
  }
  if (/^Jonah\s+1:17$/i.test(ref.trim())) {
    item.reference_uk = 'Йона 2:1';
    og.loc = item.reference_uk;
  }
}

function main() {
  const verses = JSON.parse(fs.readFileSync(path.join(root, 'src/verses.json'), 'utf8'));
  const verseMap = buildVerseIndex(verses);

  const items = JSON.parse(
    fs.readFileSync(path.join(root, 'src/questions-ogienko.json'), 'utf8'),
  );

  for (const item of items) {
    const need = !item.ogienko || !item.ogienko.text;
    if (!need) continue;

    const og = fillOgienko(verseMap, item);
    if (og) {
      item.ogienko = og;
      fixReferenceUk(item, og);
    }
  }

  const json = JSON.stringify(items, null, '\t');
  const outUk = path.join(root, 'src/questions-uk-ogienko.json');
  const outLegacy = path.join(root, 'src/questions-ogienko.json');
  fs.writeFileSync(outUk, json, 'utf8');
  fs.writeFileSync(outLegacy, json, 'utf8');
  console.log('OK', outUk, '+', outLegacy, 'items', items.length);
}

main();
