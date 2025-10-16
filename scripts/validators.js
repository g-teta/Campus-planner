export const regexPatterns = {
     title: /^\S(?:.*\S)?$/,
     dueDate: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
     duration: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
     tag: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
     tagFilter: /^@tag:\w+$/,
     timeToken: /\b\d{2}:\d{2}\b/,
     duplicateWords: /\b(\w+)\s+\1\b/
};

export function validateTitle(title) {
  return regexPatterns.title.test(title);
}

export function validateDueDate(date) {
  return regexPatterns.dueDate.test(date);
}

export function validateDuration(duration) {
  return regexPatterns.duration.test(duration);
}

export function validateTag(tag) {
  return regexPatterns.tag.test(tag);
}

export function compileRegex(input, flags = 'i') {
  try { return input ? new RegExp(input, flags) : null; } catch { return null; }
}

// Validation patterns (as functions returning boolean)
export const validators = {
  // no leading/trailing spaces, collapse multiple spaces
  title: (v) => {
    const s = String(v ?? '').replace(/\s+/g, ' ').trim();
    return s.length > 0 && /^\S(?:.*\S)?$/.test(s);
  },
  // integer or decimal with up to 2 decimals, > 0
  duration: (v) => /^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(v)) && Number(v) > 0,
  // YYYY-MM-DD
  dateISO: (v) => /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(String(v)),
  // letters, spaces, hyphens (no leading/trailing)
  tag: (v) => /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/.test(String(v)),
  // advanced: no duplicate consecutive words (back-reference)
  noDuplicateWords: (s) => !/\b(\w+)\s+\1\b/i.test(String(s))
};