
export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "");
};

export const containsSearchTerm = (source: string, term: string): boolean => {
  if (!term) return false;
  return normalizeText(source).includes(normalizeText(term));
};

export const capitalizeName = (name: string): string => {
  if (!name || name === "N/A") return name;
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
