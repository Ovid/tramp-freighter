import { STAR_KINDS } from '../constants.js';

export function isCompanion(star) {
  return star.primary !== undefined;
}

export function getCompanions(starData, id) {
  return starData.filter((s) => s.primary === id);
}

export function starKind(type) {
  return STAR_KINDS[type?.charAt(0).toUpperCase()] ?? 'star';
}
