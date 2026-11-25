import { it, expect } from 'vitest';
import {
  isCompanion,
  getCompanions,
  starKind,
} from '../../src/game/utils/star-systems.js';
import { STAR_DATA } from '../../src/game/data/star-data.js';

const byName = (n) => STAR_DATA.find((s) => s.name === n);

it('isCompanion', () => {
  expect(isCompanion(byName('Sirius B'))).toBe(true);
  expect(isCompanion(byName('Sirius'))).toBe(false);
  expect(isCompanion(byName('Proxima Centauri'))).toBe(false);
});

it('getCompanions', () => {
  expect(getCompanions(STAR_DATA, 99).map((s) => s.name)).toEqual([
    'Lalande 27173 B',
    'Lalande 27173 C',
    'Lalande 27173 D',
  ]);
  expect(getCompanions(STAR_DATA, 0)).toEqual([]);
});

it('starKind maps spectral class to plain English', () => {
  expect(starKind('A1')).toBe('main-sequence star');
  expect(starKind('G2')).toBe('main-sequence star');
  expect(starKind('M5.5')).toBe('red dwarf');
  expect(starKind('DA2')).toBe('white dwarf');
  expect(starKind('L8')).toBe('brown dwarf');
  expect(starKind('T6')).toBe('brown dwarf');
  expect(starKind('X9')).toBe('star');
});
