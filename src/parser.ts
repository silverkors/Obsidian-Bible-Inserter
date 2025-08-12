// src/parser.ts

export interface RefSpan {
  chapter: number;
  v1?: number;
  v2?: number;
  raw?: string;
}

export interface ParsedRef {
  bookKey: string;
  bookLabel: string;
  svFull: string;
  svAbbr: string;
  enFull: string;
  enAbbr: string;
  spans: RefSpan[];
}

function B(enFull: string, enAbbr: string, svFull: string, svAbbr: string, aliases: string[]) {
  return { enFull, enAbbr, svFull, svAbbr, aliases: aliases.map(n => norm(n)) };
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
}

const BOOKS: Array<{
  enFull: string; enAbbr: string;
  svFull: string; svAbbr: string;
  aliases: string[];
}> = [
  B("Genesis","Gen","Första Moseboken","1 Mos",["gen","genesis","första moseboken","1 mos","1mos","1 moseboken"]),
  B("Exodus","Exod","Andra Moseboken","2 Mos",["exod","exodus","andra moseboken","2 mos","2mos","2 moseboken"]),
  B("Leviticus","Lev","Tredje Moseboken","3 Mos",["lev","leviticus","tredje moseboken","3 mos","3mos","3 moseboken"]),
  B("Numbers","Num","Fjärde Moseboken","4 Mos",["num","numbers","fjärde moseboken","4 mos","4mos","4 moseboken"]),
  B("Deuteronomy","Deut","Femte Moseboken","5 Mos",["deut","deuteronomy","femte moseboken","5 mos","5mos","5 moseboken"]),
  B("Joshua","Josh","Josua","Jos",["josh","joshua","jos","josua"]),
  B("Judges","Judg","Domarboken","Dom",["judg","judges","dom","domarboken"]),
  B("Ruth","Ruth","Rut","Rut",["ruth","rut"]),
  B("1 Samuel","1Sam","Första Samuelsboken","1 Sam",["1 sam","1sam","första samuelsboken","1 samuelsboken","first samuel","1 samuel"]),
  B("2 Samuel","2Sam","Andra Samuelsboken","2 Sam",["2 sam","2sam","andra samuelsboken","2 samuelsboken","second samuel","2 samuel"]),
  B("1 Kings","1Kgs","Första Kungaboken","1 Kung",["1 kgs","1kgs","första kungaboken","1 kungaboken","first kings","1 kings","1 kung"]),
  B("2 Kings","2Kgs","Andra Kungaboken","2 Kung",["2 kgs","2kgs","andra kungaboken","2 kungaboken","second kings","2 kings","2 kung"]),
  B("1 Chronicles","1Chr","Första Krönikeboken","1 Krön",["1 chr","1chr","första krönikeboken","1 krönikeboken","first chronicles","1 chronicles","1 krön"]),
  B("2 Chronicles","2Chr","Andra Krönikeboken","2 Krön",["2 chr","2chr","andra krönikeboken","2 krönikeboken","second chronicles","2 chronicles","2 krön"]),
  B("Ezra","Ezra","Esra","Esra",["ezra","esra"]),
  B("Nehemiah","Neh","Nehemja","Neh",["nehemiah","nehemja","neh"]),
  B("Esther","Esth","Ester","Est",["esther","esth","ester","est"]),
  B("Job","Job","Job","Job",["job"]),
  B("Psalms","Ps","Psaltaren","Ps",["ps","psalms","psalm","psaltaren"]),
  B("Proverbs","Prov","Ordspråksboken","Ords",["prov","proverbs","ords","ordspråksboken"]),
  B("Ecclesiastes","Eccl","Predikaren","Pred",["eccl","ecclesiastes","pred","predikaren"]),
  B("Song of Songs","Song","Höga Visan","HV",["song","song of songs","song of solomon","höga visan","hv"]),
  B("Isaiah","Isa","Jesaja","Jes",["isa","isaiah","jes","jesaja"]),
  B("Jeremiah","Jer","Jeremia","Jer",["jer","jeremiah","jeremia"]),
  B("Lamentations","Lam","Klagovisorna","Klag",["lam","lamentations","klag","klagovisorna"]),
  B("Ezekiel","Ezek","Hesekiel","Hes",["ezek","ezekiel","hes","hesekiel"]),
  B("Daniel","Dan","Daniel","Dan",["dan","daniel"]),
  B("Hosea","Hos","Hosea","Hos",["hos","hosea"]),
  B("Joel","Joel","Joel","Joel",["joel"]),
  B("Amos","Amos","Amos","Am",["amos","am"]),
  B("Obadiah","Obad","Obadja","Ob",["obad","obadiah","obadja","ob"]),
  B("Jonah","Jonah","Jona","Jona",["jonah","jona"]),
  B("Micah","Mic","Mika","Mik",["mic","micah","mika","mik"]),
  B("Nahum","Nah","Nahum","Nah",["nah","nahum"]),
  B("Habakkuk","Hab","Habackuk","Hab",["hab","habakkuk","habackuk"]),
  B("Zephaniah","Zeph","Sefanja","Sef",["zeph","zephaniah","sef","sefanja"]),
  B("Haggai","Hag","Haggaj","Hag",["hag","haggai","haggaj"]),
  B("Zechariah","Zech","Sakarja","Sak",["zech","zechariah","sakarja","sak"]),
  B("Malachi","Mal","Malaki","Mal",["mal","malachi","malaki"]),
  B("Matthew","Matt","Matteusevangeliet","Matt",["matt","matthew","matteus","matteusevangeliet"]),
  B("Mark","Mark","Markusevangeliet","Mark",["mark","markus","markusevangeliet"]),
  B("Luke","Luke","Lukasevangeliet","Luk",["luke","luk","lukas","lukasevangeliet"]),
  B("John","John","Johannesevangeliet","Joh",["john","joh","johannes","johannesevangeliet"]),
  B("Acts","Acts","Apostlagärningarna","Apg",["acts","apostlagärningarna","apg"]),
  B("Romans","Rom","Romarbrevet","Rom",["rom","romans","romarbrevet"]),
  B("1 Corinthians","1Cor","Första Korinthierbrevet","1 Kor",["1cor","1 cor","första korinthierbrevet","1 kor","1kor","first corinthians","1 corinthians"]),
  B("2 Corinthians","2Cor","Andra Korinthierbrevet","2 Kor",["2cor","2 cor","andra korinthierbrevet","2 kor","2kor","second corinthians","2 corinthians"]),
  B("Galatians","Gal","Galaterbrevet","Gal",["gal","galatians","galaterbrevet"]),
  B("Ephesians","Eph","Efesierbrevet","Ef",["eph","ephesians","ef","efesierbrevet"]),
  B("Philippians","Phil","Filipperbrevet","Fil",["phil","philippians","fil","filipperbrevet"]),
  B("Colossians","Col","Kolosserbrevet","Kol",["col","colossians","kol","kolosserbrevet"]),
  B("1 Thessalonians","1Thess","Första Thessalonikerbrevet","1 Thess",["1thess","1 thess","första thessalonikerbrevet","1 thessalonikerbrevet","first thessalonians","1 thessalonians","1thes","1 thes"]),
  B("2 Thessalonians","2Thess","Andra Thessalonikerbrevet","2 Thess",["2thess","2 thess","andra thessalonikerbrevet","2 thessalonikerbrevet","second thessalonians","2 thessalonians","2thes","2 thes"]),
  B("1 Timothy","1Tim","Första Timotheosbrevet","1 Tim",["1tim","1 tim","första timotheosbrevet","1 timotheosbrevet","first timothy","1 timothy"]),
  B("2 Timothy","2Tim","Andra Timotheosbrevet","2 Tim",["2tim","2 tim","andra timotheosbrevet","2 timotheosbrevet","second timothy","2 timothy"]),
  B("Titus","Titus","Titusbrevet","Tit",["titus","tit","titusbrevet"]),
  B("Philemon","Phlm","Filemonbrevet","Film",["phlm","philemon","filemonbrevet","filemon","film"]),
  B("Hebrews","Heb","Hebreerbrevet","Heb",["heb","hebrews","hebreerbrevet"]),
  B("James","Jas","Jakobsbrevet","Jak",["jas","james","jak","jakobsbrevet"]),
  B("1 Peter","1Pet","Första Petrusbrevet","1 Pet",["1pet","1 pet","första petrusbrevet","1 petrusbrevet","first peter","1 peter"]),
  B("2 Peter","2Pet","Andra Petrusbrevet","2 Pet",["2pet","2 pet","andra petrusbrevet","2 petrusbrevet","second peter","2 peter"]),
  B("1 John","1John","Första Johannesbrevet","1 Joh",["1john","1 john","första johannesbrevet","1 joh","1joh","first john"]),
  B("2 John","2John","Andra Johannesbrevet","2 Joh",["2john","2 john","andra johannesbrevet","2 joh","2joh","second john"]),
  B("3 John","3John","Tredje Johannesbrevet","3 Joh",["3john","3 john","tredje johannesbrevet","3 joh","3joh","third john"]),
  B("Jude","Jude","Judasbrevet","Jud",["jude","jud","judasbrevet"]),
  B("Revelation","Rev","Uppenbarelseboken","Upp",["rev","revelation","uppenbarelseboken","upp"])
];

function lookupBook(bookRaw: string) {
  const key = norm(bookRaw).replace(/\s*(?=\d)/g, "");
  let hit = BOOKS.find(b => b.aliases.includes(key));
  if (hit) return hit;
  const spaced = key.replace(/^([123])\s?/, "$1 ");
  hit = BOOKS.find(b => b.aliases.includes(spaced));
  if (hit) return hit;
  hit = BOOKS.find(b => [b.enFull,b.enAbbr,b.svFull,b.svAbbr].map(norm).includes(key));
  return hit || null;
}

export function splitRefList(input: string): string[] {
  return input.split(";").map(s => s.trim()).filter(Boolean);
}

const DASH_RX = /[-–]/;

export function parseReference(input: string): ParsedRef | null {
  const raw = input.trim();
  if (!raw) return null;

  const m = raw.match(/^(.+?)\s+(\d+)(?::(.+))?$/);
  if (!m) return null;

  const bookText = m[1].trim();
  const chapterStr = m[2].trim();
  const spansStr = (m[3] ?? "").trim();

  const bookMeta = lookupBook(bookText);
  if (!bookMeta) return null;

  const chapter = parseInt(chapterStr, 10);
  if (!Number.isInteger(chapter)) return null;

  const spanParts = spansStr ? spansStr.split(",").map(s => s.trim()).filter(Boolean) : [];

  const spans: RefSpan[] = [];
  if (spanParts.length === 0) {
    spans.push({ chapter, raw: `${chapter}` });
  } else {
    for (const sp of spanParts) {
      const clean = sp.replace(/^v(?:\.)?\s*/i, "");
      const mm = clean.split(DASH_RX);
      if (mm.length === 1) {
        const v1 = parseInt(mm[0], 10);
        if (!Number.isInteger(v1)) return null;
        spans.push({ chapter, v1, v2: v1, raw: `${chapter}:${sp}` });
      } else if (mm.length === 2) {
        const v1 = parseInt(mm[0], 10);
        const v2 = parseInt(mm[1], 10);
        if (!Number.isInteger(v1) || !Number.isInteger(v2) || v2 < v1) return null;
        spans.push({ chapter, v1, v2, raw: `${chapter}:${sp}` });
      } else {
        return null;
      }
    }
  }

  const parsed: ParsedRef = {
    bookKey: bookMeta.enFull,
    bookLabel: raw,
    svFull: bookMeta.svFull,
    svAbbr: bookMeta.svAbbr,
    enFull: bookMeta.enFull,
    enAbbr: bookMeta.enAbbr,
    spans
  };
  return parsed;
}
