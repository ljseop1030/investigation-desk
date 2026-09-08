const buildLeakPattern = (triggers, charName) => {
  const words = triggers.map(escapeRegex).join('|');
  const name = `(^|[^A-Za-z가-힣])${escapeRegex(charName)}([^A-Za-z가-힣]|$)`;
  return new RegExp(`${name}|${words}`, 'i');
};