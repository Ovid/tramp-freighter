var Z = Object.defineProperty;
var ee = (s, e, t) =>
  e in s
    ? Z(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t })
    : (s[e] = t);
var D = (s, e, t) => ee(s, typeof e != 'symbol' ? e + '' : e, t);
import { r as R, a as te, R as V } from './vendor-wGySg1uH.js';
(function () {
  const e = document.createElement('link').relList;
  if (e && e.supports && e.supports('modulepreload')) return;
  for (const r of document.querySelectorAll('link[rel="modulepreload"]')) i(r);
  new MutationObserver((r) => {
    for (const n of r)
      if (n.type === 'childList')
        for (const a of n.addedNodes)
          a.tagName === 'LINK' && a.rel === 'modulepreload' && i(a);
  }).observe(document, { childList: !0, subtree: !0 });
  function t(r) {
    const n = {};
    return (
      r.integrity && (n.integrity = r.integrity),
      r.referrerPolicy && (n.referrerPolicy = r.referrerPolicy),
      r.crossOrigin === 'use-credentials'
        ? (n.credentials = 'include')
        : r.crossOrigin === 'anonymous'
          ? (n.credentials = 'omit')
          : (n.credentials = 'same-origin'),
      n
    );
  }
  function i(r) {
    if (r.ep) return;
    r.ep = !0;
    const n = t(r);
    fetch(r.href, n);
  }
})();
var j = { exports: {} },
  k = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var ie = R,
  re = Symbol.for('react.element'),
  se = Symbol.for('react.fragment'),
  ne = Object.prototype.hasOwnProperty,
  ae = ie.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  oe = { key: !0, ref: !0, __self: !0, __source: !0 };
function Y(s, e, t) {
  var i,
    r = {},
    n = null,
    a = null;
  (t !== void 0 && (n = '' + t),
    e.key !== void 0 && (n = '' + e.key),
    e.ref !== void 0 && (a = e.ref));
  for (i in e) ne.call(e, i) && !oe.hasOwnProperty(i) && (r[i] = e[i]);
  if (s && s.defaultProps)
    for (i in ((e = s.defaultProps), e)) r[i] === void 0 && (r[i] = e[i]);
  return {
    $$typeof: re,
    type: s,
    key: n,
    ref: a,
    props: r,
    _owner: ae.current,
  };
}
k.Fragment = se;
k.jsx = Y;
k.jsxs = Y;
j.exports = k;
var h = j.exports,
  O = {},
  B = te;
((O.createRoot = B.createRoot), (O.hydrateRoot = B.hydrateRoot));
class le extends V.Component {
  constructor(t) {
    super(t);
    D(this, 'handleReload', () => {
      window.location.reload();
    });
    this.state = { hasError: !1, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(t) {
    return { hasError: !0, error: t };
  }
  componentDidCatch(t, i) {
    (console.error('Error caught by ErrorBoundary:', t, i),
      this.setState({ errorInfo: i }));
  }
  render() {
    return this.state.hasError
      ? h.jsxs('div', {
          className: 'error-boundary',
          style: {
            padding: '40px',
            fontFamily: 'sans-serif',
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            borderRadius: '8px',
            marginTop: '40px',
          },
          children: [
            h.jsx('h2', {
              style: { color: '#ff6b6b', marginBottom: '20px' },
              children: 'Something went wrong',
            }),
            h.jsx('p', {
              style: { marginBottom: '20px' },
              children:
                'An error occurred in the application. You can try reloading the page to recover.',
            }),
            this.state.error &&
              h.jsxs('div', {
                style: {
                  backgroundColor: '#2a2a2a',
                  padding: '15px',
                  borderRadius: '4px',
                  marginBottom: '20px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: '#ff6b6b',
                  overflowX: 'auto',
                },
                children: [
                  h.jsx('strong', { children: 'Error:' }),
                  ' ',
                  this.state.error.toString(),
                  this.state.errorInfo &&
                    h.jsxs('details', {
                      style: { marginTop: '10px' },
                      children: [
                        h.jsx('summary', {
                          style: { cursor: 'pointer', color: '#aaa' },
                          children: 'Component Stack',
                        }),
                        h.jsx('pre', {
                          style: {
                            marginTop: '10px',
                            fontSize: '12px',
                            color: '#ccc',
                          },
                          children: this.state.errorInfo.componentStack,
                        }),
                      ],
                    }),
                ],
              }),
            h.jsx('button', {
              onClick: this.handleReload,
              style: {
                padding: '10px 20px',
                fontSize: '16px',
                cursor: 'pointer',
                backgroundColor: '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
              },
              children: 'Reload Application',
            }),
          ],
        })
      : this.props.children;
  }
}
const b = { ORBIT: 'ORBIT', STATION: 'STATION', PANEL: 'PANEL' };
function de() {
  const [s, e] = R.useState(b.ORBIT),
    [t, i] = R.useState(null),
    r = () => {
      e(b.STATION);
    },
    n = () => {
      (e(b.ORBIT), i(null));
    },
    a = (l) => {
      (i(l), e(b.PANEL));
    },
    o = () => {
      (e(b.STATION), i(null));
    };
  return h.jsx(le, {
    children: h.jsxs('div', {
      className: 'app-container',
      children: [
        h.jsx('div', {
          className: 'starmap-placeholder',
          style: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            backgroundColor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          },
          children: h.jsx('p', {
            children: 'StarMapCanvas will be implemented in task 6',
          }),
        }),
        h.jsxs('div', {
          className: 'hud-placeholder',
          style: {
            position: 'absolute',
            top: '20px',
            left: '20px',
            zIndex: 10,
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '4px',
          },
          children: [
            h.jsx('p', { children: 'HUD will be implemented in task 8' }),
            h.jsxs('p', { children: ['View Mode: ', s] }),
            h.jsx('button', { onClick: r, children: 'Dock (Test)' }),
          ],
        }),
        s === b.STATION &&
          h.jsxs('div', {
            className: 'station-menu-placeholder',
            style: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              backgroundColor: '#222',
              color: '#fff',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '300px',
            },
            children: [
              h.jsx('h2', { children: 'Station Menu' }),
              h.jsx('p', {
                children: 'StationMenu will be implemented in task 9',
              }),
              h.jsx('button', {
                onClick: () => a('trade'),
                children: 'Open Trade Panel (Test)',
              }),
              h.jsx('br', {}),
              h.jsx('button', {
                onClick: n,
                style: { marginTop: '10px' },
                children: 'Undock',
              }),
            ],
          }),
        s === b.PANEL &&
          h.jsxs('div', {
            className: 'panel-container-placeholder',
            style: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              backgroundColor: '#333',
              color: '#fff',
              padding: '20px',
              borderRadius: '8px',
              minWidth: '400px',
            },
            children: [
              h.jsxs('h2', { children: ['Panel: ', t] }),
              h.jsx('p', {
                children: 'PanelContainer will be implemented in task 9',
              }),
              h.jsx('button', { onClick: o, children: 'Close Panel' }),
            ],
          }),
      ],
    }),
  });
}
const ce = R.createContext(null);
function ue({ gameStateManager: s, children: e }) {
  return s
    ? h.jsx(ce.Provider, { value: s, children: e })
    : h.jsx('div', {
        className: 'game-loading',
        children: h.jsx('p', { children: 'Loading game...' }),
      });
}
const _ = 0,
  $ = 1,
  C = ['grain', 'ore', 'tritium', 'parts', 'medicine', 'electronics'],
  he = {
    grain: 10,
    ore: 15,
    tritium: 50,
    parts: 30,
    medicine: 40,
    electronics: 35,
  },
  v = {
    PRICES: { RECENT_VISIT: 50, NEVER_VISITED: 100, STALE_VISIT: 75 },
    RECENT_THRESHOLD: 30,
    MAX_AGE: 100,
    RELIABILITY: {
      MANIPULATION_CHANCE: 0.1,
      MIN_MANIPULATION_MULTIPLIER: 0.7,
      MAX_MANIPULATION_MULTIPLIER: 0.85,
    },
  },
  T = {
    CORE_SYSTEMS: { IDS: [_, $], PRICE_PER_PERCENT: 2 },
    INNER_SYSTEMS: { DISTANCE_THRESHOLD: 4.5, PRICE_PER_PERCENT: 3 },
    MID_RANGE_SYSTEMS: { DISTANCE_THRESHOLD: 10, PRICE_PER_PERCENT: 3 },
    OUTER_SYSTEMS: { PRICE_PER_PERCENT: 5 },
  },
  P = { LY_PER_UNIT: 20 / 279.3190870671033, FUEL_CAPACITY_EPSILON: 0.01 };
function q(s) {
  return Math.hypot(s.x, s.y, s.z) * P.LY_PER_UNIT;
}
const d = {
    DEFAULT_NAME: 'Serendipity',
    DEGRADATION: {
      HULL_PER_JUMP: 2,
      ENGINE_PER_JUMP: 1,
      LIFE_SUPPORT_PER_DAY: 0.5,
    },
    CONDITION_BOUNDS: { MIN: 0, MAX: 100 },
    CONDITION_WARNING_THRESHOLDS: { HULL: 50, ENGINE: 30, LIFE_SUPPORT: 20 },
    ENGINE_CONDITION_PENALTIES: {
      THRESHOLD: 60,
      FUEL_PENALTY_MULTIPLIER: 1.2,
      TIME_PENALTY_DAYS: 1,
    },
    QUIRKS: {
      sticky_seal: {
        name: 'Sticky Cargo Seal',
        description: 'The main cargo hatch sticks. Every. Single. Time.',
        effects: { loadingTime: 1.1, theftRisk: 0.95 },
        flavor: "You've learned to kick it in just the right spot.",
      },
      hot_thruster: {
        name: 'Hot Thruster',
        description: 'Port thruster runs hot. Burns extra fuel but responsive.',
        effects: { fuelConsumption: 1.05 },
        flavor: "The engineers say it's 'within tolerances.' Barely.",
      },
      sensitive_sensors: {
        name: 'Sensitive Sensors',
        description:
          'Sensor array picks up everything. Including false positives.',
        effects: { salvageDetection: 1.15, falseAlarms: 1.1 },
        flavor: "You've learned to tell the difference. Mostly.",
      },
      cramped_quarters: {
        name: 'Cramped Quarters',
        description: 'Living space is... cozy. Very cozy.',
        effects: { lifeSupportDrain: 0.9 },
        flavor: "At least you don't have to share.",
      },
      lucky_ship: {
        name: 'Lucky Ship',
        description: 'This ship has a history of beating the odds.',
        effects: { negateEventChance: 0.05 },
        flavor: 'Knock on hull plating.',
      },
      fuel_sipper: {
        name: 'Fuel Sipper',
        description: 'Efficient drive core. Previous owner was meticulous.',
        effects: { fuelConsumption: 0.85 },
        flavor: 'One of the few things that actually works better than spec.',
      },
      leaky_seals: {
        name: 'Leaky Seals',
        description: "Hull seals aren't quite right. Slow degradation.",
        effects: { hullDegradation: 1.5 },
        flavor: "You can hear the whistle when you're in the cargo bay.",
      },
      smooth_talker: {
        name: "Smooth Talker's Ride",
        description: 'Previous owner had a reputation. It rubs off.',
        effects: { npcRepGain: 1.05 },
        flavor: 'People remember this ship. Usually fondly.',
      },
    },
    UPGRADES: {
      extended_tank: {
        name: 'Extended Fuel Tank',
        cost: 3e3,
        description: 'Increases fuel capacity by 50%',
        effects: { fuelCapacity: 150 },
        tradeoff: 'Larger tank is more vulnerable to weapons fire.',
      },
      reinforced_hull: {
        name: 'Reinforced Hull Plating',
        cost: 5e3,
        description: 'Reduces hull degradation by 50%',
        effects: { hullDegradation: 0.5, cargoCapacity: 45 },
        tradeoff: 'Extra plating takes up cargo space.',
      },
      efficient_drive: {
        name: 'Efficient Drive System',
        cost: 4e3,
        description: 'Reduces fuel consumption by 20%',
        effects: { fuelConsumption: 0.8 },
        tradeoff: 'Optimized for efficiency, not speed.',
      },
      expanded_hold: {
        name: 'Expanded Cargo Hold',
        cost: 6e3,
        description: 'Increases cargo capacity by 50%',
        effects: { cargoCapacity: 75 },
        tradeoff: 'Heavier ship is less maneuverable.',
      },
      smuggler_panels: {
        name: "Smuggler's Panels",
        cost: 4500,
        description: 'Hidden cargo compartment (10 units)',
        effects: { hiddenCargoCapacity: 10 },
        tradeoff: 'If discovered, reputation loss with authorities.',
      },
      advanced_sensors: {
        name: 'Advanced Sensor Array',
        cost: 3500,
        description: 'See economic events one jump ahead',
        effects: { eventVisibility: 1 },
        tradeoff: 'None',
      },
      medical_bay: {
        name: 'Medical Bay',
        cost: 2500,
        description: 'Slower life support degradation',
        effects: { lifeSupportDrain: 0.7, cargoCapacity: 45 },
        tradeoff: 'Takes up cargo space.',
      },
    },
  },
  y = {
    MAX_COORD_DISTANCE: 21,
    MAX_TECH_LEVEL: 10,
    MIN_TECH_LEVEL: 1,
    MARKET_CAPACITY: 1e3,
    DAILY_RECOVERY_FACTOR: 0.9,
    TEMPORAL_WAVE_PERIOD: 30,
    TEMPORAL_AMPLITUDE: 0.15,
    TEMPORAL_PHASE_OFFSET: 0.15,
    TECH_LEVEL_MIDPOINT: 5,
    TECH_MODIFIER_INTENSITY: 0.08,
    LOCAL_MODIFIER_MIN: 0.25,
    LOCAL_MODIFIER_MAX: 2,
    MARKET_CONDITION_PRUNE_THRESHOLD: 1,
    TECH_BIASES: {
      grain: -0.6,
      ore: -0.8,
      tritium: -0.3,
      parts: 0.5,
      medicine: 0.7,
      electronics: 1,
    },
  },
  pe = { COST_PER_PERCENT: 5 },
  x = {
    STARTING_CREDITS: 500,
    STARTING_DEBT: 1e4,
    STARTING_CARGO_CAPACITY: 50,
    STARTING_GRAIN_QUANTITY: 20,
    STARTING_SHIP_NAME: d.DEFAULT_NAME,
  },
  A = '2.1.0',
  U = 'trampFreighterSave',
  fe = 1e3;
class g {
  static calculatePrice(e, t, i = 0, r = [], n = {}) {
    const a = he[e];
    if (a === void 0) throw new Error(`Unknown good type: ${e}`);
    if (!t || typeof t != 'object')
      throw new Error('System object required for price calculation');
    const o = g.calculateTechLevel(t),
      l = g.getTechModifier(e, o),
      c = g.getTemporalModifier(t.id, i),
      u = g.getLocalModifier(t.id, e, n),
      f = g.getEventModifier(t.id, e, r),
      m = a * l * c * u * f;
    return Math.round(m);
  }
  static getEventModifier(e, t, i) {
    if (!Array.isArray(i)) return 1;
    const r = i.find((n) => n.systemId === e);
    return !r || !r.modifiers ? 1 : r.modifiers[t] || 1;
  }
  static calculateTechLevel(e) {
    const t = q(e),
      i = Math.min(t, y.MAX_COORD_DISTANCE);
    return (
      y.MAX_TECH_LEVEL -
      ((y.MAX_TECH_LEVEL - y.MIN_TECH_LEVEL) * i) / y.MAX_COORD_DISTANCE
    );
  }
  static getTechModifier(e, t) {
    if (typeof e != 'string' || !e)
      throw new Error(
        `Invalid goodType: expected non-empty string, got ${typeof e}`
      );
    if (typeof t != 'number' || isNaN(t))
      throw new Error(
        `Invalid techLevel: expected valid number, got ${isNaN(t) ? 'NaN' : typeof t}`
      );
    const i = y.TECH_BIASES[e];
    if (i === void 0) throw new Error(`Unknown good type: ${e}`);
    return 1 + i * (y.TECH_LEVEL_MIDPOINT - t) * y.TECH_MODIFIER_INTENSITY;
  }
  static getTemporalModifier(e, t) {
    if (typeof e != 'number')
      throw new Error(`Invalid systemId: expected number, got ${typeof e}`);
    if (typeof t != 'number' || isNaN(t) || t < 0)
      throw new Error(
        `Invalid currentDay: expected non-negative number, got ${isNaN(t) ? 'NaN' : t}`
      );
    const i =
      (2 * Math.PI * t) / y.TEMPORAL_WAVE_PERIOD + e * y.TEMPORAL_PHASE_OFFSET;
    return 1 + y.TEMPORAL_AMPLITUDE * Math.sin(i);
  }
  static getLocalModifier(e, t, i) {
    var o;
    if (typeof e != 'number')
      throw new Error(`Invalid systemId: expected number, got ${typeof e}`);
    if (typeof t != 'string' || !t)
      throw new Error(
        `Invalid goodType: expected non-empty string, got ${typeof t}`
      );
    const n =
      1 -
      (((o = i == null ? void 0 : i[e]) == null ? void 0 : o[t]) ?? 0) /
        y.MARKET_CAPACITY;
    return Math.max(y.LOCAL_MODIFIER_MIN, Math.min(y.LOCAL_MODIFIER_MAX, n));
  }
  static calculateCargoUsed(e) {
    return Array.isArray(e) ? e.reduce((t, i) => t + (i.qty || 0), 0) : 0;
  }
  static calculateCargoValue(e) {
    if (!e || typeof e != 'object')
      throw new Error('Invalid cargo entry: expected object');
    if (typeof e.qty != 'number')
      throw new Error('Invalid cargo entry: qty must be a number');
    if (typeof e.buyPrice != 'number')
      throw new Error('Invalid cargo entry: buyPrice must be a number');
    return e.qty * e.buyPrice;
  }
  static calculateCargoTotals(e) {
    if (!Array.isArray(e)) throw new Error('Invalid cargo: expected array');
    let t = 0,
      i = 0;
    for (const r of e) {
      if (typeof r.qty != 'number')
        throw new Error('Invalid cargo stack: qty must be a number');
      ((t += r.qty), (i += g.calculateCargoValue(r)));
    }
    return { totalCapacityUsed: t, totalValue: i };
  }
  static validatePurchase(e, t, i, r) {
    return i * r > e
      ? { valid: !1, reason: 'Insufficient credits' }
      : i > t
        ? { valid: !1, reason: 'Not enough cargo space' }
        : { valid: !0 };
  }
  static validateSale(e, t, i) {
    if (!Array.isArray(e) || t < 0 || t >= e.length)
      return { valid: !1, reason: 'Invalid cargo stack' };
    const r = e[t];
    return i > r.qty
      ? { valid: !1, reason: 'Not enough quantity in stack' }
      : { valid: !0 };
  }
  static recordCargoPurchase(e, t, i, r, n, a, o) {
    const l = e.findIndex((u) => u.good === t && u.buyPrice === r);
    if (l !== -1) {
      const u = [...e];
      return ((u[l] = { ...u[l], qty: u[l].qty + i }), u);
    }
    const c = {
      good: t,
      qty: i,
      buyPrice: r,
      buySystem: n,
      buySystemName: a,
      buyDate: o,
    };
    return [...e, c];
  }
  static addCargoStack(e, t, i, r, n = null, a = null, o = null) {
    const l = e.findIndex((u) => u.good === t && u.buyPrice === r);
    if (l !== -1) {
      const u = [...e];
      return ((u[l] = { ...u[l], qty: u[l].qty + i }), u);
    }
    const c = { good: t, qty: i, buyPrice: r };
    return (
      n !== null && (c.buySystem = n),
      a !== null && (c.buySystemName = a),
      o !== null && (c.buyDate = o),
      [...e, c]
    );
  }
  static removeFromCargoStack(e, t, i) {
    const r = [...e],
      n = r[t];
    return ((n.qty -= i), n.qty <= 0 && r.splice(t, 1), r);
  }
}
class M {
  constructor(e) {
    this.hash = this._stringToHash(e);
  }
  _stringToHash(e) {
    let t = 0;
    for (let i = 0; i < e.length; i++)
      ((t = (t << 5) - t + e.charCodeAt(i)), (t = t & t));
    return t;
  }
  next() {
    return (
      (this.hash = (this.hash * 9301 + 49297) % 233280),
      Math.abs(this.hash) / 233280
    );
  }
  nextInt(e, t) {
    const i = t - e + 1;
    return Math.floor(this.next() * i) + e;
  }
  nextFloat(e, t) {
    const i = t - e;
    return this.next() * i + e;
  }
}
const E = class E {
  static updateEvents(e, t) {
    var n, a;
    if (!e || !t) return [];
    const i = ((n = e.player) == null ? void 0 : n.daysElapsed) || 0;
    let r = ((a = e.world) == null ? void 0 : a.activeEvents) || [];
    r = E.removeExpiredEvents(r, i);
    for (const o in E.EVENT_TYPES) {
      const l = E.EVENT_TYPES[o];
      for (const c of t) {
        if (r.some((p) => p.systemId === c.id) || !E.isSystemEligible(c, l))
          continue;
        const u = `event_${o}_${c.id}_${i}`;
        if (new M(u).next() < l.chance) {
          const p = E.createEvent(o, c.id, i);
          r.push(p);
          break;
        }
      }
    }
    return r;
  }
  static isSystemEligible(e, t) {
    var r;
    if (!e || !t) return !1;
    const i = t.targetSystems;
    if (i === 'any') return !0;
    if (i === 'core') return E.CORE_SYSTEM_IDS.includes(e.id);
    if (i === 'mining') {
      const n = (r = e.type) == null ? void 0 : r.charAt(0).toUpperCase();
      return E.MINING_SPECTRAL_CLASSES.includes(n);
    }
    return !1;
  }
  static createEvent(e, t, i) {
    const r = E.EVENT_TYPES[e];
    if (!r) throw new Error(`Unknown event type: ${e}`);
    const n = `${e}_${t}_${i}`,
      a = `duration_${n}`,
      o = new M(a),
      [l, c] = r.duration,
      u = l + Math.floor(o.next() * (c - l + 1)),
      f = i + u;
    let m = { ...r.modifiers };
    if (e === 'supply_glut') {
      const p = `commodity_${n}`,
        I = new M(p),
        w = Math.floor(I.next() * C.length);
      m = { [C[w]]: 0.6 };
    }
    return {
      id: n,
      type: e,
      systemId: t,
      startDay: i,
      endDay: f,
      modifiers: m,
    };
  }
  static removeExpiredEvents(e, t) {
    return Array.isArray(e) ? e.filter((i) => i.endDay >= t) : [];
  }
  static getActiveEventForSystem(e, t) {
    return (Array.isArray(t) && t.find((i) => i.systemId === e)) || null;
  }
};
(D(E, 'EVENT_TYPES', {
  mining_strike: {
    name: 'Mining Strike',
    description: 'Workers demand better conditions',
    duration: [5, 10],
    modifiers: { ore: 1.5, tritium: 1.3 },
    chance: 0.05,
    targetSystems: 'mining',
  },
  medical_emergency: {
    name: 'Medical Emergency',
    description: 'Outbreak requires urgent supplies',
    duration: [3, 5],
    modifiers: { medicine: 2, grain: 0.9, ore: 0.9 },
    chance: 0.03,
    targetSystems: 'any',
  },
  festival: {
    name: 'Cultural Festival',
    description: 'Celebration drives luxury demand',
    duration: [2, 4],
    modifiers: { electronics: 1.75, grain: 1.2 },
    chance: 0.04,
    targetSystems: 'core',
  },
  supply_glut: {
    name: 'Supply Glut',
    description: 'Oversupply crashes prices',
    duration: [3, 7],
    modifiers: {},
    chance: 0.06,
    targetSystems: 'any',
  },
}),
  D(E, 'CORE_SYSTEM_IDS', [_, $]),
  D(E, 'MINING_SPECTRAL_CLASSES', ['M', 'L', 'T']));
let L = E;
class N {
  static getIntelligenceCost(e, t) {
    const i = t[e];
    return i
      ? i.lastVisit <= v.RECENT_THRESHOLD
        ? v.PRICES.RECENT_VISIT
        : v.PRICES.STALE_VISIT
      : v.PRICES.NEVER_VISITED;
  }
  static purchaseIntelligence(e, t, i) {
    const r = e.world.priceKnowledge || {},
      n = e.player.credits,
      a = N.getIntelligenceCost(t, r),
      o = N.validatePurchase(a, n);
    if (!o.valid) return { success: !1, reason: o.reason };
    const l = i.find((w) => w.id === t);
    if (!l) return { success: !1, reason: 'System not found' };
    const c = e.player.daysElapsed,
      u = e.world.activeEvents || [],
      f = {},
      m = `intel_${t}_${c}`,
      p = new M(m),
      I = e.world.marketConditions || {};
    for (const w of C) {
      let S = g.calculatePrice(w, l, c, u, I);
      if (p.next() < v.RELIABILITY.MANIPULATION_CHANCE) {
        const Q =
          v.RELIABILITY.MIN_MANIPULATION_MULTIPLIER +
          p.next() *
            (v.RELIABILITY.MAX_MANIPULATION_MULTIPLIER -
              v.RELIABILITY.MIN_MANIPULATION_MULTIPLIER);
        S = Math.round(S * Q);
      }
      f[w] = S;
    }
    return (
      (e.player.credits -= a),
      (e.world.priceKnowledge[t] = { lastVisit: 0, prices: f }),
      { success: !0, reason: null }
    );
  }
  static cleanupOldIntelligence(e) {
    let t = 0;
    for (const i in e) e[i].lastVisit > v.MAX_AGE && (delete e[i], t++);
    return t;
  }
  static generateRumor(e, t) {
    const i = e.player.daysElapsed,
      r = e.world.activeEvents || [],
      n = `rumor_${i}`,
      a = new M(n);
    if (r.length > 0 && a.next() < 0.5) {
      const m = Math.floor(a.next() * r.length),
        p = r[m],
        I = t.find((w) => w.id === p.systemId);
      if (I) {
        const S =
          {
            mining_strike: 'labor troubles',
            medical_emergency: 'a health crisis',
            festival: 'celebrations',
            supply_glut: 'oversupply issues',
          }[p.type] || 'unusual market conditions';
        return `I heard ${I.name} is experiencing ${S}. Might be worth checking out.`;
      }
    }
    const o = Math.floor(a.next() * C.length),
      l = C[o],
      c = e.world.marketConditions || {};
    let u = null,
      f = 1 / 0;
    for (const m of t) {
      const p = g.calculatePrice(l, m, i, r, c);
      p < f && ((f = p), (u = m));
    }
    return u
      ? `Word on the street is that ${l} prices are pretty good at ${u.name} right now.`
      : 'The markets are always changing. Keep your eyes open for opportunities.';
  }
  static validatePurchase(e, t) {
    return t < e
      ? { valid: !1, reason: 'Insufficient credits for intelligence' }
      : { valid: !0, reason: null };
  }
  static listAvailableIntelligence(e, t, i, r, n = [], a = !1) {
    const o = r.getConnectedSystems(i);
    return t
      .filter((l) => o.includes(l.id))
      .map((l) => {
        const c = e[l.id],
          u = N.getIntelligenceCost(l.id, e),
          f = c ? c.lastVisit : null,
          m = { systemId: l.id, systemName: l.name, cost: u, lastVisit: f };
        if (a && n.length > 0) {
          const p = n.find((I) => I.systemId === l.id);
          p &&
            (m.event = {
              name: p.name,
              commodity: p.commodity,
              modifier: p.modifier,
            });
        }
        return m;
      });
  }
}
function me(s, e, t) {
  if (!s)
    return (
      console.error('Cannot save: no game state exists'),
      { success: !1, newLastSaveTime: e }
    );
  const i = Date.now();
  if (i - e < fe)
    return (
      t || console.log('Save debounced (too soon since last save)'),
      { success: !1, newLastSaveTime: e }
    );
  try {
    const r = { ...s, meta: { ...s.meta, timestamp: i } },
      n = JSON.stringify(r);
    return (
      localStorage.setItem(U, n),
      t || console.log('Game saved successfully'),
      { success: !0, newLastSaveTime: i }
    );
  } catch (r) {
    return (
      console.error('Failed to save game:', r),
      { success: !1, newLastSaveTime: e }
    );
  }
}
function W(s) {
  try {
    const e = localStorage.getItem(U);
    if (!e) return (s || console.log('No saved game found'), null);
    const t = JSON.parse(e);
    return (s || console.log('Game loaded successfully'), t);
  } catch (e) {
    return (s || console.log('Failed to load game:', e), null);
  }
}
function ye() {
  try {
    return localStorage.getItem(U) !== null;
  } catch (s) {
    return (console.error('Failed to check for saved game:', s), !1);
  }
}
function ge(s) {
  try {
    return (
      localStorage.removeItem(U),
      s || console.log('Save data cleared'),
      !0
    );
  } catch (e) {
    return (console.error('Failed to clear save:', e), !1);
  }
}
function z(s, e, t) {
  const i = [];
  for (const r of s)
    e[r]
      ? i.push(r)
      : console.warn(`Unknown ${t} ID: ${r}, removing from save data`);
  return i;
}
function K(s, e, t, i) {
  for (const r of s) {
    if (!r.good || typeof r.qty != 'number') {
      console.warn(`Invalid ${i} stack found, skipping:`, r);
      continue;
    }
    if (
      (typeof r.buyPrice != 'number' &&
        (console.warn(`${i} stack missing buyPrice, using 0:`, r.good),
        (r.buyPrice = 0)),
      typeof r.buySystem != 'number' &&
        (console.warn(
          `${i} stack missing buySystem, using current system:`,
          r.good
        ),
        (r.buySystem = e)),
      typeof r.buySystemName != 'string')
    ) {
      const n = t.find((a) => a.id === r.buySystem);
      r.buySystemName = n ? n.name : 'Unknown';
    }
    typeof r.buyDate != 'number' && (r.buyDate = 0);
  }
}
function X(s, e, t) {
  if (
    (s.purchasePrice !== void 0 &&
      s.buyPrice === void 0 &&
      ((s.buyPrice = s.purchasePrice), delete s.purchasePrice),
    s.purchaseSystem !== void 0 &&
      s.buySystem === void 0 &&
      ((s.buySystem = s.purchaseSystem), delete s.purchaseSystem),
    s.purchaseDay !== void 0 &&
      s.buyDate === void 0 &&
      ((s.buyDate = s.purchaseDay), delete s.purchaseDay),
    s.buySystem === void 0 && (s.buySystem = e),
    s.buySystemName === void 0)
  ) {
    const i = t.find((r) => r.id === s.buySystem);
    s.buySystemName = i ? i.name : 'Unknown';
  }
  s.buyDate === void 0 && (s.buyDate = 0);
}
function Ee(s) {
  return s
    ? s === A ||
        (s === '1.0.0' && A === '2.1.0') ||
        (s === '2.0.0' && A === '2.1.0')
    : !1;
}
function we(s) {
  if (
    !s ||
    !s.player ||
    typeof s.player.credits != 'number' ||
    typeof s.player.debt != 'number' ||
    typeof s.player.currentSystem != 'number' ||
    typeof s.player.daysElapsed != 'number' ||
    !s.ship ||
    typeof s.ship.name != 'string' ||
    typeof s.ship.fuel != 'number' ||
    typeof s.ship.cargoCapacity != 'number' ||
    !Array.isArray(s.ship.cargo) ||
    (s.ship.quirks !== void 0 && !Array.isArray(s.ship.quirks)) ||
    (s.ship.upgrades !== void 0 && !Array.isArray(s.ship.upgrades)) ||
    (s.ship.hiddenCargo !== void 0 && !Array.isArray(s.ship.hiddenCargo)) ||
    (s.ship.hiddenCargoCapacity !== void 0 &&
      typeof s.ship.hiddenCargoCapacity != 'number') ||
    (s.ship.hull !== void 0 && typeof s.ship.hull != 'number') ||
    (s.ship.engine !== void 0 && typeof s.ship.engine != 'number') ||
    (s.ship.lifeSupport !== void 0 && typeof s.ship.lifeSupport != 'number')
  )
    return !1;
  for (const e of s.ship.cargo)
    if (
      !e.good ||
      typeof e.qty != 'number' ||
      !(typeof e.buyPrice == 'number' || typeof e.purchasePrice == 'number') ||
      (e.buySystem !== void 0 && typeof e.buySystem != 'number') ||
      (e.purchaseSystem !== void 0 && typeof e.purchaseSystem != 'number') ||
      (e.buySystemName !== void 0 && typeof e.buySystemName != 'string') ||
      (e.buyDate !== void 0 && typeof e.buyDate != 'number') ||
      (e.purchaseDay !== void 0 && typeof e.purchaseDay != 'number')
    )
      return !1;
  if (!s.world || !Array.isArray(s.world.visitedSystems)) return !1;
  if (s.world.priceKnowledge !== void 0) {
    if (typeof s.world.priceKnowledge != 'object') return !1;
    for (const e in s.world.priceKnowledge) {
      const t = s.world.priceKnowledge[e];
      if (!t || typeof t.lastVisit != 'number' || typeof t.prices != 'object')
        return !1;
    }
  }
  return !(
    (s.world.activeEvents !== void 0 && !Array.isArray(s.world.activeEvents)) ||
    !s.meta ||
    typeof s.meta.version != 'string' ||
    typeof s.meta.timestamp != 'number'
  );
}
function Ie(s, e, t) {
  if (
    (t || console.log('Migrating save from v1.0.0 to v2.1.0'),
    s.ship.hull === void 0 && (s.ship.hull = d.CONDITION_BOUNDS.MAX),
    s.ship.engine === void 0 && (s.ship.engine = d.CONDITION_BOUNDS.MAX),
    s.ship.lifeSupport === void 0 &&
      (s.ship.lifeSupport = d.CONDITION_BOUNDS.MAX),
    s.ship.cargo &&
      Array.isArray(s.ship.cargo) &&
      s.ship.cargo.forEach((i) => {
        X(i, s.player.currentSystem, e);
      }),
    s.ship.quirks || (s.ship.quirks = []),
    s.ship.upgrades || (s.ship.upgrades = []),
    s.ship.hiddenCargo || (s.ship.hiddenCargo = []),
    s.ship.hiddenCargoCapacity === void 0 && (s.ship.hiddenCargoCapacity = 0),
    Array.isArray(s.ship.quirks) &&
      (s.ship.quirks = z(s.ship.quirks, d.QUIRKS, 'quirk')),
    Array.isArray(s.ship.upgrades) &&
      (s.ship.upgrades = z(s.ship.upgrades, d.UPGRADES, 'upgrade')),
    !s.world.priceKnowledge)
  ) {
    s.world.priceKnowledge = {};
    const i = s.player.currentSystem,
      r = e.find((l) => l.id === i);
    if (!r)
      throw new Error(
        `Migration failed: current system ID ${i} not found in star data`
      );
    const n = s.player.daysElapsed,
      a = {},
      o = {};
    for (const l of C) o[l] = g.calculatePrice(l, r, n, [], a);
    s.world.priceKnowledge[i] = { lastVisit: 0, prices: o };
  }
  return (
    s.world.activeEvents || (s.world.activeEvents = []),
    s.world.marketConditions || (s.world.marketConditions = {}),
    (s.meta.version = A),
    t || console.log('Migration complete'),
    s
  );
}
function Ce(s, e) {
  return (
    e || console.log('Migrating save from v2.0.0 to v2.1.0'),
    s.world.marketConditions || (s.world.marketConditions = {}),
    (s.meta.version = A),
    e || console.log('Migration complete'),
    s
  );
}
function Se(s, e) {
  if (
    (s.ship.hull === void 0 && (s.ship.hull = d.CONDITION_BOUNDS.MAX),
    s.ship.engine === void 0 && (s.ship.engine = d.CONDITION_BOUNDS.MAX),
    s.ship.lifeSupport === void 0 &&
      (s.ship.lifeSupport = d.CONDITION_BOUNDS.MAX),
    s.ship.cargo &&
      Array.isArray(s.ship.cargo) &&
      s.ship.cargo.forEach((t) => {
        X(t, s.player.currentSystem, e);
      }),
    s.ship.quirks || (s.ship.quirks = []),
    s.ship.upgrades || (s.ship.upgrades = []),
    s.ship.hiddenCargo || (s.ship.hiddenCargo = []),
    s.ship.hiddenCargoCapacity === void 0 && (s.ship.hiddenCargoCapacity = 0),
    Array.isArray(s.ship.quirks) &&
      (s.ship.quirks = z(s.ship.quirks, d.QUIRKS, 'quirk')),
    Array.isArray(s.ship.upgrades) &&
      (s.ship.upgrades = z(s.ship.upgrades, d.UPGRADES, 'upgrade')),
    Array.isArray(s.ship.cargo) &&
      K(s.ship.cargo, s.player.currentSystem, e, 'Cargo'),
    Array.isArray(s.ship.hiddenCargo) &&
      K(s.ship.hiddenCargo, s.player.currentSystem, e, 'Hidden cargo'),
    !s.world.priceKnowledge)
  ) {
    s.world.priceKnowledge = {};
    const t = s.player.currentSystem,
      i = e.find((o) => o.id === t);
    if (!i)
      throw new Error(
        `Load failed: current system ID ${t} not found in star data`
      );
    const r = s.player.daysElapsed,
      n = {},
      a = {};
    for (const o of C) a[o] = g.calculatePrice(o, i, r, [], n);
    s.world.priceKnowledge[t] = { lastVisit: 0, prices: a };
  }
  return (
    s.world.activeEvents || (s.world.activeEvents = []),
    s.world.marketConditions || (s.world.marketConditions = {}),
    s
  );
}
function ve(s) {
  return !s || s.trim().length === 0
    ? d.DEFAULT_NAME
    : s
        .replace(/<[^>]*>/g, '')
        .substring(0, 50)
        .trim() || d.DEFAULT_NAME;
}
class Ne {
  constructor(e, t, i = null) {
    ((this.starData = e),
      (this.wormholeData = t),
      (this.navigationSystem = i),
      (this.isTestEnvironment = typeof process < 'u' && !1),
      (this.subscribers = {
        creditsChanged: [],
        debtChanged: [],
        fuelChanged: [],
        cargoChanged: [],
        locationChanged: [],
        timeChanged: [],
        priceKnowledgeChanged: [],
        activeEventsChanged: [],
        shipConditionChanged: [],
        conditionWarning: [],
        shipNameChanged: [],
      }),
      (this.state = null),
      (this.lastSaveTime = 0));
  }
  assignShipQuirks(e = Math.random) {
    const t = Object.keys(d.QUIRKS),
      i = e() < 0.5 ? 2 : 3,
      r = new Set();
    for (; r.size < i; ) {
      const n = t[Math.floor(e() * t.length)];
      r.add(n);
    }
    return Array.from(r);
  }
  applyQuirkModifiers(e, t, i) {
    let r = e;
    for (const n of i) {
      const a = d.QUIRKS[n];
      if (!a)
        throw new Error(
          `Invalid quirk ID: ${n} not found in SHIP_CONFIG.QUIRKS`
        );
      a.effects[t] && (r *= a.effects[t]);
    }
    return r;
  }
  getQuirkDefinition(e) {
    return d.QUIRKS[e] || null;
  }
  initNewGame() {
    const e = this.starData.find((l) => l.id === _),
      t = 0,
      i = [],
      r = {},
      n = g.calculatePrice('grain', e, t, i, r),
      a = {};
    for (const l of C) a[l] = g.calculatePrice(l, e, t, i, r);
    const o = this.assignShipQuirks();
    return (
      (this.state = {
        player: {
          credits: x.STARTING_CREDITS,
          debt: x.STARTING_DEBT,
          currentSystem: _,
          daysElapsed: 0,
        },
        ship: {
          name: x.STARTING_SHIP_NAME,
          quirks: o,
          upgrades: [],
          fuel: d.CONDITION_BOUNDS.MAX,
          hull: d.CONDITION_BOUNDS.MAX,
          engine: d.CONDITION_BOUNDS.MAX,
          lifeSupport: d.CONDITION_BOUNDS.MAX,
          cargoCapacity: x.STARTING_CARGO_CAPACITY,
          cargo: [
            {
              good: 'grain',
              qty: x.STARTING_GRAIN_QUANTITY,
              buyPrice: n,
              buySystem: _,
              buySystemName: 'Sol',
              buyDate: 0,
            },
          ],
          hiddenCargo: [],
          hiddenCargoCapacity: 0,
        },
        world: {
          visitedSystems: [_],
          priceKnowledge: { [_]: { lastVisit: 0, prices: a } },
          activeEvents: [],
          marketConditions: {},
        },
        meta: { version: A, timestamp: Date.now() },
      }),
      this.isTestEnvironment ||
        console.log('New game initialized:', this.state),
      this.emit('creditsChanged', this.state.player.credits),
      this.emit('debtChanged', this.state.player.debt),
      this.emit('fuelChanged', this.state.ship.fuel),
      this.emit('cargoChanged', this.state.ship.cargo),
      this.emit('locationChanged', this.state.player.currentSystem),
      this.emit('timeChanged', this.state.player.daysElapsed),
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge),
      this.emit('shipConditionChanged', {
        hull: this.state.ship.hull,
        engine: this.state.ship.engine,
        lifeSupport: this.state.ship.lifeSupport,
      }),
      this.state
    );
  }
  subscribe(e, t) {
    if (!this.subscribers[e]) {
      console.warn(`Unknown event type: ${e}`);
      return;
    }
    (this.subscribers[e].push(t),
      this.isTestEnvironment ||
        console.log(
          `Subscribed to ${e}, total subscribers: ${this.subscribers[e].length}`
        ));
  }
  unsubscribe(e, t) {
    if (!this.subscribers[e]) return;
    const i = this.subscribers[e].indexOf(t);
    i > -1 && this.subscribers[e].splice(i, 1);
  }
  emit(e, t) {
    this.subscribers[e] &&
      this.subscribers[e].forEach((i) => {
        try {
          i(t);
        } catch (r) {
          console.error(`Error in ${e} subscriber:`, r);
        }
      });
  }
  getState() {
    return this.state;
  }
  getPlayer() {
    if (!this.state)
      throw new Error(
        'Invalid state: getPlayer called before game initialization'
      );
    return this.state.player;
  }
  getShip() {
    if (!this.state)
      throw new Error(
        'Invalid state: getShip called before game initialization'
      );
    return this.state.ship;
  }
  getCurrentSystem() {
    if (!this.state)
      throw new Error(
        'Invalid state: getCurrentSystem called before game initialization'
      );
    const e = this.state.player.currentSystem,
      t = this.starData.find((i) => i.id === e);
    if (!t)
      throw new Error(
        `Invalid game state: current system ID ${e} not found in star data`
      );
    return t;
  }
  getCargoUsed() {
    if (!this.state)
      throw new Error(
        'Invalid state: getCargoUsed called before game initialization'
      );
    return this.state.ship.cargo.reduce((e, t) => e + t.qty, 0);
  }
  getCargoRemaining() {
    if (!this.state)
      throw new Error(
        'Invalid state: getCargoRemaining called before game initialization'
      );
    return this.state.ship.cargoCapacity - this.getCargoUsed();
  }
  getFuelCapacity() {
    if (!this.state)
      throw new Error(
        'Invalid state: getFuelCapacity called before game initialization'
      );
    return this.calculateShipCapabilities().fuelCapacity;
  }
  isSystemVisited(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: isSystemVisited called before game initialization'
      );
    return this.state.world.visitedSystems.includes(e);
  }
  getShipCondition() {
    if (!this.state)
      throw new Error(
        'Invalid state: getShipCondition called before game initialization'
      );
    return {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    };
  }
  checkConditionWarnings() {
    const e = this.getShipCondition();
    if (!e) return [];
    const t = [];
    return (
      e.hull < d.CONDITION_WARNING_THRESHOLDS.HULL &&
        t.push({
          system: 'hull',
          message: 'Risk of cargo loss during jumps',
          severity: 'warning',
        }),
      e.engine < d.CONDITION_WARNING_THRESHOLDS.ENGINE &&
        t.push({
          system: 'engine',
          message: 'Jump failure risk - immediate repairs recommended',
          severity: 'warning',
        }),
      e.lifeSupport < d.CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT &&
        t.push({
          system: 'lifeSupport',
          message: 'Critical condition - urgent repairs required',
          severity: 'critical',
        }),
      t
    );
  }
  getPriceKnowledge() {
    if (!this.state)
      throw new Error(
        'Invalid state: getPriceKnowledge called before game initialization'
      );
    return this.state.world.priceKnowledge || {};
  }
  getKnownPrices(e) {
    var t;
    if (!this.state)
      throw new Error(
        'Invalid state: getKnownPrices called before game initialization'
      );
    if (!this.state.world.priceKnowledge)
      throw new Error('Invalid state: priceKnowledge missing from world state');
    return (
      ((t = this.state.world.priceKnowledge[e]) == null ? void 0 : t.prices) ||
      null
    );
  }
  hasVisitedSystem(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: hasVisitedSystem called before game initialization'
      );
    if (!this.state.world.priceKnowledge)
      throw new Error('Invalid state: priceKnowledge missing from world state');
    return this.state.world.priceKnowledge[e] !== void 0;
  }
  updateCredits(e) {
    ((this.state.player.credits = e), this.emit('creditsChanged', e));
  }
  updateDebt(e) {
    ((this.state.player.debt = e), this.emit('debtChanged', e));
  }
  updateFuel(e) {
    const t = this.getFuelCapacity();
    if (e < d.CONDITION_BOUNDS.MIN || e > t)
      throw new Error(
        `Invalid fuel value: ${e}. Fuel must be between ${d.CONDITION_BOUNDS.MIN} and ${t}.`
      );
    ((this.state.ship.fuel = e), this.emit('fuelChanged', e));
  }
  updateCargo(e) {
    ((this.state.ship.cargo = e), this.emit('cargoChanged', e));
  }
  updateLocation(e) {
    ((this.state.player.currentSystem = e),
      this.state.world.visitedSystems.includes(e) ||
        this.state.world.visitedSystems.push(e),
      this.emit('locationChanged', e));
  }
  setCredits(e) {
    this.updateCredits(e);
  }
  setDebt(e) {
    this.updateDebt(e);
  }
  setFuel(e) {
    this.updateFuel(e);
  }
  updateTime(e) {
    const t = this.state.player.daysElapsed;
    if (((this.state.player.daysElapsed = e), e > t)) {
      const i = e - t;
      (this.incrementPriceKnowledgeStaleness(i),
        N.cleanupOldIntelligence(this.state.world.priceKnowledge),
        this.applyMarketRecovery(i),
        (this.state.world.activeEvents = L.updateEvents(
          this.state,
          this.starData
        )),
        this.recalculatePricesForKnownSystems(),
        this.emit('activeEventsChanged', this.state.world.activeEvents));
    }
    this.emit('timeChanged', e);
  }
  updateShipName(e) {
    const t = ve(e);
    ((this.state.ship.name = t), this.emit('shipNameChanged', t));
  }
  updateShipCondition(e, t, i) {
    ((this.state.ship.hull = Math.max(
      d.CONDITION_BOUNDS.MIN,
      Math.min(d.CONDITION_BOUNDS.MAX, e)
    )),
      (this.state.ship.engine = Math.max(
        d.CONDITION_BOUNDS.MIN,
        Math.min(d.CONDITION_BOUNDS.MAX, t)
      )),
      (this.state.ship.lifeSupport = Math.max(
        d.CONDITION_BOUNDS.MIN,
        Math.min(d.CONDITION_BOUNDS.MAX, i)
      )),
      this.emit('shipConditionChanged', {
        hull: this.state.ship.hull,
        engine: this.state.ship.engine,
        lifeSupport: this.state.ship.lifeSupport,
      }));
    const r = this.checkConditionWarnings();
    r.length > 0 &&
      r.forEach((n) => {
        this.emit('conditionWarning', n);
      });
  }
  updateMarketConditions(e, t, i) {
    (this.state.world.marketConditions ||
      (this.state.world.marketConditions = {}),
      this.state.world.marketConditions[e] ||
        (this.state.world.marketConditions[e] = {}),
      this.state.world.marketConditions[e][t] === void 0 &&
        (this.state.world.marketConditions[e][t] = 0),
      (this.state.world.marketConditions[e][t] += i));
  }
  applyMarketRecovery(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: applyMarketRecovery called before game initialization'
      );
    if (!this.state.world.marketConditions)
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    const t = Math.pow(y.DAILY_RECOVERY_FACTOR, e);
    for (const i in this.state.world.marketConditions) {
      const r = this.state.world.marketConditions[i];
      for (const n in r)
        ((r[n] *= t),
          Math.abs(r[n]) < y.MARKET_CONDITION_PRUNE_THRESHOLD && delete r[n]);
      Object.keys(r).length === 0 &&
        delete this.state.world.marketConditions[i];
    }
  }
  updatePriceKnowledge(e, t, i = 0) {
    (this.state.world.priceKnowledge || (this.state.world.priceKnowledge = {}),
      (this.state.world.priceKnowledge[e] = { lastVisit: i, prices: { ...t } }),
      this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge));
  }
  incrementPriceKnowledgeStaleness(e = 1) {
    if (!this.state)
      throw new Error(
        'Invalid state: incrementPriceKnowledgeStaleness called before game initialization'
      );
    if (!this.state.world.priceKnowledge)
      throw new Error('Invalid state: priceKnowledge missing from world state');
    for (const t in this.state.world.priceKnowledge)
      this.state.world.priceKnowledge[t].lastVisit += e;
    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }
  recalculatePricesForKnownSystems() {
    if (!this.state)
      throw new Error(
        'Invalid state: recalculatePricesForKnownSystems called before game initialization'
      );
    if (!this.state.world.priceKnowledge) return;
    const e = this.state.player.daysElapsed,
      t = this.state.world.activeEvents;
    if (!t)
      throw new Error('Invalid state: activeEvents missing from world state');
    const i = this.state.world.marketConditions;
    if (!i)
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    for (const r in this.state.world.priceKnowledge) {
      const n = parseInt(r),
        a = this.starData.find((o) => o.id === n);
      if (a) {
        const o = {};
        for (const l of C) o[l] = g.calculatePrice(l, a, e, t, i);
        this.state.world.priceKnowledge[n].prices = o;
      }
    }
    this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge);
  }
  getActiveEvents() {
    if (!this.state)
      throw new Error(
        'Invalid state: getActiveEvents called before game initialization'
      );
    return this.state.world.activeEvents || [];
  }
  updateActiveEvents(e) {
    (this.state.world.activeEvents || (this.state.world.activeEvents = []),
      (this.state.world.activeEvents = e),
      this.emit('activeEventsChanged', e));
  }
  getActiveEventForSystem(e) {
    return this.getActiveEvents().find((i) => i.systemId === e) || null;
  }
  getEventType(e) {
    return L.EVENT_TYPES[e] || null;
  }
  getIntelligenceCost(e) {
    const t = this.getPriceKnowledge();
    return N.getIntelligenceCost(e, t);
  }
  purchaseIntelligence(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: purchaseIntelligence called before game initialization'
      );
    const t = N.purchaseIntelligence(this.state, e, this.starData);
    return (
      t.success &&
        (this.emit('creditsChanged', this.state.player.credits),
        this.emit('priceKnowledgeChanged', this.state.world.priceKnowledge),
        this.saveGame()),
      t
    );
  }
  generateRumor() {
    if (!this.state)
      throw new Error(
        'Invalid state: generateRumor called before game initialization'
      );
    return N.generateRumor(this.state, this.starData);
  }
  listAvailableIntelligence() {
    const e = this.getPriceKnowledge(),
      t = this.state.player.currentSystem,
      i = this.getActiveEvents(),
      r = this.state.ship.upgrades.includes('advanced_sensors');
    return N.listAvailableIntelligence(
      e,
      this.starData,
      t,
      this.navigationSystem,
      i,
      r
    );
  }
  buyGood(e, t, i) {
    if (!this.state)
      throw new Error(
        'Invalid state: buyGood called before game initialization'
      );
    const r = this.state.player.credits,
      n = this.getCargoRemaining(),
      a = t * i;
    if (a > r) return { success: !1, reason: 'Insufficient credits' };
    if (t > n) return { success: !1, reason: 'Not enough cargo space' };
    this.updateCredits(r - a);
    const o = this.state.player.currentSystem,
      c = this.getCurrentSystem().name,
      u = this.state.player.daysElapsed,
      f = g.recordCargoPurchase(this.state.ship.cargo, e, t, i, o, c, u);
    return (
      this.updateCargo(f),
      this.updateMarketConditions(o, e, -t),
      this.saveGame(),
      { success: !0 }
    );
  }
  sellGood(e, t, i) {
    if (!this.state)
      throw new Error(
        'Invalid state: sellGood called before game initialization'
      );
    const r = this.state.ship.cargo;
    if (e < 0 || e >= r.length)
      return { success: !1, reason: 'Invalid cargo stack' };
    const n = r[e];
    if (t <= 0) return { success: !1, reason: 'Quantity must be positive' };
    if (t > n.qty)
      return { success: !1, reason: 'Not enough quantity in stack' };
    const a = t * i,
      o = i - n.buyPrice;
    (this.updateCredits(this.state.player.credits + a),
      (n.qty -= t),
      n.qty <= 0 && r.splice(e, 1),
      this.updateCargo(r));
    const l = this.state.player.currentSystem;
    return (
      this.updateMarketConditions(l, n.good, t),
      this.saveGame(),
      { success: !0, profitMargin: o }
    );
  }
  getFuelPrice(e) {
    if (T.CORE_SYSTEMS.IDS.includes(e)) return T.CORE_SYSTEMS.PRICE_PER_PERCENT;
    const t = this.starData.find((r) => r.id === e);
    if (!t) return T.INNER_SYSTEMS.PRICE_PER_PERCENT;
    const i = q(t);
    return i < T.INNER_SYSTEMS.DISTANCE_THRESHOLD
      ? T.INNER_SYSTEMS.PRICE_PER_PERCENT
      : i < T.MID_RANGE_SYSTEMS.DISTANCE_THRESHOLD
        ? T.MID_RANGE_SYSTEMS.PRICE_PER_PERCENT
        : T.OUTER_SYSTEMS.PRICE_PER_PERCENT;
  }
  validateRefuel(e, t, i, r) {
    const n = t * r,
      a = this.getFuelCapacity();
    return t <= 0
      ? { valid: !1, reason: 'Refuel amount must be positive', cost: n }
      : e + t > a + P.FUEL_CAPACITY_EPSILON
        ? { valid: !1, reason: `Cannot refuel beyond ${a}% capacity`, cost: n }
        : n > i
          ? { valid: !1, reason: 'Insufficient credits for refuel', cost: n }
          : { valid: !0, reason: null, cost: n };
  }
  refuel(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: refuel called before game initialization'
      );
    const t = this.state.ship.fuel,
      i = this.state.player.credits,
      r = this.state.player.currentSystem,
      n = this.getFuelPrice(r),
      a = this.validateRefuel(t, e, i, n);
    return a.valid
      ? (this.updateCredits(i - a.cost),
        this.updateFuel(t + e),
        this.saveGame(),
        { success: !0, reason: null })
      : { success: !1, reason: a.reason };
  }
  getRepairCost(e, t, i) {
    return i >= d.CONDITION_BOUNDS.MAX ? 0 : t * pe.COST_PER_PERCENT;
  }
  repairShipSystem(e, t) {
    if (!this.state)
      throw new Error(
        'Invalid state: repairShipSystem called before game initialization'
      );
    if (!['hull', 'engine', 'lifeSupport'].includes(e))
      return { success: !1, reason: 'Invalid system type' };
    const r = this.state.ship[e],
      n = this.state.player.credits,
      a = this.getRepairCost(e, t, r);
    if (t <= 0)
      return { success: !1, reason: 'Repair amount must be positive' };
    if (r >= d.CONDITION_BOUNDS.MAX)
      return { success: !1, reason: 'System already at maximum condition' };
    if (a > n)
      return { success: !1, reason: 'Insufficient credits for repair' };
    if (r + t > d.CONDITION_BOUNDS.MAX)
      return { success: !1, reason: 'Repair would exceed maximum condition' };
    this.updateCredits(n - a);
    const o = {
      hull: this.state.ship.hull,
      engine: this.state.ship.engine,
      lifeSupport: this.state.ship.lifeSupport,
    };
    return (
      (o[e] = r + t),
      this.updateShipCondition(o.hull, o.engine, o.lifeSupport),
      this.saveGame(),
      { success: !0, reason: null }
    );
  }
  validateUpgradePurchase(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: validateUpgradePurchase called before game initialization'
      );
    const t = d.UPGRADES[e];
    return t
      ? this.state.ship.upgrades.includes(e)
        ? { valid: !1, reason: 'Upgrade already installed' }
        : this.state.player.credits < t.cost
          ? { valid: !1, reason: `Insufficient credits (need ₡${t.cost})` }
          : { valid: !0, reason: '' }
      : { valid: !1, reason: 'Unknown upgrade' };
  }
  purchaseUpgrade(e) {
    if (!this.state)
      throw new Error(
        'Invalid state: purchaseUpgrade called before game initialization'
      );
    const t = this.validateUpgradePurchase(e);
    if (!t.valid) return { success: !1, reason: t.reason };
    const i = d.UPGRADES[e];
    (this.updateCredits(this.state.player.credits - i.cost),
      this.state.ship.upgrades.push(e));
    const r = this.calculateShipCapabilities();
    return (
      (this.state.ship.cargoCapacity = r.cargoCapacity),
      (this.state.ship.hiddenCargoCapacity = r.hiddenCargoCapacity),
      this.saveGame(),
      { success: !0, reason: '' }
    );
  }
  calculateShipCapabilities() {
    if (!this.state)
      throw new Error(
        'Invalid state: calculateShipCapabilities called before game initialization'
      );
    const e = {
      fuelCapacity: d.CONDITION_BOUNDS.MAX,
      cargoCapacity: x.STARTING_CARGO_CAPACITY,
      fuelConsumption: 1,
      hullDegradation: 1,
      lifeSupportDrain: 1,
      hiddenCargoCapacity: 0,
      eventVisibility: 0,
    };
    for (const t of this.state.ship.upgrades) {
      const i = d.UPGRADES[t];
      if (!i)
        throw new Error(`Invalid upgrade ID: ${t} not found in SHIP_UPGRADES`);
      for (const [r, n] of Object.entries(i.effects))
        r.endsWith('Capacity') ? (e[r] = n) : (e[r] *= n);
    }
    return e;
  }
  _addToCargoArray(e, t, i) {
    const r = e.findIndex(
      (n) => n.good === t.good && n.buyPrice === t.buyPrice
    );
    r >= 0
      ? (e[r].qty += i)
      : e.push({
          good: t.good,
          qty: i,
          buyPrice: t.buyPrice,
          buySystem: t.buySystem,
          buySystemName: t.buySystemName,
          buyDate: t.buyDate,
        });
  }
  moveToHiddenCargo(e, t) {
    if (!this.state)
      throw new Error(
        'Invalid state: moveToHiddenCargo called before game initialization'
      );
    const i = this.state.ship;
    if (!i.upgrades.includes('smuggler_panels'))
      return { success: !1, reason: 'No hidden cargo compartment' };
    const r = i.cargo.findIndex((l) => l.good === e);
    if (r === -1) return { success: !1, reason: 'Cargo not found' };
    const n = i.cargo[r];
    if (n.qty < t) return { success: !1, reason: 'Insufficient quantity' };
    const a = i.hiddenCargo.reduce((l, c) => l + c.qty, 0),
      o = i.hiddenCargoCapacity - a;
    return t > o
      ? { success: !1, reason: `Hidden cargo full (${o} units available)` }
      : ((n.qty -= t),
        n.qty === 0 && i.cargo.splice(r, 1),
        this._addToCargoArray(i.hiddenCargo, n, t),
        this.updateCargo(i.cargo),
        this.saveGame(),
        { success: !0, reason: '' });
  }
  moveToRegularCargo(e, t) {
    if (!this.state)
      throw new Error(
        'Invalid state: moveToRegularCargo called before game initialization'
      );
    const i = this.state.ship,
      r = i.hiddenCargo.findIndex((l) => l.good === e);
    if (r === -1)
      return { success: !1, reason: 'Cargo not found in hidden compartment' };
    const n = i.hiddenCargo[r];
    if (n.qty < t) return { success: !1, reason: 'Insufficient quantity' };
    const a = i.cargo.reduce((l, c) => l + c.qty, 0),
      o = i.cargoCapacity - a;
    return t > o
      ? { success: !1, reason: `Cargo hold full (${o} units available)` }
      : ((n.qty -= t),
        n.qty === 0 && i.hiddenCargo.splice(r, 1),
        this._addToCargoArray(i.cargo, n, t),
        this.updateCargo(i.cargo),
        this.saveGame(),
        { success: !0, reason: '' });
  }
  dock() {
    if (!this.state)
      throw new Error('Invalid state: dock called before game initialization');
    const e = this.state.player.currentSystem,
      t = this.starData.find((o) => o.id === e);
    if (!t)
      throw new Error(
        `Invalid game state: current system ID ${e} not found in star data`
      );
    const i = this.state.player.daysElapsed,
      r = this.state.world.activeEvents;
    if (!r)
      throw new Error('Invalid state: activeEvents missing from world state');
    const n = this.state.world.marketConditions;
    if (!n)
      throw new Error(
        'Invalid state: marketConditions missing from world state'
      );
    const a = {};
    for (const o of C) a[o] = g.calculatePrice(o, t, i, r, n);
    return (
      this.updatePriceKnowledge(e, a, 0),
      this.saveGame(),
      { success: !0 }
    );
  }
  undock() {
    if (!this.state)
      throw new Error(
        'Invalid state: undock called before game initialization'
      );
    return (this.saveGame(), { success: !0 });
  }
  saveGame() {
    const e = me(this.state, this.lastSaveTime, this.isTestEnvironment);
    return (e.success && (this.lastSaveTime = e.newLastSaveTime), e.success);
  }
  loadGame() {
    var e, t, i;
    try {
      let r = W(this.isTestEnvironment);
      return r
        ? Ee((e = r.meta) == null ? void 0 : e.version)
          ? (((t = r.meta) == null ? void 0 : t.version) === '1.0.0' &&
              A === '2.1.0' &&
              (r = Ie(r, this.starData, this.isTestEnvironment)),
            ((i = r.meta) == null ? void 0 : i.version) === '2.0.0' &&
              A === '2.1.0' &&
              (r = Ce(r, this.isTestEnvironment)),
            we(r)
              ? ((r = Se(r, this.starData)),
                (this.state = r),
                this.emit('creditsChanged', this.state.player.credits),
                this.emit('debtChanged', this.state.player.debt),
                this.emit('fuelChanged', this.state.ship.fuel),
                this.emit('cargoChanged', this.state.ship.cargo),
                this.emit('locationChanged', this.state.player.currentSystem),
                this.emit('timeChanged', this.state.player.daysElapsed),
                this.emit(
                  'priceKnowledgeChanged',
                  this.state.world.priceKnowledge
                ),
                this.emit('activeEventsChanged', this.state.world.activeEvents),
                this.emit('shipConditionChanged', {
                  hull: this.state.ship.hull,
                  engine: this.state.ship.engine,
                  lifeSupport: this.state.ship.lifeSupport,
                }),
                this.state)
              : (this.isTestEnvironment ||
                  console.log('Save data corrupted, starting new game'),
                null))
          : (this.isTestEnvironment ||
              console.log('Save version incompatible, starting new game'),
            null)
        : null;
    } catch (r) {
      return (
        this.isTestEnvironment || console.log('Failed to load game:', r),
        null
      );
    }
  }
  hasSavedGame() {
    return ye();
  }
  clearSave() {
    return ge(this.isTestEnvironment);
  }
}
const F = [
    { id: 0, x: 0, y: 0, z: 0, name: 'Sol', type: 'G2', wh: 8, st: 6, r: 1 },
    {
      id: 1,
      x: -23.1,
      y: -19.18,
      z: -53.76,
      name: 'Alpha Centauri A',
      type: 'G2',
      wh: 6,
      st: 9,
      r: 1,
    },
    {
      id: 2,
      x: -23.1,
      y: -19.18,
      z: -53.76,
      name: 'Alpha Centauri B',
      type: 'K0',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 3,
      x: -21.56,
      y: -16.38,
      z: -52.5,
      name: 'Proxima Centauri C',
      type: 'M5.5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 4,
      x: -0.98,
      y: -82.88,
      z: 6.86,
      name: "Barnard's Star",
      type: 'M5',
      wh: 3,
      st: 1,
      r: 1,
    },
    {
      id: 5,
      x: -104.16,
      y: 29.82,
      z: 13.3,
      name: 'Wolf 359',
      type: 'M6',
      wh: 4,
      st: 6,
      r: 1,
    },
    {
      id: 6,
      x: -91.28,
      y: 23.1,
      z: 68.32,
      name: 'Lalande 21185',
      type: 'M2',
      wh: 1,
      st: 8,
      r: 1,
    },
    {
      id: 7,
      x: -22.54,
      y: 113.12,
      z: -34.58,
      name: 'Sirius A',
      type: 'A1',
      wh: 4,
      st: 3,
      r: 1,
    },
    {
      id: 8,
      x: -22.54,
      y: 113.12,
      z: -34.58,
      name: 'Sirius B',
      type: 'DA2',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 9,
      x: 105.56,
      y: 48.72,
      z: -37.66,
      name: 'L 726-8 A',
      type: 'M5.5',
      wh: 5,
      st: 2,
      r: 1,
    },
    {
      id: 10,
      x: 105.56,
      y: 48.72,
      z: -37.66,
      name: 'L 726-8 B',
      type: 'M5.5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 11,
      x: 26.46,
      y: -121.24,
      z: -54.88,
      name: 'Ross 154',
      type: 'M4.5',
      wh: 4,
      st: 4,
      r: 1,
    },
    {
      id: 12,
      x: 103.32,
      y: -8.54,
      z: 100.8,
      name: 'Ross 248',
      type: 'M6',
      wh: 1,
      st: 2,
      r: 1,
    },
    {
      id: 13,
      x: 87.22,
      y: 115.92,
      z: -24.22,
      name: 'Epsilon Eridani',
      type: 'K2',
      wh: 4,
      st: 5,
      r: 1,
    },
    {
      id: 14,
      x: 118.3,
      y: -28.84,
      z: -87.92,
      name: 'Lacaille 9352',
      type: 'M2',
      wh: 2,
      st: 5,
      r: 1,
    },
    {
      id: 15,
      x: -152.18,
      y: 8.54,
      z: 2.1,
      name: 'Ross 128',
      type: 'M4.5',
      wh: 3,
      st: 9,
      r: 1,
    },
    {
      id: 16,
      x: 140.14,
      y: -52.36,
      z: -40.88,
      name: 'L 789-6 A',
      type: 'M5.5',
      wh: 2,
      st: 4,
      r: 1,
    },
    {
      id: 17,
      x: 140.14,
      y: -52.36,
      z: -40.88,
      name: 'L 789-6 B',
      type: 'M5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 18,
      x: 140.14,
      y: -52.36,
      z: -40.88,
      name: 'L 789-6 C',
      type: 'M7',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 19,
      x: -66.64,
      y: 144.48,
      z: 14.56,
      name: 'Procyon A',
      type: 'F5',
      wh: 1,
      st: 7,
      r: 1,
    },
    {
      id: 20,
      x: -66.64,
      y: 144.48,
      z: 14.56,
      name: 'Procyon B',
      type: 'DA',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 21,
      x: 90.44,
      y: -85.68,
      z: 99.96,
      name: '61 Cygni A',
      type: 'K5',
      wh: 2,
      st: 5,
      r: 0,
    },
    {
      id: 22,
      x: 90.44,
      y: -85.68,
      z: 99.96,
      name: '61 Cygni B',
      type: 'K7',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 23,
      x: 14.98,
      y: -80.78,
      z: 140.14,
      name: 'Struve 2398 A',
      type: 'M4',
      wh: 3,
      st: 3,
      r: 1,
    },
    {
      id: 24,
      x: 14.98,
      y: -80.78,
      z: 140.14,
      name: 'Struve 2398 B',
      type: 'M5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 25,
      x: 116.76,
      y: 9.24,
      z: 113.26,
      name: 'Groombridge 34 A',
      type: 'M2',
      wh: 3,
      st: 5,
      r: 0,
    },
    {
      id: 26,
      x: 116.76,
      y: 9.24,
      z: 113.26,
      name: 'Groombridge 34 B',
      type: 'M6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 27,
      x: -89.6,
      y: 117.6,
      z: 74.62,
      name: 'G51-15',
      type: 'M6.5',
      wh: 3,
      st: 8,
      r: 1,
    },
    {
      id: 28,
      x: 79.24,
      y: -44.24,
      z: -138.6,
      name: 'Epsilon Indi A',
      type: 'K4',
      wh: 3,
      st: 1,
      r: 0,
    },
    {
      id: 29,
      x: 79.38,
      y: -43.96,
      z: -138.6,
      name: 'Epsilon Indi B',
      type: 'T1',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 30,
      x: 79.38,
      y: -43.96,
      z: -138.6,
      name: 'Epsilon Indi C',
      type: 'T6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 31,
      x: 143.92,
      y: 70.28,
      z: -45.78,
      name: 'Tau Ceti',
      type: 'G8',
      wh: 3,
      st: 2,
      r: 1,
    },
    {
      id: 32,
      x: 70.7,
      y: 97.44,
      z: -118.44,
      name: 'L 372-58',
      type: 'M5.5',
      wh: 3,
      st: 1,
      r: 1,
    },
    {
      id: 33,
      x: 154.28,
      y: 50.26,
      z: -49.56,
      name: 'L 725-32',
      type: 'M5',
      wh: 1,
      st: 4,
      r: 1,
    },
    {
      id: 34,
      x: -64.12,
      y: 160.44,
      z: 15.82,
      name: "Luyten's Star",
      type: 'M3.5',
      wh: 2,
      st: 5,
      r: 1,
    },
    {
      id: 35,
      x: 122.78,
      y: 115.5,
      z: 51.24,
      name: 'SO 0253+1652',
      type: 'M6.5',
      wh: 3,
      st: 3,
      r: 1,
    },
    {
      id: 36,
      x: 26.74,
      y: 123.62,
      z: -126.56,
      name: "Kapteyn's Star",
      type: 'M1',
      wh: 2,
      st: 2,
      r: 1,
    },
    {
      id: 37,
      x: 15.4,
      y: -77.42,
      z: -161.56,
      name: 'SCR 1845-6357 A',
      type: 'M8.5',
      wh: 3,
      st: 1,
      r: 0,
    },
    {
      id: 38,
      x: 15.4,
      y: -77.42,
      z: -161.56,
      name: 'SCR 1845-6357 B',
      type: 'T5.5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 39,
      x: 106.26,
      y: -91.56,
      z: -113.12,
      name: 'Lacaille 8760',
      type: 'M0',
      wh: 1,
      st: 4,
      r: 1,
    },
    {
      id: 40,
      x: 90.02,
      y: -38.22,
      z: 154.7,
      name: 'Kruger 60 A',
      type: 'M3',
      wh: 2,
      st: 9,
      r: 0,
    },
    {
      id: 41,
      x: 90.02,
      y: -38.22,
      z: 154.7,
      name: 'Kruger 60 B',
      type: 'M6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 42,
      x: -134.4,
      y: 43.68,
      z: -118.3,
      name: 'DENIS 1048-39',
      type: 'M9',
      wh: 1,
      st: 13,
      r: 1,
    },
    {
      id: 43,
      x: -23.8,
      y: 186.34,
      z: -9.24,
      name: 'Ross 614 A',
      type: 'M4.5',
      wh: 0,
      st: 9,
      r: 0,
    },
    {
      id: 44,
      x: -23.8,
      y: 186.34,
      z: -9.24,
      name: 'Ross 614 B',
      type: 'M7',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 45,
      x: -72.66,
      y: -175.56,
      z: -42.7,
      name: 'Wolf 1061',
      type: 'M3.5',
      wh: 1,
      st: 5,
      r: 1,
    },
    {
      id: 46,
      x: -192.22,
      y: -27.86,
      z: 30.8,
      name: 'Wolf 424 A',
      type: 'M5.5',
      wh: 3,
      st: 9,
      r: 1,
    },
    {
      id: 47,
      x: -192.22,
      y: -27.86,
      z: 30.8,
      name: 'Wolf 424 B',
      type: 'M7',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 48,
      x: 158.2,
      y: 3.5,
      z: -120.82,
      name: 'CD-37 15492',
      type: 'M4',
      wh: 1,
      st: 4,
      r: 1,
    },
    {
      id: 49,
      x: 195.72,
      y: 42.56,
      z: 18.9,
      name: "van Maanen's Star",
      type: 'DZ7',
      wh: 1,
      st: 4,
      r: 1,
    },
    {
      id: 50,
      x: 172.06,
      y: 99.4,
      z: 46.06,
      name: 'L 1159-16',
      type: 'M8',
      wh: 1,
      st: 8,
      r: 1,
    },
    {
      id: 51,
      x: -93.1,
      y: 32.06,
      z: -179.06,
      name: 'L 143-23',
      type: 'M5.5',
      wh: 2,
      st: 10,
      r: 1,
    },
    {
      id: 52,
      x: -192.64,
      y: 62.58,
      z: -40.6,
      name: 'LP 731-58',
      type: 'M6.5',
      wh: 2,
      st: 14,
      r: 1,
    },
    {
      id: 53,
      x: -7.98,
      y: -75.88,
      z: 192.22,
      name: 'BD+68 946',
      type: 'M3.5',
      wh: 2,
      st: 8,
      r: 1,
    },
    {
      id: 54,
      x: -19.6,
      y: -140.14,
      z: -151.34,
      name: 'CD-46 11540',
      type: 'M3',
      wh: 1,
      st: 6,
      r: 0,
    },
    {
      id: 55,
      x: -89.6,
      y: 5.88,
      z: -190.96,
      name: 'L 145-141',
      type: 'DQ6',
      wh: 2,
      st: 10,
      r: 1,
    },
    {
      id: 56,
      x: 212.66,
      y: 5.74,
      z: -28.14,
      name: 'G158-27',
      type: 'M5.5',
      wh: 2,
      st: 6,
      r: 1,
    },
    {
      id: 57,
      x: 199.36,
      y: -59.92,
      z: -52.92,
      name: 'Ross 780',
      type: 'M5',
      wh: 2,
      st: 6,
      r: 1,
    },
    {
      id: 58,
      x: 72.94,
      y: -135.52,
      z: 150.78,
      name: 'G208-44 A',
      type: 'M5.5',
      wh: 1,
      st: 7,
      r: 0,
    },
    {
      id: 59,
      x: 72.94,
      y: -135.52,
      z: 150.78,
      name: 'G208-44 B',
      type: 'M6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 60,
      x: 72.94,
      y: -135.52,
      z: 150.78,
      name: 'G208-44 C',
      type: 'M8',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 61,
      x: -155.4,
      y: 37.94,
      z: 152.04,
      name: 'Lalande 21258 A',
      type: 'M2',
      wh: 2,
      st: 9,
      r: 0,
    },
    {
      id: 62,
      x: -155.4,
      y: 37.94,
      z: 151.9,
      name: 'Lalande 21258 B',
      type: 'M6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 63,
      x: -128.66,
      y: 66.22,
      z: 168.98,
      name: 'Groombridge 1618',
      type: 'K7',
      wh: 2,
      st: 9,
      r: 1,
    },
    {
      id: 64,
      x: 110.32,
      y: 105.56,
      z: -163.8,
      name: 'DENIS 0255-47',
      type: 'L8',
      wh: 1,
      st: 3,
      r: 1,
    },
    {
      id: 65,
      x: -190.54,
      y: 89.74,
      z: 76.16,
      name: 'BD+20 2465',
      type: 'M4.5',
      wh: 2,
      st: 10,
      r: 1,
    },
    {
      id: 66,
      x: 118.44,
      y: -88.34,
      z: -170.1,
      name: 'L 354-89',
      type: 'M1',
      wh: 1,
      st: 7,
      r: 0,
    },
    {
      id: 67,
      x: 106.54,
      y: 150.92,
      z: -131.46,
      name: 'LP 944-20',
      type: 'M9',
      wh: 1,
      st: 4,
      r: 1,
    },
    {
      id: 68,
      x: -16.52,
      y: -163.94,
      z: -160.86,
      name: 'CD-44 11909',
      type: 'M3.5',
      wh: 2,
      st: 6,
      r: 0,
    },
    {
      id: 69,
      x: 100.94,
      y: 204.68,
      z: -30.66,
      name: 'Omicron² Eridani A',
      type: 'K1',
      wh: 1,
      st: 10,
      r: 0,
    },
    {
      id: 70,
      x: 100.94,
      y: 204.68,
      z: -30.66,
      name: 'Omicron² Eridani B',
      type: 'DA4',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 71,
      x: 100.94,
      y: 204.68,
      z: -30.66,
      name: 'Omicron² Eridani C',
      type: 'M4.5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 72,
      x: 156.38,
      y: -52.22,
      z: 161.14,
      name: 'BD+43 4305',
      type: 'M4.5',
      wh: 1,
      st: 2,
      r: 0,
    },
    {
      id: 73,
      x: 5.18,
      y: -231.98,
      z: 10.08,
      name: '70 Ophiuchi A',
      type: 'K0',
      wh: 2,
      st: 8,
      r: 1,
    },
    {
      id: 74,
      x: 5.18,
      y: -231.98,
      z: 10.08,
      name: '70 Ophiuchi B',
      type: 'K5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 75,
      x: 107.24,
      y: -205.66,
      z: 36.12,
      name: 'Altair',
      type: 'A7',
      wh: 1,
      st: 9,
      r: 1,
    },
    {
      id: 76,
      x: -157.5,
      y: 160.16,
      z: 80.78,
      name: 'G9-38 A',
      type: 'M5.5',
      wh: 1,
      st: 7,
      r: 1,
    },
    {
      id: 77,
      x: -157.5,
      y: 160.16,
      z: 80.78,
      name: 'G9-38 B',
      type: 'M5.5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 78,
      x: 232.12,
      y: 15.26,
      z: -67.34,
      name: 'L 722-22 A',
      type: 'M4',
      wh: 1,
      st: 8,
      r: 1,
    },
    {
      id: 79,
      x: 232.12,
      y: 15.26,
      z: -67.34,
      name: 'L 722-22 B',
      type: 'M6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 80,
      x: 0,
      y: 244.86,
      z: 11.48,
      name: 'G99-49',
      type: 'M4',
      wh: 1,
      st: 3,
      r: 0,
    },
    {
      id: 81,
      x: -48.3,
      y: 2.66,
      z: 241.5,
      name: 'G254-29',
      type: 'M4',
      wh: 1,
      st: 6,
      r: 0,
    },
    {
      id: 82,
      x: -214.9,
      y: -106.12,
      z: 63.7,
      name: 'Lalande 25372',
      type: 'M4',
      wh: 1,
      st: 10,
      r: 1,
    },
    {
      id: 83,
      x: 62.16,
      y: 240.1,
      z: -30.24,
      name: 'LP 656-38',
      type: 'M3.5',
      wh: 1,
      st: 4,
      r: 0,
    },
    {
      id: 84,
      x: 163.66,
      y: -175.28,
      z: -73.22,
      name: 'LP 816-60',
      type: 'M5',
      wh: 1,
      st: 6,
      r: 0,
    },
    {
      id: 85,
      x: 49.14,
      y: 120.12,
      z: 215.74,
      name: 'Stein 2051 A',
      type: 'M4',
      wh: 1,
      st: 8,
      r: 0,
    },
    {
      id: 86,
      x: 49.14,
      y: 120.12,
      z: 215.74,
      name: 'Stein 2051 B',
      type: 'DC5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 87,
      x: -49.28,
      y: 204.68,
      z: 138.18,
      name: 'Wolf 294',
      type: 'M4',
      wh: 1,
      st: 7,
      r: 0,
    },
    {
      id: 88,
      x: 33.04,
      y: -214.48,
      z: 140.84,
      name: '2MASS 1835+32',
      type: 'M8.5',
      wh: 1,
      st: 11,
      r: 0,
    },
    {
      id: 89,
      x: 32.62,
      y: 257.18,
      z: -16.66,
      name: 'Wolf 1453',
      type: 'M1.5',
      wh: 1,
      st: 7,
      r: 0,
    },
    {
      id: 90,
      x: 114.24,
      y: 231.7,
      z: -43.54,
      name: '2MASS 0415-09',
      type: 'T8.5',
      wh: 1,
      st: 10,
      r: 0,
    },
    {
      id: 91,
      x: 35.84,
      y: -84.28,
      z: 246.96,
      name: 'Sigma Draconis',
      type: 'K0',
      wh: 1,
      st: 11,
      r: 1,
    },
    {
      id: 92,
      x: -10.78,
      y: 244.44,
      z: -98.14,
      name: 'L 668-21 A',
      type: 'M1',
      wh: 1,
      st: 8,
      r: 1,
    },
    {
      id: 93,
      x: -10.78,
      y: 244.44,
      z: -98.14,
      name: 'L 668-21 B',
      type: 'T6',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 94,
      x: 20.16,
      y: 257.32,
      z: 57.12,
      name: 'Ross 47',
      type: 'M4',
      wh: 1,
      st: 11,
      r: 0,
    },
    {
      id: 95,
      x: -8.68,
      y: -142.94,
      z: -223.3,
      name: 'L 205-128',
      type: 'M3.5',
      wh: 0,
      st: 4,
      r: 0,
    },
    {
      id: 96,
      x: 87.08,
      y: -252.56,
      z: 24.22,
      name: 'Wolf 1055 A',
      type: 'M3.5',
      wh: 0,
      st: 5,
      r: 0,
    },
    {
      id: 97,
      x: 88.06,
      y: -252.28,
      z: 24.08,
      name: 'Wolf 1055 B',
      type: 'M8',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 98,
      x: -136.22,
      y: 209.58,
      z: -98.7,
      name: 'L 674-15',
      type: 'M4',
      wh: 1,
      st: 8,
      r: 0,
    },
    {
      id: 99,
      x: -179.76,
      y: -175.28,
      z: -98.42,
      name: 'Lalande 27173 A',
      type: 'K5',
      wh: 1,
      st: 7,
      r: 0,
    },
    {
      id: 100,
      x: -179.76,
      y: -175.28,
      z: -98.42,
      name: 'Lalande 27173 B',
      type: 'M1',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 101,
      x: -179.76,
      y: -175.28,
      z: -98.42,
      name: 'Lalande 27173 C',
      type: 'M3',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 102,
      x: -179.9,
      y: -175.28,
      z: -98.28,
      name: 'Lalande 27173 D',
      type: 'T8',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 103,
      x: 64.82,
      y: -177.8,
      z: -192.92,
      name: 'L 347-14',
      type: 'M4.5',
      wh: 1,
      st: 9,
      r: 0,
    },
    {
      id: 104,
      x: -118.72,
      y: 242.9,
      z: 16.8,
      name: 'Ross 882',
      type: 'M4.5',
      wh: 0,
      st: 9,
      r: 0,
    },
    {
      id: 105,
      x: -122.5,
      y: -162.54,
      z: -178.78,
      name: 'CD-40 9712',
      type: 'M3',
      wh: 1,
      st: 10,
      r: 1,
    },
    {
      id: 106,
      x: 141.54,
      y: 30.8,
      z: 230.16,
      name: 'Eta Cassiopeiae A',
      type: 'G0',
      wh: 0,
      st: 7,
      r: 0,
    },
    {
      id: 107,
      x: 141.54,
      y: 30.8,
      z: 230.16,
      name: 'Eta Cassiopeiae B',
      type: 'K7',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 108,
      x: 272.02,
      y: -13.02,
      z: 11.48,
      name: 'Lalande 46650',
      type: 'M2',
      wh: 0,
      st: 9,
      r: 0,
    },
    {
      id: 109,
      x: -47.6,
      y: -239.68,
      z: -122.36,
      name: '36 Ophiuchi A',
      type: 'K1',
      wh: 1,
      st: 7,
      r: 0,
    },
    {
      id: 110,
      x: -47.6,
      y: -239.68,
      z: -122.36,
      name: '36 Ophiuchi B',
      type: 'K1',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 111,
      x: -46.48,
      y: -239.4,
      z: -121.8,
      name: '36 Ophiuchi C',
      type: 'K5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 112,
      x: 120.82,
      y: -187.74,
      z: -162.82,
      name: 'CD-36 13940 A',
      type: 'K3',
      wh: 0,
      st: 9,
      r: 0,
    },
    {
      id: 113,
      x: 120.82,
      y: -187.74,
      z: -162.82,
      name: 'CD-36 13940 B',
      type: 'M3.5',
      wh: 0,
      st: 0,
      r: 0,
    },
    {
      id: 114,
      x: 130.48,
      y: 154.42,
      z: -189,
      name: '82 Eridani',
      type: 'G5',
      wh: 0,
      st: 6,
      r: 0,
    },
    {
      id: 115,
      x: 59.78,
      y: -95.48,
      z: -255.08,
      name: 'Delta Pavonis',
      type: 'G5',
      wh: 0,
      st: 8,
      r: 0,
    },
    {
      id: 116,
      x: -213.36,
      y: -169.82,
      z: -60.48,
      name: 'Wolf 1481',
      type: 'M3',
      wh: 0,
      st: 9,
      r: 0,
    },
  ],
  H = [
    [0, 1],
    [0, 4],
    [0, 7],
    [0, 9],
    [0, 11],
    [0, 12],
    [0, 16],
    [0, 19],
    [1, 13],
    [4, 23],
    [4, 73],
    [5, 6],
    [5, 7],
    [5, 27],
    [5, 65],
    [7, 34],
    [7, 36],
    [9, 13],
    [9, 14],
    [9, 31],
    [9, 33],
    [11, 1],
    [11, 39],
    [11, 45],
    [13, 35],
    [14, 48],
    [15, 1],
    [15, 42],
    [15, 46],
    [16, 57],
    [21, 25],
    [21, 58],
    [23, 53],
    [23, 91],
    [25, 40],
    [25, 72],
    [27, 34],
    [27, 65],
    [28, 37],
    [28, 54],
    [28, 66],
    [31, 13],
    [31, 56],
    [32, 36],
    [32, 64],
    [32, 67],
    [35, 92],
    [37, 68],
    [37, 103],
    [40, 81],
    [46, 52],
    [46, 82],
    [49, 56],
    [50, 35],
    [51, 1],
    [51, 55],
    [52, 76],
    [53, 63],
    [55, 105],
    [57, 78],
    [61, 85],
    [61, 87],
    [63, 1],
    [68, 109],
    [69, 90],
    [73, 75],
    [80, 89],
    [83, 94],
    [84, 88],
    [98, 99],
  ];
class G {
  constructor(e, t) {
    ((this.starData = e), (this.wormholeData = t));
  }
  calculateDistanceFromSol(e) {
    return Math.hypot(e.x, e.y, e.z) * P.LY_PER_UNIT;
  }
  calculateDistanceBetween(e, t) {
    return Math.hypot(e.x - t.x, e.y - t.y, e.z - t.z) * P.LY_PER_UNIT;
  }
  calculateJumpTime(e) {
    return Math.max(1, Math.ceil(e * 0.5));
  }
  calculateFuelCost(e) {
    return 10 + e * 2;
  }
  calculateFuelCostWithCondition(e, t, i = null, r = [], n = 1) {
    let a = this.calculateFuelCost(e);
    return (
      t < d.ENGINE_CONDITION_PENALTIES.THRESHOLD &&
        (a *= d.ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER),
      i && r.length > 0 && (a = i(a, 'fuelConsumption', r)),
      (a *= n),
      a
    );
  }
  calculateJumpTimeWithCondition(e, t) {
    const i = this.calculateJumpTime(e);
    return t < d.ENGINE_CONDITION_PENALTIES.THRESHOLD
      ? i + d.ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS
      : i;
  }
  static applyJumpDegradation(e, t, i = null, r = [], n = 1, a = 1) {
    let o = d.DEGRADATION.HULL_PER_JUMP;
    const l = d.DEGRADATION.ENGINE_PER_JUMP;
    let c = d.DEGRADATION.LIFE_SUPPORT_PER_DAY * t;
    return (
      i &&
        r.length > 0 &&
        ((o = i(o, 'hullDegradation', r)), (c = i(c, 'lifeSupportDrain', r))),
      (o *= n),
      (c *= a),
      (e.hull = Math.max(
        d.CONDITION_BOUNDS.MIN,
        Math.min(d.CONDITION_BOUNDS.MAX, e.hull - o)
      )),
      (e.engine = Math.max(
        d.CONDITION_BOUNDS.MIN,
        Math.min(d.CONDITION_BOUNDS.MAX, e.engine - l)
      )),
      (e.lifeSupport = Math.max(
        d.CONDITION_BOUNDS.MIN,
        Math.min(d.CONDITION_BOUNDS.MAX, e.lifeSupport - c)
      )),
      e
    );
  }
  areSystemsConnected(e, t) {
    return this.wormholeData.some(
      (i) => (i[0] === e && i[1] === t) || (i[0] === t && i[1] === e)
    );
  }
  getConnectedSystems(e) {
    const t = [];
    for (const i of this.wormholeData)
      i[0] === e ? t.push(i[1]) : i[1] === e && t.push(i[0]);
    return t;
  }
  validateJump(e, t, i, r = 100, n = null, a = [], o = 1) {
    if (!this.areSystemsConnected(e, t))
      return {
        valid: !1,
        error: 'No wormhole connection to target system',
        fuelCost: 0,
        distance: 0,
        jumpTime: 0,
      };
    const l = this.starData.find((p) => p.id === e),
      c = this.starData.find((p) => p.id === t);
    if (!l || !c)
      return {
        valid: !1,
        error: 'Invalid system ID',
        fuelCost: 0,
        distance: 0,
        jumpTime: 0,
      };
    const u = this.calculateDistanceBetween(l, c),
      f = this.calculateFuelCostWithCondition(u, r, n, a, o),
      m = this.calculateJumpTimeWithCondition(u, r);
    return i < f
      ? {
          valid: !1,
          error: 'Insufficient fuel for jump',
          fuelCost: f,
          distance: u,
          jumpTime: m,
        }
      : { valid: !0, error: null, fuelCost: f, distance: u, jumpTime: m };
  }
  async executeJump(e, t, i = null, r = null) {
    const n = e.getState();
    if (!n) return { success: !1, error: 'No game state' };
    const a = n.player.currentSystem,
      o = n.ship.fuel,
      l = n.ship.engine,
      c = n.ship.quirks || [],
      u = e.calculateShipCapabilities(),
      f = this.validateJump(
        a,
        t,
        o,
        l,
        e.applyQuirkModifiers.bind(e),
        c,
        u.fuelConsumption
      );
    if (!f.valid) return { success: !1, error: f.error };
    (e.updateFuel(o - f.fuelCost),
      e.updateTime(n.player.daysElapsed + f.jumpTime),
      e.updateLocation(t));
    const m = G.applyJumpDegradation(
      n.ship,
      f.jumpTime,
      e.applyQuirkModifiers.bind(e),
      c,
      u.hullDegradation,
      u.lifeSupportDrain
    );
    (e.updateShipCondition(m.hull, m.engine, m.lifeSupport), e.saveGame());
    let p = !1,
      I = !1,
      w = !1,
      S = !1;
    if (
      (r &&
        i &&
        (r.isStationVisible &&
          r.isStationVisible() &&
          ((p = !0), r.hideStationInterface()),
        r.isTradeVisible &&
          r.isTradeVisible() &&
          ((I = !0), r.hideTradePanel()),
        r.isRefuelVisible &&
          r.isRefuelVisible() &&
          ((w = !0), r.hideRefuelPanel()),
        r.isInfoBrokerVisible &&
          r.isInfoBrokerVisible() &&
          ((S = !0), r.hideInfoBrokerPanel())),
      i)
    )
      try {
        await i.playJumpAnimation(a, t);
      } finally {
        r &&
          (p && r.showStationInterface(),
          I && r.showTradePanel(),
          w && r.showRefuelPanel(),
          S && r.showInfoBrokerPanel());
      }
    return { success: !0, error: null };
  }
}
function Te() {
  const s = new G(F, H),
    e = new Ne(F, H, s),
    t = W(!1);
  return (
    t
      ? ((e.state = t), console.log('Game loaded from save'))
      : (e.initNewGame(), console.log('New game initialized')),
    e
  );
}
function Ae(s) {
  (console.error('Failed to initialize game:', s),
    O.createRoot(document.getElementById('root')).render(
      h.jsxs('div', {
        style: {
          padding: '40px',
          fontFamily: 'sans-serif',
          maxWidth: '600px',
          margin: '0 auto',
        },
        children: [
          h.jsx('h1', { children: 'Failed to Load Game' }),
          h.jsx('p', {
            children:
              'The game failed to initialize. This could be due to corrupted save data or a browser compatibility issue.',
          }),
          h.jsx('p', {
            style: { color: '#c00', fontFamily: 'monospace', fontSize: '14px' },
            children: s.message,
          }),
          h.jsx('button', {
            onClick: () => {
              confirm(
                'This will delete your saved game and start fresh. Continue?'
              ) && (localStorage.clear(), window.location.reload());
            },
            style: {
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '10px',
            },
            children: 'Clear Save and Restart',
          }),
          h.jsx('button', {
            onClick: () => window.location.reload(),
            style: {
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
            },
            children: 'Retry',
          }),
        ],
      })
    ));
}
let J;
try {
  J = Te();
} catch (s) {
  throw (Ae(s), s);
}
O.createRoot(document.getElementById('root')).render(
  h.jsx(V.StrictMode, {
    children: h.jsx(ue, { gameStateManager: J, children: h.jsx(de, {}) }),
  })
);
//# sourceMappingURL=index-DqnAwc3H.js.map
