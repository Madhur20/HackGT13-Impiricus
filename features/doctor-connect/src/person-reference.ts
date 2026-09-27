import { AMBIGUOUS_NAMES, DRUG_BRANDS, EPONYMS, EPONYM_FOLLOWERS, KNOWN_ACRONYMS, KNOWN_WORDS, NAMING_WORDS, PERSON_FOLLOWERS, PERSON_NAMES, PERSON_PREPOSITIONS, RELATIONS, ROLE_NOUNS, TITLES } from "./person-lexicon";

// Context-aware person-reference detection for Doctor Connect free text.
//
// A role word alone ("my patient has CKD") is never a name. A word is flagged when it is
// a known name ("Bob", "bob's"), or when an unknown capitalized word sits in a person
// position: after a role/title/relation ("patient Priya", "Dr. Okonkwo"), as a possessive
// ("Priya's CKD"), before a person verb ("Priya has CKD"), after a person preposition
// ("for Priya"), or next to another flagged name ("Priya Okafor").

export type TextSpan = { start: number; end: number };

type Token = {
  start: number;
  /** End of the name part; excludes a possessive 's so previews read "[name removed]'s". */
  end: number;
  raw: string;
  lower: string;
  parts: string[];
  possessive: boolean;
  capitalized: boolean;
  allCaps: boolean;
  sentenceStart: boolean;
};

const WORD = /\p{L}+(?:['’-]\p{L}+)*/gu;
const DOTTED_INITIALS = /(?<![\p{L}.])(?:\p{Lu}\.\s?){2,4}(?!\p{L})/gu;
const NON_NAME_DOTTED = new Set(["us", "uk", "eu", "md", "do", "rn", "np", "pa", "am", "pm", "po", "iv", "qd", "bid", "tid", "phd"]);
const LINK_GAP = /^[\s,:(–—-]*$/;
const TITLE_GAP = /^\.?\s+$/;
const SENTENCE_BREAK = /[.!?;:\n\r•]/;
const CLAUSE_END = /^\s*(?:$|[.,;:!?)])/;

/** Endings of ordinary nouns, adjectives, verbs, and generic drug names. */
const WORD_SHAPE = /(?:tion|sion|ment|ness|ance|ence|ancy|ency|ity|ism|ing|ings|emia|aemia|itis|osis|pathy|algia|ology|logy|ectomy|otomy|scopy|graphy|uria|trophy|plasia|penia|ive|ous|ical|able|ible|ful|less|ist|ists|ed)$/;
const DRUG_SHAPE = /(?:formin|ulin|irin|arin|cillin|mycin|micin|floxacin|cycline|statin|gliptin|gliflozin|glutide|glinide|glitazone|patide|tide|mab|nib|pril|sartan|olol|dipine|azole|idine|afil|prazole|tidine|triptan|setron|vir|xaban|gatran|parin|lukast|terol|sone|olone|asone|pam|zolam|zepam|oxetine|aline|triptyline|zosin|dronate|caine|profen|fenac|coxib|thiazide|zide|mide|pide|uride|actone|enone|imibe|oxine|amine|ine)$/;

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(WORD)) {
    const raw = match[0];
    const start = match.index ?? 0;
    const possessive = /['’]s$/i.test(raw) && raw.length > 2;
    const base = possessive ? raw.slice(0, -2) : raw;
    const lower = base.toLowerCase().replace(/’/g, "'");
    const previous = tokens.at(-1);
    const gap = previous ? text.slice(previous.start + previous.raw.length, start) : "";
    const afterTitle = previous !== undefined && TITLES.has(previous.lower) && TITLE_GAP.test(gap);
    tokens.push({
      start,
      end: start + base.length,
      raw,
      lower,
      parts: lower.split("-"),
      possessive,
      capitalized: /^\p{Lu}/u.test(base),
      allCaps: /\p{Lu}/u.test(base) && base === base.toUpperCase(),
      sentenceStart: !previous || (SENTENCE_BREAK.test(gap) && !afterTitle),
    });
  }
  return tokens;
}

function gapBetween(text: string, left: Token, right: Token) {
  return text.slice(left.start + left.raw.length, right.start);
}

function linked(text: string, left: Token | undefined, right: Token) {
  if (!left) return false;
  const gap = gapBetween(text, left, right);
  return LINK_GAP.test(gap) || (TITLES.has(left.lower) && TITLE_GAP.test(gap));
}

function isKnownWord(token: Token) {
  return token.parts.every((part) => KNOWN_WORDS.has(part) || PERSON_FOLLOWERS.has(part) || ROLE_NOUNS.has(part) || RELATIONS.has(part) || TITLES.has(part) || NAMING_WORDS.has(part))
    || DRUG_BRANDS.has(token.lower)
    || EPONYMS.has(token.lower)
    || token.parts.some((part) => EPONYMS.has(part));
}

function hasWordShape(token: Token) {
  return WORD_SHAPE.test(token.lower) || DRUG_SHAPE.test(token.lower);
}

function isIntroWord(token: Token) {
  return ROLE_NOUNS.has(token.lower) || TITLES.has(token.lower) || RELATIONS.has(token.lower) || NAMING_WORDS.has(token.lower);
}

export function findPersonReferences(text: string): TextSpan[] {
  const tokens = tokenize(text);
  const flagged = new Array<boolean>(tokens.length).fill(false);

  const nextWord = (i: number) => (tokens[i + 1] && linked(text, tokens[i], tokens[i + 1]) ? tokens[i + 1] : undefined);
  const followedByPersonVerb = (i: number) => {
    const next = tokens[i + 1];
    return next !== undefined && PERSON_FOLLOWERS.has(next.lower) && /^[\s,]*$/.test(gapBetween(text, tokens[i], next));
  };
  const clauseEndsAfter = (i: number) => CLAUSE_END.test(text.slice(tokens[i].start + tokens[i].raw.length));
  const introducedBy = (i: number) => {
    const previous = tokens[i - 1];
    if (!linked(text, previous, tokens[i])) return undefined;
    if (isIntroWord(previous)) return previous;
    // "my patient is Priya", "his name is Bob"
    const beforeThat = tokens[i - 2];
    if ((previous.lower === "is" || previous.lower === "was") && beforeThat && linked(text, beforeThat, previous) && (ROLE_NOUNS.has(beforeThat.lower) || RELATIONS.has(beforeThat.lower) || beforeThat.lower === "name")) return previous;
    return undefined;
  };
  const isEponymUse = (i: number) => {
    const next = nextWord(i);
    return next !== undefined && EPONYM_FOLLOWERS.has(next.lower);
  };

  tokens.forEach((token, i) => {
    if (isEponymUse(i)) return;
    const intro = introducedBy(i);
    const personVerbAfter = followedByPersonVerb(i);
    const previous = tokens[i - 1];
    const afterPersonPreposition = previous !== undefined && PERSON_PREPOSITIONS.has(previous.lower) && linked(text, previous, token);

    if (token.allCaps && KNOWN_ACRONYMS.has(token.lower)) return;
    if (token.lower.length >= 3 && token.parts.some((part) => PERSON_NAMES.has(part))) {
      flagged[i] = true;
      return;
    }
    // All-caps words are abbreviations ("SGLT", "COPD") unless they read as initials: "pt JD", "JD has CKD", "Mr. K".
    if (token.allCaps) {
      if (token.lower.length <= 3) flagged[i] = (intro !== undefined && (token.lower.length >= 2 || TITLES.has(intro.lower))) || (token.lower.length >= 2 && personVerbAfter);
      return;
    }
    if (token.lower.length < 3) return;

    if (token.parts.some((part) => AMBIGUOUS_NAMES.has(part))) {
      // "Will the dose change?" and "mark the trend" stay; "Will has CKD", "for Grace", "patient mark has CKD" do not.
      flagged[i] = token.capitalized
        ? !token.sentenceStart || intro !== undefined || token.possessive || personVerbAfter
        : intro !== undefined && (personVerbAfter || clauseEndsAfter(i));
      return;
    }

    if (isKnownWord(token) || hasWordShape(token)) return;

    if (intro !== undefined) {
      // "patient Priya", "Dr. Okonkwo", "my patient priya has CKD"; never "my patient has CKD" or "the patient is euvolemic".
      const directIntro = isIntroWord(intro);
      flagged[i] = token.capitalized || (directIntro && !/(?:s|ly)$/.test(token.lower) && (personVerbAfter || clauseEndsAfter(i)));
      return;
    }
    if (token.possessive) {
      flagged[i] = true;
      return;
    }
    if (token.capitalized && (personVerbAfter || (afterPersonPreposition && !token.sentenceStart))) flagged[i] = true;
  });

  // A capitalized unknown word directly beside a flagged name is part of it: "Priya Okafor", "Okafor, Priya".
  for (let changed = true; changed;) {
    changed = false;
    tokens.forEach((token, i) => {
      if (flagged[i] || !token.capitalized || token.allCaps || isKnownWord(token) || hasWordShape(token) || isEponymUse(i)) return;
      const nearFlagged = (flagged[i - 1] && /^[\s,]*$/.test(gapBetween(text, tokens[i - 1], token))) || (flagged[i + 1] && /^\s+$/.test(gapBetween(text, token, tokens[i + 1])));
      if (nearFlagged) flagged[i] = changed = true;
    });
  }

  const spans: TextSpan[] = tokens.filter((_, i) => flagged[i]).map(({ start, end }) => ({ start, end }));

  for (const match of text.matchAll(DOTTED_INITIALS)) {
    const letters = match[0].replace(/[.\s]/g, "").toLowerCase();
    if (NON_NAME_DOTTED.has(letters)) continue;
    const start = match.index ?? 0;
    spans.push({ start, end: start + match[0].trimEnd().length });
  }

  return mergeAdjacentSpans(text, spans);
}

function mergeAdjacentSpans(text: string, spans: TextSpan[]): TextSpan[] {
  const merged: TextSpan[] = [];
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    const last = merged.at(-1);
    if (last && (span.start <= last.end || /^\s+$/.test(text.slice(last.end, span.start)))) last.end = Math.max(last.end, span.end);
    else merged.push({ ...span });
  }
  return merged;
}
