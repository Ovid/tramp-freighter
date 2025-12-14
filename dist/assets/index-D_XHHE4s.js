import { r as p, a as m, R as y } from './vendor-wGySg1uH.js';
(function () {
  const t = document.createElement('link').relList;
  if (t && t.supports && t.supports('modulepreload')) return;
  for (const e of document.querySelectorAll('link[rel="modulepreload"]')) o(e);
  new MutationObserver((e) => {
    for (const r of e)
      if (r.type === 'childList')
        for (const s of r.addedNodes)
          s.tagName === 'LINK' && s.rel === 'modulepreload' && o(s);
  }).observe(document, { childList: !0, subtree: !0 });
  function c(e) {
    const r = {};
    return (
      e.integrity && (r.integrity = e.integrity),
      e.referrerPolicy && (r.referrerPolicy = e.referrerPolicy),
      e.crossOrigin === 'use-credentials'
        ? (r.credentials = 'include')
        : e.crossOrigin === 'anonymous'
          ? (r.credentials = 'omit')
          : (r.credentials = 'same-origin'),
      r
    );
  }
  function o(e) {
    if (e.ep) return;
    e.ep = !0;
    const r = c(e);
    fetch(e.href, r);
  }
})();
var f = { exports: {} },
  l = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var h = p,
  x = Symbol.for('react.element'),
  _ = Symbol.for('react.fragment'),
  R = Object.prototype.hasOwnProperty,
  g = h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  v = { key: !0, ref: !0, __self: !0, __source: !0 };
function d(i, t, c) {
  var o,
    e = {},
    r = null,
    s = null;
  (c !== void 0 && (r = '' + c),
    t.key !== void 0 && (r = '' + t.key),
    t.ref !== void 0 && (s = t.ref));
  for (o in t) R.call(t, o) && !v.hasOwnProperty(o) && (e[o] = t[o]);
  if (i && i.defaultProps)
    for (o in ((t = i.defaultProps), t)) e[o] === void 0 && (e[o] = t[o]);
  return { $$typeof: x, type: i, key: r, ref: s, props: e, _owner: g.current };
}
l.Fragment = _;
l.jsx = d;
l.jsxs = d;
f.exports = l;
var n = f.exports,
  u = {},
  a = m;
((u.createRoot = a.createRoot), (u.hydrateRoot = a.hydrateRoot));
function O() {
  return n.jsxs('div', {
    style: { padding: '20px', fontFamily: 'sans-serif' },
    children: [
      n.jsx('h1', { children: 'Tramp Freighter Blues - React Migration' }),
      n.jsx('p', { children: 'Vite setup successful! React 18+ is running.' }),
      n.jsx('p', {
        children:
          'This is a placeholder. The full application will be implemented in subsequent tasks.',
      }),
    ],
  });
}
u.createRoot(document.getElementById('root')).render(
  n.jsx(y.StrictMode, { children: n.jsx(O, {}) })
);
//# sourceMappingURL=index-D_XHHE4s.js.map
