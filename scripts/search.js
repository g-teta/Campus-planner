export function compileRegex(input, flags = 'i') {
  try {
    return new RegExp(input, flags);
  } catch (e) {
    console.error('Invalid regex pattern:', e);
    return null;
  }
}

export function highlight(text, re) {
  if (!re) return text;
  return text.replace(re, m => `<mark>${m}</mark>`);
}