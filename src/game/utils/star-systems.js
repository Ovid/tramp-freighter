import { STAR_DATA } from '../data/star-data.js';
import { STAR_KINDS } from '../constants.js';

export function isCompanion(star) {
  return star.primary !== undefined;
}

const PRIMARY_IDS = new Set(
  STAR_DATA.filter(isCompanion).map((s) => s.primary)
);

/** "Sirius A" is "Sirius" on the map; a lone star keeps its name. */
export function getSystemName(star) {
  return PRIMARY_IDS.has(star.id) && star.name.endsWith(' A')
    ? star.name.slice(0, -2)
    : star.name;
}

export function getCompanions(starData, id) {
  return starData.filter((s) => s.primary === id);
}

export function starKind(type) {
  return STAR_KINDS[type?.charAt(0).toUpperCase()] ?? 'star';
}
