var ul=Object.defineProperty;var dl=(r,e,t)=>e in r?ul(r,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):r[e]=t;var _i=(r,e,t)=>dl(r,typeof e!="symbol"?e+"":e,t);import{r as vt,a as hl,R as yo}from"./vendor-wGySg1uH.js";import{E as fl,V as sn,M as Fn,T as Bn,S as Gs,Q as ks,a as jt}from"./three-_2LDB0r0.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&n(o)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();var So={exports:{}},br={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var pl=vt,ml=Symbol.for("react.element"),gl=Symbol.for("react.fragment"),_l=Object.prototype.hasOwnProperty,xl=pl.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,vl={key:!0,ref:!0,__self:!0,__source:!0};function Mo(r,e,t){var n,i={},s=null,o=null;t!==void 0&&(s=""+t),e.key!==void 0&&(s=""+e.key),e.ref!==void 0&&(o=e.ref);for(n in e)_l.call(e,n)&&!vl.hasOwnProperty(n)&&(i[n]=e[n]);if(r&&r.defaultProps)for(n in e=r.defaultProps,e)i[n]===void 0&&(i[n]=e[n]);return{$$typeof:ml,type:r,key:s,ref:o,props:i,_owner:xl.current}}br.Fragment=gl;br.jsx=Mo;br.jsxs=Mo;So.exports=br;var A=So.exports,gr={},Vs=hl;gr.createRoot=Vs.createRoot,gr.hydrateRoot=Vs.hydrateRoot;const An=0,bo=1,Vt=["grain","ore","tritium","parts","medicine","electronics"],yl={grain:10,ore:15,tritium:50,parts:30,medicine:40,electronics:35},wo={O:10203391,B:11190271,A:13293567,F:16316415,G:16774378,K:16765601,M:16764015,L:16739179,T:13391189,D:16777215},Kt={PRICES:{RECENT_VISIT:50,NEVER_VISITED:100,STALE_VISIT:75},RECENT_THRESHOLD:30,MAX_AGE:100,RELIABILITY:{MANIPULATION_CHANCE:.1,MIN_MANIPULATION_MULTIPLIER:.7,MAX_MANIPULATION_MULTIPLIER:.85}},an={CORE_SYSTEMS:{IDS:[An,bo],PRICE_PER_PERCENT:2},INNER_SYSTEMS:{DISTANCE_THRESHOLD:4.5,PRICE_PER_PERCENT:3},MID_RANGE_SYSTEMS:{DISTANCE_THRESHOLD:10,PRICE_PER_PERCENT:3},OUTER_SYSTEMS:{PRICE_PER_PERCENT:5}},_r={LY_PER_UNIT:20/279.3190870671033,FUEL_CAPACITY_EPSILON:.01};function wr(r){return Math.hypot(r.x,r.y,r.z)*_r.LY_PER_UNIT}const ve={DEFAULT_NAME:"Serendipity",DEGRADATION:{HULL_PER_JUMP:2,ENGINE_PER_JUMP:1,LIFE_SUPPORT_PER_DAY:.5},CONDITION_BOUNDS:{MIN:0,MAX:100},CONDITION_WARNING_THRESHOLDS:{HULL:50,ENGINE:30,LIFE_SUPPORT:20},ENGINE_CONDITION_PENALTIES:{THRESHOLD:60,FUEL_PENALTY_MULTIPLIER:1.2,TIME_PENALTY_DAYS:1},QUIRKS:{sticky_seal:{name:"Sticky Cargo Seal",description:"The main cargo hatch sticks. Every. Single. Time.",effects:{loadingTime:1.1,theftRisk:.95},flavor:"You've learned to kick it in just the right spot."},hot_thruster:{name:"Hot Thruster",description:"Port thruster runs hot. Burns extra fuel but responsive.",effects:{fuelConsumption:1.05},flavor:"The engineers say it's 'within tolerances.' Barely."},sensitive_sensors:{name:"Sensitive Sensors",description:"Sensor array picks up everything. Including false positives.",effects:{salvageDetection:1.15,falseAlarms:1.1},flavor:"You've learned to tell the difference. Mostly."},cramped_quarters:{name:"Cramped Quarters",description:"Living space is... cozy. Very cozy.",effects:{lifeSupportDrain:.9},flavor:"At least you don't have to share."},lucky_ship:{name:"Lucky Ship",description:"This ship has a history of beating the odds.",effects:{negateEventChance:.05},flavor:"Knock on hull plating."},fuel_sipper:{name:"Fuel Sipper",description:"Efficient drive core. Previous owner was meticulous.",effects:{fuelConsumption:.85},flavor:"One of the few things that actually works better than spec."},leaky_seals:{name:"Leaky Seals",description:"Hull seals aren't quite right. Slow degradation.",effects:{hullDegradation:1.5},flavor:"You can hear the whistle when you're in the cargo bay."},smooth_talker:{name:"Smooth Talker's Ride",description:"Previous owner had a reputation. It rubs off.",effects:{npcRepGain:1.05},flavor:"People remember this ship. Usually fondly."}},UPGRADES:{extended_tank:{name:"Extended Fuel Tank",cost:3e3,description:"Increases fuel capacity by 50%",effects:{fuelCapacity:150},tradeoff:"Larger tank is more vulnerable to weapons fire."},reinforced_hull:{name:"Reinforced Hull Plating",cost:5e3,description:"Reduces hull degradation by 50%",effects:{hullDegradation:.5,cargoCapacity:45},tradeoff:"Extra plating takes up cargo space."},efficient_drive:{name:"Efficient Drive System",cost:4e3,description:"Reduces fuel consumption by 20%",effects:{fuelConsumption:.8},tradeoff:"Optimized for efficiency, not speed."},expanded_hold:{name:"Expanded Cargo Hold",cost:6e3,description:"Increases cargo capacity by 50%",effects:{cargoCapacity:75},tradeoff:"Heavier ship is less maneuverable."},smuggler_panels:{name:"Smuggler's Panels",cost:4500,description:"Hidden cargo compartment (10 units)",effects:{hiddenCargoCapacity:10},tradeoff:"If discovered, reputation loss with authorities."},advanced_sensors:{name:"Advanced Sensor Array",cost:3500,description:"See economic events one jump ahead",effects:{eventVisibility:1},tradeoff:"None"},medical_bay:{name:"Medical Bay",cost:2500,description:"Slower life support degradation",effects:{lifeSupportDrain:.7,cargoCapacity:45},tradeoff:"Takes up cargo space."}}},lt={MAX_COORD_DISTANCE:21,MAX_TECH_LEVEL:10,MIN_TECH_LEVEL:1,MARKET_CAPACITY:1e3,DAILY_RECOVERY_FACTOR:.9,TEMPORAL_WAVE_PERIOD:30,TEMPORAL_AMPLITUDE:.15,TEMPORAL_PHASE_OFFSET:.15,TECH_LEVEL_MIDPOINT:5,TECH_MODIFIER_INTENSITY:.08,LOCAL_MODIFIER_MIN:.25,LOCAL_MODIFIER_MAX:2,MARKET_CONDITION_PRUNE_THRESHOLD:1,TECH_BIASES:{grain:-.6,ore:-.8,tritium:-.3,parts:.5,medicine:.7,electronics:1}},Bi={QUICK_BUY_QUANTITY:10},Sl={COST_PER_PERCENT:5},Gn={STARTING_CREDITS:500,STARTING_DEBT:1e4,STARTING_CARGO_CAPACITY:50,STARTING_GRAIN_QUANTITY:20,STARTING_SHIP_NAME:ve.DEFAULT_NAME},mn="2.1.0",Er="trampFreighterSave",Ml=1e3,rt={starSize:30,pulseAmplitude:.15,pulseSpeed:2,selectionRingSize:40,selectionRingPulseSpeed:3,selectionColor:16776960,currentSystemColor:65416,sectorBoundaryColor:65416,defaultStarColor:16777215,sceneBackground:0,ambientLightColor:4210752,directionalLightColor:16777215,connectionColors:{default:52479,sufficient:65280,warning:16776960,insufficient:16711680},connectionOpacity:{default:.6,active:.8},fogDensity:3e-4,ambientLightIntensity:1.5,directionalLightIntensity:.8,dampingFactor:.05,zoomSpeed:1.5,sectorBoundaryRadius:300,starfieldCount:1200,starfieldMinRadius:700,starfieldMaxRadius:1400},bl={maxFontSize:18};class Ye{static calculatePrice(e,t,n=0,i=[],s={}){const o=yl[e];if(o===void 0)throw new Error(`Unknown good type: ${e}`);if(!t||typeof t!="object")throw new Error("System object required for price calculation");const a=Ye.calculateTechLevel(t),l=Ye.getTechModifier(e,a),c=Ye.getTemporalModifier(t.id,n),u=Ye.getLocalModifier(t.id,e,s),h=Ye.getEventModifier(t.id,e,i),d=o*l*c*u*h;return Math.round(d)}static getEventModifier(e,t,n){if(!Array.isArray(n))return 1;const i=n.find(s=>s.systemId===e);return!i||!i.modifiers?1:i.modifiers[t]||1}static calculateTechLevel(e){const t=wr(e),n=Math.min(t,lt.MAX_COORD_DISTANCE);return lt.MAX_TECH_LEVEL-(lt.MAX_TECH_LEVEL-lt.MIN_TECH_LEVEL)*n/lt.MAX_COORD_DISTANCE}static getTechModifier(e,t){if(typeof e!="string"||!e)throw new Error(`Invalid goodType: expected non-empty string, got ${typeof e}`);if(typeof t!="number"||isNaN(t))throw new Error(`Invalid techLevel: expected valid number, got ${isNaN(t)?"NaN":typeof t}`);const n=lt.TECH_BIASES[e];if(n===void 0)throw new Error(`Unknown good type: ${e}`);return 1+n*(lt.TECH_LEVEL_MIDPOINT-t)*lt.TECH_MODIFIER_INTENSITY}static getTemporalModifier(e,t){if(typeof e!="number")throw new Error(`Invalid systemId: expected number, got ${typeof e}`);if(typeof t!="number"||isNaN(t)||t<0)throw new Error(`Invalid currentDay: expected non-negative number, got ${isNaN(t)?"NaN":t}`);const n=2*Math.PI*t/lt.TEMPORAL_WAVE_PERIOD+e*lt.TEMPORAL_PHASE_OFFSET;return 1+lt.TEMPORAL_AMPLITUDE*Math.sin(n)}static getLocalModifier(e,t,n){var a;if(typeof e!="number")throw new Error(`Invalid systemId: expected number, got ${typeof e}`);if(typeof t!="string"||!t)throw new Error(`Invalid goodType: expected non-empty string, got ${typeof t}`);const s=1-(((a=n==null?void 0:n[e])==null?void 0:a[t])??0)/lt.MARKET_CAPACITY;return Math.max(lt.LOCAL_MODIFIER_MIN,Math.min(lt.LOCAL_MODIFIER_MAX,s))}static calculateCargoUsed(e){return Array.isArray(e)?e.reduce((t,n)=>t+(n.qty||0),0):0}static calculateCargoValue(e){if(!e||typeof e!="object")throw new Error("Invalid cargo entry: expected object");if(typeof e.qty!="number")throw new Error("Invalid cargo entry: qty must be a number");if(typeof e.buyPrice!="number")throw new Error("Invalid cargo entry: buyPrice must be a number");return e.qty*e.buyPrice}static calculateCargoTotals(e){if(!Array.isArray(e))throw new Error("Invalid cargo: expected array");let t=0,n=0;for(const i of e){if(typeof i.qty!="number")throw new Error("Invalid cargo stack: qty must be a number");t+=i.qty,n+=Ye.calculateCargoValue(i)}return{totalCapacityUsed:t,totalValue:n}}static validatePurchase(e,t,n,i){return n*i>e?{valid:!1,reason:"Insufficient credits"}:n>t?{valid:!1,reason:"Not enough cargo space"}:{valid:!0}}static validateSale(e,t,n){if(!Array.isArray(e)||t<0||t>=e.length)return{valid:!1,reason:"Invalid cargo stack"};const i=e[t];return n>i.qty?{valid:!1,reason:"Not enough quantity in stack"}:{valid:!0}}static recordCargoPurchase(e,t,n,i,s,o,a){const l=e.findIndex(u=>u.good===t&&u.buyPrice===i);if(l!==-1){const u=[...e];return u[l]={...u[l],qty:u[l].qty+n},u}const c={good:t,qty:n,buyPrice:i,buySystem:s,buySystemName:o,buyDate:a};return[...e,c]}static addCargoStack(e,t,n,i,s=null,o=null,a=null){const l=e.findIndex(u=>u.good===t&&u.buyPrice===i);if(l!==-1){const u=[...e];return u[l]={...u[l],qty:u[l].qty+n},u}const c={good:t,qty:n,buyPrice:i};return s!==null&&(c.buySystem=s),o!==null&&(c.buySystemName=o),a!==null&&(c.buyDate=a),[...e,c]}static removeFromCargoStack(e,t,n){const i=[...e],s=i[t];return s.qty-=n,s.qty<=0&&i.splice(t,1),i}}class Ri{constructor(e){this.hash=this._stringToHash(e)}_stringToHash(e){let t=0;for(let n=0;n<e.length;n++)t=(t<<5)-t+e.charCodeAt(n),t=t&t;return t}next(){return this.hash=(this.hash*9301+49297)%233280,Math.abs(this.hash)/233280}nextInt(e,t){const n=t-e+1;return Math.floor(this.next()*n)+e}nextFloat(e,t){const n=t-e;return this.next()*n+e}}const Tt=class Tt{static updateEvents(e,t){var s,o;if(!e||!t)return[];const n=((s=e.player)==null?void 0:s.daysElapsed)||0;let i=((o=e.world)==null?void 0:o.activeEvents)||[];i=Tt.removeExpiredEvents(i,n);for(const a in Tt.EVENT_TYPES){const l=Tt.EVENT_TYPES[a];for(const c of t){if(i.some(m=>m.systemId===c.id)||!Tt.isSystemEligible(c,l))continue;const u=`event_${a}_${c.id}_${n}`;if(new Ri(u).next()<l.chance){const m=Tt.createEvent(a,c.id,n);i.push(m);break}}}return i}static isSystemEligible(e,t){var i;if(!e||!t)return!1;const n=t.targetSystems;if(n==="any")return!0;if(n==="core")return Tt.CORE_SYSTEM_IDS.includes(e.id);if(n==="mining"){const s=(i=e.type)==null?void 0:i.charAt(0).toUpperCase();return Tt.MINING_SPECTRAL_CLASSES.includes(s)}return!1}static createEvent(e,t,n){const i=Tt.EVENT_TYPES[e];if(!i)throw new Error(`Unknown event type: ${e}`);const s=`${e}_${t}_${n}`,o=`duration_${s}`,a=new Ri(o),[l,c]=i.duration,u=l+Math.floor(a.next()*(c-l+1)),h=n+u;let d={...i.modifiers};if(e==="supply_glut"){const m=`commodity_${s}`,g=new Ri(m),p=Math.floor(g.next()*Vt.length);d={[Vt[p]]:.6}}return{id:s,type:e,systemId:t,startDay:n,endDay:h,modifiers:d}}static removeExpiredEvents(e,t){return Array.isArray(e)?e.filter(n=>n.endDay>=t):[]}static getActiveEventForSystem(e,t){return Array.isArray(t)&&t.find(n=>n.systemId===e)||null}};_i(Tt,"EVENT_TYPES",{mining_strike:{name:"Mining Strike",description:"Workers demand better conditions",duration:[5,10],modifiers:{ore:1.5,tritium:1.3},chance:.05,targetSystems:"mining"},medical_emergency:{name:"Medical Emergency",description:"Outbreak requires urgent supplies",duration:[3,5],modifiers:{medicine:2,grain:.9,ore:.9},chance:.03,targetSystems:"any"},festival:{name:"Cultural Festival",description:"Celebration drives luxury demand",duration:[2,4],modifiers:{electronics:1.75,grain:1.2},chance:.04,targetSystems:"core"},supply_glut:{name:"Supply Glut",description:"Oversupply crashes prices",duration:[3,7],modifiers:{},chance:.06,targetSystems:"any"}}),_i(Tt,"CORE_SYSTEM_IDS",[An,bo]),_i(Tt,"MINING_SPECTRAL_CLASSES",["M","L","T"]);let xr=Tt;class nn{static getIntelligenceCost(e,t){const n=t[e];return n?n.lastVisit<=Kt.RECENT_THRESHOLD?Kt.PRICES.RECENT_VISIT:Kt.PRICES.STALE_VISIT:Kt.PRICES.NEVER_VISITED}static purchaseIntelligence(e,t,n){const i=e.world.priceKnowledge||{},s=e.player.credits,o=nn.getIntelligenceCost(t,i),a=nn.validatePurchase(o,s);if(!a.valid)return{success:!1,reason:a.reason};const l=n.find(p=>p.id===t);if(!l)return{success:!1,reason:"System not found"};const c=e.player.daysElapsed,u=e.world.activeEvents||[],h={},d=`intel_${t}_${c}`,m=new Ri(d),g=e.world.marketConditions||{};for(const p of Vt){let f=Ye.calculatePrice(p,l,c,u,g);if(m.next()<Kt.RELIABILITY.MANIPULATION_CHANCE){const v=Kt.RELIABILITY.MIN_MANIPULATION_MULTIPLIER+m.next()*(Kt.RELIABILITY.MAX_MANIPULATION_MULTIPLIER-Kt.RELIABILITY.MIN_MANIPULATION_MULTIPLIER);f=Math.round(f*v)}h[p]=f}return e.player.credits-=o,e.world.priceKnowledge[t]={lastVisit:0,prices:h},{success:!0,reason:null}}static cleanupOldIntelligence(e){let t=0;for(const n in e)e[n].lastVisit>Kt.MAX_AGE&&(delete e[n],t++);return t}static generateRumor(e,t){const n=e.player.daysElapsed,i=e.world.activeEvents||[],s=`rumor_${n}`,o=new Ri(s);if(i.length>0&&o.next()<.5){const d=Math.floor(o.next()*i.length),m=i[d],g=t.find(p=>p.id===m.systemId);if(g){const f={mining_strike:"labor troubles",medical_emergency:"a health crisis",festival:"celebrations",supply_glut:"oversupply issues"}[m.type]||"unusual market conditions";return`I heard ${g.name} is experiencing ${f}. Might be worth checking out.`}}const a=Math.floor(o.next()*Vt.length),l=Vt[a],c=e.world.marketConditions||{};let u=null,h=1/0;for(const d of t){const m=Ye.calculatePrice(l,d,n,i,c);m<h&&(h=m,u=d)}return u?`Word on the street is that ${l} prices are pretty good at ${u.name} right now.`:"The markets are always changing. Keep your eyes open for opportunities."}static validatePurchase(e,t){return t<e?{valid:!1,reason:"Insufficient credits for intelligence"}:{valid:!0,reason:null}}static listAvailableIntelligence(e,t,n,i,s=[],o=!1){const a=i.getConnectedSystems(n);return t.filter(l=>a.includes(l.id)).map(l=>{const c=e[l.id],u=nn.getIntelligenceCost(l.id,e),h=c?c.lastVisit:null,d={systemId:l.id,systemName:l.name,cost:u,lastVisit:h};if(o&&s.length>0){const m=s.find(g=>g.systemId===l.id);m&&(d.event={name:m.name,commodity:m.commodity,modifier:m.modifier})}return d})}}function wl(r,e,t){if(!r)return console.error("Cannot save: no game state exists"),{success:!1,newLastSaveTime:e};const n=Date.now();if(n-e<Ml)return t||console.log("Save debounced (too soon since last save)"),{success:!1,newLastSaveTime:e};try{const i={...r,meta:{...r.meta,timestamp:n}},s=JSON.stringify(i);return localStorage.setItem(Er,s),t||console.log("Game saved successfully"),{success:!0,newLastSaveTime:n}}catch(i){return console.error("Failed to save game:",i),{success:!1,newLastSaveTime:e}}}function Eo(r){try{const e=localStorage.getItem(Er);if(!e)return r||console.log("No saved game found"),null;const t=JSON.parse(e);return r||console.log("Game loaded successfully"),t}catch(e){return r||console.log("Failed to load game:",e),null}}function El(){try{return localStorage.getItem(Er)!==null}catch(r){return console.error("Failed to check for saved game:",r),!1}}function Tl(r){try{return localStorage.removeItem(Er),r||console.log("Save data cleared"),!0}catch(e){return console.error("Failed to clear save:",e),!1}}function vr(r,e,t){const n=[];for(const i of r)e[i]?n.push(i):console.warn(`Unknown ${t} ID: ${i}, removing from save data`);return n}function Hs(r,e,t,n){for(const i of r){if(!i.good||typeof i.qty!="number"){console.warn(`Invalid ${n} stack found, skipping:`,i);continue}if(typeof i.buyPrice!="number"&&(console.warn(`${n} stack missing buyPrice, using 0:`,i.good),i.buyPrice=0),typeof i.buySystem!="number"&&(console.warn(`${n} stack missing buySystem, using current system:`,i.good),i.buySystem=e),typeof i.buySystemName!="string"){const s=t.find(o=>o.id===i.buySystem);i.buySystemName=s?s.name:"Unknown"}typeof i.buyDate!="number"&&(i.buyDate=0)}}function To(r,e,t){if(r.purchasePrice!==void 0&&r.buyPrice===void 0&&(r.buyPrice=r.purchasePrice,delete r.purchasePrice),r.purchaseSystem!==void 0&&r.buySystem===void 0&&(r.buySystem=r.purchaseSystem,delete r.purchaseSystem),r.purchaseDay!==void 0&&r.buyDate===void 0&&(r.buyDate=r.purchaseDay,delete r.purchaseDay),r.buySystem===void 0&&(r.buySystem=e),r.buySystemName===void 0){const n=t.find(i=>i.id===r.buySystem);r.buySystemName=n?n.name:"Unknown"}r.buyDate===void 0&&(r.buyDate=0)}function Cl(r){return r?r===mn||r==="1.0.0"&&mn==="2.1.0"||r==="2.0.0"&&mn==="2.1.0":!1}function Al(r){if(!r||!r.player||typeof r.player.credits!="number"||typeof r.player.debt!="number"||typeof r.player.currentSystem!="number"||typeof r.player.daysElapsed!="number"||!r.ship||typeof r.ship.name!="string"||typeof r.ship.fuel!="number"||typeof r.ship.cargoCapacity!="number"||!Array.isArray(r.ship.cargo)||r.ship.quirks!==void 0&&!Array.isArray(r.ship.quirks)||r.ship.upgrades!==void 0&&!Array.isArray(r.ship.upgrades)||r.ship.hiddenCargo!==void 0&&!Array.isArray(r.ship.hiddenCargo)||r.ship.hiddenCargoCapacity!==void 0&&typeof r.ship.hiddenCargoCapacity!="number"||r.ship.hull!==void 0&&typeof r.ship.hull!="number"||r.ship.engine!==void 0&&typeof r.ship.engine!="number"||r.ship.lifeSupport!==void 0&&typeof r.ship.lifeSupport!="number")return!1;for(const e of r.ship.cargo)if(!e.good||typeof e.qty!="number"||!(typeof e.buyPrice=="number"||typeof e.purchasePrice=="number")||e.buySystem!==void 0&&typeof e.buySystem!="number"||e.purchaseSystem!==void 0&&typeof e.purchaseSystem!="number"||e.buySystemName!==void 0&&typeof e.buySystemName!="string"||e.buyDate!==void 0&&typeof e.buyDate!="number"||e.purchaseDay!==void 0&&typeof e.purchaseDay!="number")return!1;if(!r.world||!Array.isArray(r.world.visitedSystems))return!1;if(r.world.priceKnowledge!==void 0){if(typeof r.world.priceKnowledge!="object")return!1;for(const e in r.world.priceKnowledge){const t=r.world.priceKnowledge[e];if(!t||typeof t.lastVisit!="number"||typeof t.prices!="object")return!1}}return!(r.world.activeEvents!==void 0&&!Array.isArray(r.world.activeEvents)||!r.meta||typeof r.meta.version!="string"||typeof r.meta.timestamp!="number")}function Ll(r,e,t){if(t||console.log("Migrating save from v1.0.0 to v2.1.0"),r.ship.hull===void 0&&(r.ship.hull=ve.CONDITION_BOUNDS.MAX),r.ship.engine===void 0&&(r.ship.engine=ve.CONDITION_BOUNDS.MAX),r.ship.lifeSupport===void 0&&(r.ship.lifeSupport=ve.CONDITION_BOUNDS.MAX),r.ship.cargo&&Array.isArray(r.ship.cargo)&&r.ship.cargo.forEach(n=>{To(n,r.player.currentSystem,e)}),r.ship.quirks||(r.ship.quirks=[]),r.ship.upgrades||(r.ship.upgrades=[]),r.ship.hiddenCargo||(r.ship.hiddenCargo=[]),r.ship.hiddenCargoCapacity===void 0&&(r.ship.hiddenCargoCapacity=0),Array.isArray(r.ship.quirks)&&(r.ship.quirks=vr(r.ship.quirks,ve.QUIRKS,"quirk")),Array.isArray(r.ship.upgrades)&&(r.ship.upgrades=vr(r.ship.upgrades,ve.UPGRADES,"upgrade")),!r.world.priceKnowledge){r.world.priceKnowledge={};const n=r.player.currentSystem,i=e.find(l=>l.id===n);if(!i)throw new Error(`Migration failed: current system ID ${n} not found in star data`);const s=r.player.daysElapsed,o={},a={};for(const l of Vt)a[l]=Ye.calculatePrice(l,i,s,[],o);r.world.priceKnowledge[n]={lastVisit:0,prices:a}}return r.world.activeEvents||(r.world.activeEvents=[]),r.world.marketConditions||(r.world.marketConditions={}),r.meta.version=mn,t||console.log("Migration complete"),r}function Rl(r,e){return e||console.log("Migrating save from v2.0.0 to v2.1.0"),r.world.marketConditions||(r.world.marketConditions={}),r.meta.version=mn,e||console.log("Migration complete"),r}function Pl(r,e){if(r.ship.hull===void 0&&(r.ship.hull=ve.CONDITION_BOUNDS.MAX),r.ship.engine===void 0&&(r.ship.engine=ve.CONDITION_BOUNDS.MAX),r.ship.lifeSupport===void 0&&(r.ship.lifeSupport=ve.CONDITION_BOUNDS.MAX),r.ship.cargo&&Array.isArray(r.ship.cargo)&&r.ship.cargo.forEach(t=>{To(t,r.player.currentSystem,e)}),r.ship.quirks||(r.ship.quirks=[]),r.ship.upgrades||(r.ship.upgrades=[]),r.ship.hiddenCargo||(r.ship.hiddenCargo=[]),r.ship.hiddenCargoCapacity===void 0&&(r.ship.hiddenCargoCapacity=0),Array.isArray(r.ship.quirks)&&(r.ship.quirks=vr(r.ship.quirks,ve.QUIRKS,"quirk")),Array.isArray(r.ship.upgrades)&&(r.ship.upgrades=vr(r.ship.upgrades,ve.UPGRADES,"upgrade")),Array.isArray(r.ship.cargo)&&Hs(r.ship.cargo,r.player.currentSystem,e,"Cargo"),Array.isArray(r.ship.hiddenCargo)&&Hs(r.ship.hiddenCargo,r.player.currentSystem,e,"Hidden cargo"),!r.world.priceKnowledge){r.world.priceKnowledge={};const t=r.player.currentSystem,n=e.find(a=>a.id===t);if(!n)throw new Error(`Load failed: current system ID ${t} not found in star data`);const i=r.player.daysElapsed,s={},o={};for(const a of Vt)o[a]=Ye.calculatePrice(a,n,i,[],s);r.world.priceKnowledge[t]={lastVisit:0,prices:o}}return r.world.activeEvents||(r.world.activeEvents=[]),r.world.marketConditions||(r.world.marketConditions={}),r}function Dl(r){return!r||r.trim().length===0?ve.DEFAULT_NAME:r.replace(/<[^>]*>/g,"").substring(0,50).trim()||ve.DEFAULT_NAME}class Il{constructor(e,t,n=null){this.starData=e,this.wormholeData=t,this.navigationSystem=n,this.isTestEnvironment=typeof process<"u"&&!1,this.subscribers={creditsChanged:[],debtChanged:[],fuelChanged:[],cargoChanged:[],locationChanged:[],timeChanged:[],priceKnowledgeChanged:[],activeEventsChanged:[],shipConditionChanged:[],conditionWarning:[],shipNameChanged:[]},this.state=null,this.lastSaveTime=0}assignShipQuirks(e=Math.random){const t=Object.keys(ve.QUIRKS),n=e()<.5?2:3,i=new Set;for(;i.size<n;){const s=t[Math.floor(e()*t.length)];i.add(s)}return Array.from(i)}applyQuirkModifiers(e,t,n){let i=e;for(const s of n){const o=ve.QUIRKS[s];if(!o)throw new Error(`Invalid quirk ID: ${s} not found in SHIP_CONFIG.QUIRKS`);o.effects[t]&&(i*=o.effects[t])}return i}getQuirkDefinition(e){return ve.QUIRKS[e]||null}initNewGame(){const e=this.starData.find(l=>l.id===An),t=0,n=[],i={},s=Ye.calculatePrice("grain",e,t,n,i),o={};for(const l of Vt)o[l]=Ye.calculatePrice(l,e,t,n,i);const a=this.assignShipQuirks();return this.state={player:{credits:Gn.STARTING_CREDITS,debt:Gn.STARTING_DEBT,currentSystem:An,daysElapsed:0},ship:{name:Gn.STARTING_SHIP_NAME,quirks:a,upgrades:[],fuel:ve.CONDITION_BOUNDS.MAX,hull:ve.CONDITION_BOUNDS.MAX,engine:ve.CONDITION_BOUNDS.MAX,lifeSupport:ve.CONDITION_BOUNDS.MAX,cargoCapacity:Gn.STARTING_CARGO_CAPACITY,cargo:[{good:"grain",qty:Gn.STARTING_GRAIN_QUANTITY,buyPrice:s,buySystem:An,buySystemName:"Sol",buyDate:0}],hiddenCargo:[],hiddenCargoCapacity:0},world:{visitedSystems:[An],priceKnowledge:{[An]:{lastVisit:0,prices:o}},activeEvents:[],marketConditions:{}},meta:{version:mn,timestamp:Date.now()}},this.isTestEnvironment||console.log("New game initialized:",this.state),this.emit("creditsChanged",this.state.player.credits),this.emit("debtChanged",this.state.player.debt),this.emit("fuelChanged",this.state.ship.fuel),this.emit("cargoChanged",this.state.ship.cargo),this.emit("locationChanged",this.state.player.currentSystem),this.emit("timeChanged",this.state.player.daysElapsed),this.emit("priceKnowledgeChanged",this.state.world.priceKnowledge),this.emit("shipConditionChanged",{hull:this.state.ship.hull,engine:this.state.ship.engine,lifeSupport:this.state.ship.lifeSupport}),this.state}subscribe(e,t){if(!this.subscribers[e]){console.warn(`Unknown event type: ${e}`);return}this.subscribers[e].push(t),this.isTestEnvironment||console.log(`Subscribed to ${e}, total subscribers: ${this.subscribers[e].length}`)}unsubscribe(e,t){if(!this.subscribers[e])return;const n=this.subscribers[e].indexOf(t);n>-1&&this.subscribers[e].splice(n,1)}emit(e,t){this.subscribers[e]&&this.subscribers[e].forEach(n=>{try{n(t)}catch(i){console.error(`Error in ${e} subscriber:`,i)}})}getState(){return this.state}getPlayer(){if(!this.state)throw new Error("Invalid state: getPlayer called before game initialization");return this.state.player}getShip(){if(!this.state)throw new Error("Invalid state: getShip called before game initialization");return this.state.ship}getCurrentSystem(){if(!this.state)throw new Error("Invalid state: getCurrentSystem called before game initialization");const e=this.state.player.currentSystem,t=this.starData.find(n=>n.id===e);if(!t)throw new Error(`Invalid game state: current system ID ${e} not found in star data`);return t}getCargoUsed(){if(!this.state)throw new Error("Invalid state: getCargoUsed called before game initialization");return this.state.ship.cargo.reduce((e,t)=>e+t.qty,0)}getCargoRemaining(){if(!this.state)throw new Error("Invalid state: getCargoRemaining called before game initialization");return this.state.ship.cargoCapacity-this.getCargoUsed()}getFuelCapacity(){if(!this.state)throw new Error("Invalid state: getFuelCapacity called before game initialization");return this.calculateShipCapabilities().fuelCapacity}isSystemVisited(e){if(!this.state)throw new Error("Invalid state: isSystemVisited called before game initialization");return this.state.world.visitedSystems.includes(e)}getShipCondition(){if(!this.state)throw new Error("Invalid state: getShipCondition called before game initialization");return{hull:this.state.ship.hull,engine:this.state.ship.engine,lifeSupport:this.state.ship.lifeSupport}}checkConditionWarnings(){const e=this.getShipCondition();if(!e)return[];const t=[];return e.hull<ve.CONDITION_WARNING_THRESHOLDS.HULL&&t.push({system:"hull",message:"Risk of cargo loss during jumps",severity:"warning"}),e.engine<ve.CONDITION_WARNING_THRESHOLDS.ENGINE&&t.push({system:"engine",message:"Jump failure risk - immediate repairs recommended",severity:"warning"}),e.lifeSupport<ve.CONDITION_WARNING_THRESHOLDS.LIFE_SUPPORT&&t.push({system:"lifeSupport",message:"Critical condition - urgent repairs required",severity:"critical"}),t}getPriceKnowledge(){if(!this.state)throw new Error("Invalid state: getPriceKnowledge called before game initialization");return this.state.world.priceKnowledge||{}}getKnownPrices(e){var t;if(!this.state)throw new Error("Invalid state: getKnownPrices called before game initialization");if(!this.state.world.priceKnowledge)throw new Error("Invalid state: priceKnowledge missing from world state");return((t=this.state.world.priceKnowledge[e])==null?void 0:t.prices)||null}hasVisitedSystem(e){if(!this.state)throw new Error("Invalid state: hasVisitedSystem called before game initialization");if(!this.state.world.priceKnowledge)throw new Error("Invalid state: priceKnowledge missing from world state");return this.state.world.priceKnowledge[e]!==void 0}updateCredits(e){this.state.player.credits=e,this.emit("creditsChanged",e)}updateDebt(e){this.state.player.debt=e,this.emit("debtChanged",e)}updateFuel(e){const t=this.getFuelCapacity();if(e<ve.CONDITION_BOUNDS.MIN||e>t)throw new Error(`Invalid fuel value: ${e}. Fuel must be between ${ve.CONDITION_BOUNDS.MIN} and ${t}.`);this.state.ship.fuel=e,this.emit("fuelChanged",e)}updateCargo(e){this.state.ship.cargo=e,this.emit("cargoChanged",e)}updateLocation(e){this.state.player.currentSystem=e,this.state.world.visitedSystems.includes(e)||this.state.world.visitedSystems.push(e),this.emit("locationChanged",e)}setCredits(e){this.updateCredits(e)}setDebt(e){this.updateDebt(e)}setFuel(e){this.updateFuel(e)}updateTime(e){const t=this.state.player.daysElapsed;if(this.state.player.daysElapsed=e,e>t){const n=e-t;this.incrementPriceKnowledgeStaleness(n),nn.cleanupOldIntelligence(this.state.world.priceKnowledge),this.applyMarketRecovery(n),this.state.world.activeEvents=xr.updateEvents(this.state,this.starData),this.recalculatePricesForKnownSystems(),this.emit("activeEventsChanged",this.state.world.activeEvents)}this.emit("timeChanged",e)}updateShipName(e){const t=Dl(e);this.state.ship.name=t,this.emit("shipNameChanged",t)}updateShipCondition(e,t,n){this.state.ship.hull=Math.max(ve.CONDITION_BOUNDS.MIN,Math.min(ve.CONDITION_BOUNDS.MAX,e)),this.state.ship.engine=Math.max(ve.CONDITION_BOUNDS.MIN,Math.min(ve.CONDITION_BOUNDS.MAX,t)),this.state.ship.lifeSupport=Math.max(ve.CONDITION_BOUNDS.MIN,Math.min(ve.CONDITION_BOUNDS.MAX,n)),this.emit("shipConditionChanged",{hull:this.state.ship.hull,engine:this.state.ship.engine,lifeSupport:this.state.ship.lifeSupport});const i=this.checkConditionWarnings();i.length>0&&i.forEach(s=>{this.emit("conditionWarning",s)})}updateMarketConditions(e,t,n){this.state.world.marketConditions||(this.state.world.marketConditions={}),this.state.world.marketConditions[e]||(this.state.world.marketConditions[e]={}),this.state.world.marketConditions[e][t]===void 0&&(this.state.world.marketConditions[e][t]=0),this.state.world.marketConditions[e][t]+=n}applyMarketRecovery(e){if(!this.state)throw new Error("Invalid state: applyMarketRecovery called before game initialization");if(!this.state.world.marketConditions)throw new Error("Invalid state: marketConditions missing from world state");const t=Math.pow(lt.DAILY_RECOVERY_FACTOR,e);for(const n in this.state.world.marketConditions){const i=this.state.world.marketConditions[n];for(const s in i)i[s]*=t,Math.abs(i[s])<lt.MARKET_CONDITION_PRUNE_THRESHOLD&&delete i[s];Object.keys(i).length===0&&delete this.state.world.marketConditions[n]}}updatePriceKnowledge(e,t,n=0){this.state.world.priceKnowledge||(this.state.world.priceKnowledge={}),this.state.world.priceKnowledge[e]={lastVisit:n,prices:{...t}},this.emit("priceKnowledgeChanged",this.state.world.priceKnowledge)}incrementPriceKnowledgeStaleness(e=1){if(!this.state)throw new Error("Invalid state: incrementPriceKnowledgeStaleness called before game initialization");if(!this.state.world.priceKnowledge)throw new Error("Invalid state: priceKnowledge missing from world state");for(const t in this.state.world.priceKnowledge)this.state.world.priceKnowledge[t].lastVisit+=e;this.emit("priceKnowledgeChanged",this.state.world.priceKnowledge)}recalculatePricesForKnownSystems(){if(!this.state)throw new Error("Invalid state: recalculatePricesForKnownSystems called before game initialization");if(!this.state.world.priceKnowledge)return;const e=this.state.player.daysElapsed,t=this.state.world.activeEvents;if(!t)throw new Error("Invalid state: activeEvents missing from world state");const n=this.state.world.marketConditions;if(!n)throw new Error("Invalid state: marketConditions missing from world state");for(const i in this.state.world.priceKnowledge){const s=parseInt(i),o=this.starData.find(a=>a.id===s);if(o){const a={};for(const l of Vt)a[l]=Ye.calculatePrice(l,o,e,t,n);this.state.world.priceKnowledge[s].prices=a}}this.emit("priceKnowledgeChanged",this.state.world.priceKnowledge)}getActiveEvents(){if(!this.state)throw new Error("Invalid state: getActiveEvents called before game initialization");return this.state.world.activeEvents||[]}updateActiveEvents(e){this.state.world.activeEvents||(this.state.world.activeEvents=[]),this.state.world.activeEvents=e,this.emit("activeEventsChanged",e)}getActiveEventForSystem(e){return this.getActiveEvents().find(n=>n.systemId===e)||null}getEventType(e){return xr.EVENT_TYPES[e]||null}getIntelligenceCost(e){const t=this.getPriceKnowledge();return nn.getIntelligenceCost(e,t)}purchaseIntelligence(e){if(!this.state)throw new Error("Invalid state: purchaseIntelligence called before game initialization");const t=nn.purchaseIntelligence(this.state,e,this.starData);return t.success&&(this.emit("creditsChanged",this.state.player.credits),this.emit("priceKnowledgeChanged",this.state.world.priceKnowledge),this.saveGame()),t}generateRumor(){if(!this.state)throw new Error("Invalid state: generateRumor called before game initialization");return nn.generateRumor(this.state,this.starData)}listAvailableIntelligence(){const e=this.getPriceKnowledge(),t=this.state.player.currentSystem,n=this.getActiveEvents(),i=this.state.ship.upgrades.includes("advanced_sensors");return nn.listAvailableIntelligence(e,this.starData,t,this.navigationSystem,n,i)}buyGood(e,t,n){if(!this.state)throw new Error("Invalid state: buyGood called before game initialization");const i=this.state.player.credits,s=this.getCargoRemaining(),o=t*n;if(o>i)return{success:!1,reason:"Insufficient credits"};if(t>s)return{success:!1,reason:"Not enough cargo space"};this.updateCredits(i-o);const a=this.state.player.currentSystem,c=this.getCurrentSystem().name,u=this.state.player.daysElapsed,h=Ye.recordCargoPurchase(this.state.ship.cargo,e,t,n,a,c,u);return this.updateCargo(h),this.updateMarketConditions(a,e,-t),this.saveGame(),{success:!0}}sellGood(e,t,n){if(!this.state)throw new Error("Invalid state: sellGood called before game initialization");const i=this.state.ship.cargo;if(e<0||e>=i.length)return{success:!1,reason:"Invalid cargo stack"};const s=i[e];if(t<=0)return{success:!1,reason:"Quantity must be positive"};if(t>s.qty)return{success:!1,reason:"Not enough quantity in stack"};const o=t*n,a=n-s.buyPrice;this.updateCredits(this.state.player.credits+o),s.qty-=t,s.qty<=0&&i.splice(e,1),this.updateCargo(i);const l=this.state.player.currentSystem;return this.updateMarketConditions(l,s.good,t),this.saveGame(),{success:!0,profitMargin:a}}getFuelPrice(e){if(an.CORE_SYSTEMS.IDS.includes(e))return an.CORE_SYSTEMS.PRICE_PER_PERCENT;const t=this.starData.find(i=>i.id===e);if(!t)return an.INNER_SYSTEMS.PRICE_PER_PERCENT;const n=wr(t);return n<an.INNER_SYSTEMS.DISTANCE_THRESHOLD?an.INNER_SYSTEMS.PRICE_PER_PERCENT:n<an.MID_RANGE_SYSTEMS.DISTANCE_THRESHOLD?an.MID_RANGE_SYSTEMS.PRICE_PER_PERCENT:an.OUTER_SYSTEMS.PRICE_PER_PERCENT}validateRefuel(e,t,n,i){const s=t*i,o=this.getFuelCapacity();return t<=0?{valid:!1,reason:"Refuel amount must be positive",cost:s}:e+t>o+_r.FUEL_CAPACITY_EPSILON?{valid:!1,reason:`Cannot refuel beyond ${o}% capacity`,cost:s}:s>n?{valid:!1,reason:"Insufficient credits for refuel",cost:s}:{valid:!0,reason:null,cost:s}}refuel(e){if(!this.state)throw new Error("Invalid state: refuel called before game initialization");const t=this.state.ship.fuel,n=this.state.player.credits,i=this.state.player.currentSystem,s=this.getFuelPrice(i),o=this.validateRefuel(t,e,n,s);return o.valid?(this.updateCredits(n-o.cost),this.updateFuel(t+e),this.saveGame(),{success:!0,reason:null}):{success:!1,reason:o.reason}}getRepairCost(e,t,n){return n>=ve.CONDITION_BOUNDS.MAX?0:t*Sl.COST_PER_PERCENT}repairShipSystem(e,t){if(!this.state)throw new Error("Invalid state: repairShipSystem called before game initialization");if(!["hull","engine","lifeSupport"].includes(e))return{success:!1,reason:"Invalid system type"};const i=this.state.ship[e],s=this.state.player.credits,o=this.getRepairCost(e,t,i);if(t<=0)return{success:!1,reason:"Repair amount must be positive"};if(i>=ve.CONDITION_BOUNDS.MAX)return{success:!1,reason:"System already at maximum condition"};if(o>s)return{success:!1,reason:"Insufficient credits for repair"};if(i+t>ve.CONDITION_BOUNDS.MAX)return{success:!1,reason:"Repair would exceed maximum condition"};this.updateCredits(s-o);const a={hull:this.state.ship.hull,engine:this.state.ship.engine,lifeSupport:this.state.ship.lifeSupport};return a[e]=i+t,this.updateShipCondition(a.hull,a.engine,a.lifeSupport),this.saveGame(),{success:!0,reason:null}}validateUpgradePurchase(e){if(!this.state)throw new Error("Invalid state: validateUpgradePurchase called before game initialization");const t=ve.UPGRADES[e];return t?this.state.ship.upgrades.includes(e)?{valid:!1,reason:"Upgrade already installed"}:this.state.player.credits<t.cost?{valid:!1,reason:`Insufficient credits (need ₡${t.cost})`}:{valid:!0,reason:""}:{valid:!1,reason:"Unknown upgrade"}}purchaseUpgrade(e){if(!this.state)throw new Error("Invalid state: purchaseUpgrade called before game initialization");const t=this.validateUpgradePurchase(e);if(!t.valid)return{success:!1,reason:t.reason};const n=ve.UPGRADES[e];this.updateCredits(this.state.player.credits-n.cost),this.state.ship.upgrades.push(e);const i=this.calculateShipCapabilities();return this.state.ship.cargoCapacity=i.cargoCapacity,this.state.ship.hiddenCargoCapacity=i.hiddenCargoCapacity,this.saveGame(),{success:!0,reason:""}}calculateShipCapabilities(){if(!this.state)throw new Error("Invalid state: calculateShipCapabilities called before game initialization");const e={fuelCapacity:ve.CONDITION_BOUNDS.MAX,cargoCapacity:Gn.STARTING_CARGO_CAPACITY,fuelConsumption:1,hullDegradation:1,lifeSupportDrain:1,hiddenCargoCapacity:0,eventVisibility:0};for(const t of this.state.ship.upgrades){const n=ve.UPGRADES[t];if(!n)throw new Error(`Invalid upgrade ID: ${t} not found in SHIP_UPGRADES`);for(const[i,s]of Object.entries(n.effects))i.endsWith("Capacity")?e[i]=s:e[i]*=s}return e}_addToCargoArray(e,t,n){const i=e.findIndex(s=>s.good===t.good&&s.buyPrice===t.buyPrice);i>=0?e[i].qty+=n:e.push({good:t.good,qty:n,buyPrice:t.buyPrice,buySystem:t.buySystem,buySystemName:t.buySystemName,buyDate:t.buyDate})}moveToHiddenCargo(e,t){if(!this.state)throw new Error("Invalid state: moveToHiddenCargo called before game initialization");const n=this.state.ship;if(!n.upgrades.includes("smuggler_panels"))return{success:!1,reason:"No hidden cargo compartment"};const i=n.cargo.findIndex(l=>l.good===e);if(i===-1)return{success:!1,reason:"Cargo not found"};const s=n.cargo[i];if(s.qty<t)return{success:!1,reason:"Insufficient quantity"};const o=n.hiddenCargo.reduce((l,c)=>l+c.qty,0),a=n.hiddenCargoCapacity-o;return t>a?{success:!1,reason:`Hidden cargo full (${a} units available)`}:(s.qty-=t,s.qty===0&&n.cargo.splice(i,1),this._addToCargoArray(n.hiddenCargo,s,t),this.updateCargo(n.cargo),this.saveGame(),{success:!0,reason:""})}moveToRegularCargo(e,t){if(!this.state)throw new Error("Invalid state: moveToRegularCargo called before game initialization");const n=this.state.ship,i=n.hiddenCargo.findIndex(l=>l.good===e);if(i===-1)return{success:!1,reason:"Cargo not found in hidden compartment"};const s=n.hiddenCargo[i];if(s.qty<t)return{success:!1,reason:"Insufficient quantity"};const o=n.cargo.reduce((l,c)=>l+c.qty,0),a=n.cargoCapacity-o;return t>a?{success:!1,reason:`Cargo hold full (${a} units available)`}:(s.qty-=t,s.qty===0&&n.hiddenCargo.splice(i,1),this._addToCargoArray(n.cargo,s,t),this.updateCargo(n.cargo),this.saveGame(),{success:!0,reason:""})}dock(){if(!this.state)throw new Error("Invalid state: dock called before game initialization");const e=this.state.player.currentSystem,t=this.starData.find(a=>a.id===e);if(!t)throw new Error(`Invalid game state: current system ID ${e} not found in star data`);const n=this.state.player.daysElapsed,i=this.state.world.activeEvents;if(!i)throw new Error("Invalid state: activeEvents missing from world state");const s=this.state.world.marketConditions;if(!s)throw new Error("Invalid state: marketConditions missing from world state");const o={};for(const a of Vt)o[a]=Ye.calculatePrice(a,t,n,i,s);return this.updatePriceKnowledge(e,o,0),this.saveGame(),{success:!0}}undock(){if(!this.state)throw new Error("Invalid state: undock called before game initialization");return this.saveGame(),{success:!0}}saveGame(){const e=wl(this.state,this.lastSaveTime,this.isTestEnvironment);return e.success&&(this.lastSaveTime=e.newLastSaveTime),e.success}loadGame(){var e,t,n;try{let i=Eo(this.isTestEnvironment);return i?Cl((e=i.meta)==null?void 0:e.version)?(((t=i.meta)==null?void 0:t.version)==="1.0.0"&&mn==="2.1.0"&&(i=Ll(i,this.starData,this.isTestEnvironment)),((n=i.meta)==null?void 0:n.version)==="2.0.0"&&mn==="2.1.0"&&(i=Rl(i,this.isTestEnvironment)),Al(i)?(i=Pl(i,this.starData),this.state=i,this.emit("creditsChanged",this.state.player.credits),this.emit("debtChanged",this.state.player.debt),this.emit("fuelChanged",this.state.ship.fuel),this.emit("cargoChanged",this.state.ship.cargo),this.emit("locationChanged",this.state.player.currentSystem),this.emit("timeChanged",this.state.player.daysElapsed),this.emit("priceKnowledgeChanged",this.state.world.priceKnowledge),this.emit("activeEventsChanged",this.state.world.activeEvents),this.emit("shipConditionChanged",{hull:this.state.ship.hull,engine:this.state.ship.engine,lifeSupport:this.state.ship.lifeSupport}),this.state):(this.isTestEnvironment||console.log("Save data corrupted, starting new game"),null)):(this.isTestEnvironment||console.log("Save version incompatible, starting new game"),null):null}catch(i){return this.isTestEnvironment||console.log("Failed to load game:",i),null}}hasSavedGame(){return El()}clearSave(){return Tl(this.isTestEnvironment)}}class Cs{constructor(e,t){this.starData=e,this.wormholeData=t}calculateDistanceFromSol(e){return Math.hypot(e.x,e.y,e.z)*_r.LY_PER_UNIT}calculateDistanceBetween(e,t){return Math.hypot(e.x-t.x,e.y-t.y,e.z-t.z)*_r.LY_PER_UNIT}calculateJumpTime(e){return Math.max(1,Math.ceil(e*.5))}calculateFuelCost(e){return 10+e*2}calculateFuelCostWithCondition(e,t,n=null,i=[],s=1){let o=this.calculateFuelCost(e);return t<ve.ENGINE_CONDITION_PENALTIES.THRESHOLD&&(o*=ve.ENGINE_CONDITION_PENALTIES.FUEL_PENALTY_MULTIPLIER),n&&i.length>0&&(o=n(o,"fuelConsumption",i)),o*=s,o}calculateJumpTimeWithCondition(e,t){const n=this.calculateJumpTime(e);return t<ve.ENGINE_CONDITION_PENALTIES.THRESHOLD?n+ve.ENGINE_CONDITION_PENALTIES.TIME_PENALTY_DAYS:n}static applyJumpDegradation(e,t,n=null,i=[],s=1,o=1){let a=ve.DEGRADATION.HULL_PER_JUMP;const l=ve.DEGRADATION.ENGINE_PER_JUMP;let c=ve.DEGRADATION.LIFE_SUPPORT_PER_DAY*t;return n&&i.length>0&&(a=n(a,"hullDegradation",i),c=n(c,"lifeSupportDrain",i)),a*=s,c*=o,e.hull=Math.max(ve.CONDITION_BOUNDS.MIN,Math.min(ve.CONDITION_BOUNDS.MAX,e.hull-a)),e.engine=Math.max(ve.CONDITION_BOUNDS.MIN,Math.min(ve.CONDITION_BOUNDS.MAX,e.engine-l)),e.lifeSupport=Math.max(ve.CONDITION_BOUNDS.MIN,Math.min(ve.CONDITION_BOUNDS.MAX,e.lifeSupport-c)),e}areSystemsConnected(e,t){return this.wormholeData.some(n=>n[0]===e&&n[1]===t||n[0]===t&&n[1]===e)}getConnectedSystems(e){const t=[];for(const n of this.wormholeData)n[0]===e?t.push(n[1]):n[1]===e&&t.push(n[0]);return t}validateJump(e,t,n,i=100,s=null,o=[],a=1){if(!this.areSystemsConnected(e,t))return{valid:!1,error:"No wormhole connection to target system",fuelCost:0,distance:0,jumpTime:0};const l=this.starData.find(m=>m.id===e),c=this.starData.find(m=>m.id===t);if(!l||!c)return{valid:!1,error:"Invalid system ID",fuelCost:0,distance:0,jumpTime:0};const u=this.calculateDistanceBetween(l,c),h=this.calculateFuelCostWithCondition(u,i,s,o,a),d=this.calculateJumpTimeWithCondition(u,i);return n<h?{valid:!1,error:"Insufficient fuel for jump",fuelCost:h,distance:u,jumpTime:d}:{valid:!0,error:null,fuelCost:h,distance:u,jumpTime:d}}async executeJump(e,t,n=null,i=null){const s=e.getState();if(!s)return{success:!1,error:"No game state"};const o=s.player.currentSystem,a=s.ship.fuel,l=s.ship.engine,c=s.ship.quirks||[],u=e.calculateShipCapabilities(),h=this.validateJump(o,t,a,l,e.applyQuirkModifiers.bind(e),c,u.fuelConsumption);if(!h.valid)return{success:!1,error:h.error};e.updateFuel(a-h.fuelCost),e.updateTime(s.player.daysElapsed+h.jumpTime),e.updateLocation(t);const d=Cs.applyJumpDegradation(s.ship,h.jumpTime,e.applyQuirkModifiers.bind(e),c,u.hullDegradation,u.lifeSupportDrain);e.updateShipCondition(d.hull,d.engine,d.lifeSupport),e.saveGame();let m=!1,g=!1,p=!1,f=!1;if(i&&n&&(i.isStationVisible&&i.isStationVisible()&&(m=!0,i.hideStationInterface()),i.isTradeVisible&&i.isTradeVisible()&&(g=!0,i.hideTradePanel()),i.isRefuelVisible&&i.isRefuelVisible()&&(p=!0,i.hideRefuelPanel()),i.isInfoBrokerVisible&&i.isInfoBrokerVisible()&&(f=!0,i.hideInfoBrokerPanel())),n)try{await n.playJumpAnimation(o,t)}finally{i&&(m&&i.showStationInterface(),g&&i.showTradePanel(),p&&i.showRefuelPanel(),f&&i.showInfoBrokerPanel())}return{success:!0,error:null}}}class Ws extends yo.Component{constructor(t){super(t);_i(this,"handleReload",()=>{window.location.reload()});this.state={hasError:!1,error:null,errorInfo:null}}static getDerivedStateFromError(t){return{hasError:!0,error:t}}componentDidCatch(t,n){console.error("Error caught by ErrorBoundary:",t,n),this.setState({errorInfo:n})}render(){return this.state.hasError?A.jsxs("div",{className:"error-boundary",style:{padding:"40px",fontFamily:"sans-serif",maxWidth:"600px",margin:"0 auto",backgroundColor:"#1a1a1a",color:"#fff",borderRadius:"8px",marginTop:"40px"},children:[A.jsx("h2",{style:{color:"#ff6b6b",marginBottom:"20px"},children:"Something went wrong"}),A.jsx("p",{style:{marginBottom:"20px"},children:"An error occurred in the application. You can try reloading the page to recover."}),this.state.error&&A.jsxs("div",{style:{backgroundColor:"#2a2a2a",padding:"15px",borderRadius:"4px",marginBottom:"20px",fontFamily:"monospace",fontSize:"14px",color:"#ff6b6b",overflowX:"auto"},children:[A.jsx("strong",{children:"Error:"})," ",this.state.error.toString(),this.state.errorInfo&&A.jsxs("details",{style:{marginTop:"10px"},children:[A.jsx("summary",{style:{cursor:"pointer",color:"#aaa"},children:"Component Stack"}),A.jsx("pre",{style:{marginTop:"10px",fontSize:"12px",color:"#ccc"},children:this.state.errorInfo.componentStack})]})]}),A.jsx("button",{onClick:this.handleReload,style:{padding:"10px 20px",fontSize:"16px",cursor:"pointer",backgroundColor:"#4a9eff",color:"#fff",border:"none",borderRadius:"4px"},children:"Reload Application"})]}):this.props.children}}/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const As="150",Ir={ROTATE:0,DOLLY:1,PAN:2},Nl=0,js=1,Ol=2,Co=1,zl=2,Ai=3,xn=0,At=1,dn=2,gn=0,ai=1,yr=2,qs=3,Xs=4,Ul=5,ri=100,Fl=101,Bl=102,Ys=103,$s=104,Gl=200,kl=201,Vl=202,Hl=203,Ao=204,Lo=205,Wl=206,jl=207,ql=208,Xl=209,Yl=210,$l=0,Kl=1,Zl=2,xs=3,Jl=4,Ql=5,ec=6,tc=7,Ro=0,nc=1,ic=2,rn=0,rc=1,sc=2,ac=3,oc=4,lc=5,Po=300,ci=301,ui=302,vs=303,ys=304,Tr=306,Ss=1e3,Bt=1001,Ms=1002,gt=1003,Ks=1004,Nr=1005,Nt=1006,cc=1007,Pi=1008,In=1009,uc=1010,dc=1011,Do=1012,hc=1013,Rn=1014,Pn=1015,Di=1016,fc=1017,pc=1018,oi=1020,mc=1021,Gt=1023,gc=1024,_c=1025,Dn=1026,di=1027,xc=1028,vc=1029,yc=1030,Sc=1031,Mc=1033,Or=33776,zr=33777,Ur=33778,Fr=33779,Zs=35840,Js=35841,Qs=35842,ea=35843,bc=36196,ta=37492,na=37496,ia=37808,ra=37809,sa=37810,aa=37811,oa=37812,la=37813,ca=37814,ua=37815,da=37816,ha=37817,fa=37818,pa=37819,ma=37820,ga=37821,Br=36492,wc=36283,_a=36284,xa=36285,va=36286,Nn=3e3,ke=3001,Ec=3200,Tc=3201,Cc=0,Ac=1,Xt="srgb",Ii="srgb-linear",Io="display-p3",Gr=7680,Lc=519,bs=35044,ya="300 es",ws=1035;class fi{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;const n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;const i=this._listeners[e];if(i!==void 0){const s=i.indexOf(t);s!==-1&&i.splice(s,1)}}dispatchEvent(e){if(this._listeners===void 0)return;const n=this._listeners[e.type];if(n!==void 0){e.target=this;const i=n.slice(0);for(let s=0,o=i.length;s<o;s++)i[s].call(this,e);e.target=null}}}const at=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],pr=Math.PI/180,Sa=180/Math.PI;function _n(){const r=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(at[r&255]+at[r>>8&255]+at[r>>16&255]+at[r>>24&255]+"-"+at[e&255]+at[e>>8&255]+"-"+at[e>>16&15|64]+at[e>>24&255]+"-"+at[t&63|128]+at[t>>8&255]+"-"+at[t>>16&255]+at[t>>24&255]+at[n&255]+at[n>>8&255]+at[n>>16&255]+at[n>>24&255]).toLowerCase()}function Ct(r,e,t){return Math.max(e,Math.min(t,r))}function Rc(r,e){return(r%e+e)%e}function kr(r,e,t){return(1-t)*r+t*e}function Ma(r){return(r&r-1)===0&&r!==0}function Pc(r){return Math.pow(2,Math.floor(Math.log(r)/Math.LN2))}function hn(r,e){switch(e.constructor){case Float32Array:return r;case Uint16Array:return r/65535;case Uint8Array:return r/255;case Int16Array:return Math.max(r/32767,-1);case Int8Array:return Math.max(r/127,-1);default:throw new Error("Invalid component type.")}}function Fe(r,e){switch(e.constructor){case Float32Array:return r;case Uint16Array:return Math.round(r*65535);case Uint8Array:return Math.round(r*255);case Int16Array:return Math.round(r*32767);case Int8Array:return Math.round(r*127);default:throw new Error("Invalid component type.")}}class De{constructor(e=0,t=0){De.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6],this.y=i[1]*t+i[4]*n+i[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),i=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*n-o*i+e.x,this.y=s*i+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class _t{constructor(){_t.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1]}set(e,t,n,i,s,o,a,l,c){const u=this.elements;return u[0]=e,u[1]=i,u[2]=a,u[3]=t,u[4]=s,u[5]=l,u[6]=n,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,s=this.elements,o=n[0],a=n[3],l=n[6],c=n[1],u=n[4],h=n[7],d=n[2],m=n[5],g=n[8],p=i[0],f=i[3],v=i[6],M=i[1],_=i[4],E=i[7],w=i[2],L=i[5],U=i[8];return s[0]=o*p+a*M+l*w,s[3]=o*f+a*_+l*L,s[6]=o*v+a*E+l*U,s[1]=c*p+u*M+h*w,s[4]=c*f+u*_+h*L,s[7]=c*v+u*E+h*U,s[2]=d*p+m*M+g*w,s[5]=d*f+m*_+g*L,s[8]=d*v+m*E+g*U,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-n*s*u+n*a*l+i*s*c-i*o*l}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=u*o-a*c,d=a*l-u*s,m=c*s-o*l,g=t*h+n*d+i*m;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);const p=1/g;return e[0]=h*p,e[1]=(i*c-u*n)*p,e[2]=(a*n-i*o)*p,e[3]=d*p,e[4]=(u*t-i*l)*p,e[5]=(i*s-a*t)*p,e[6]=m*p,e[7]=(n*l-c*t)*p,e[8]=(o*t-n*s)*p,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,i,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(n*l,n*c,-n*(l*o+c*a)+o+e,-i*c,i*l,-i*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(Vr.makeScale(e,t)),this}rotate(e){return this.premultiply(Vr.makeRotation(-e)),this}translate(e,t){return this.premultiply(Vr.makeTranslation(e,t)),this}makeTranslation(e,t){return this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<9;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const Vr=new _t;function No(r){for(let e=r.length-1;e>=0;--e)if(r[e]>=65535)return!0;return!1}function Sr(r){return document.createElementNS("http://www.w3.org/1999/xhtml",r)}class Oi{constructor(e=0,t=0,n=0,i=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=i}static slerpFlat(e,t,n,i,s,o,a){let l=n[i+0],c=n[i+1],u=n[i+2],h=n[i+3];const d=s[o+0],m=s[o+1],g=s[o+2],p=s[o+3];if(a===0){e[t+0]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h;return}if(a===1){e[t+0]=d,e[t+1]=m,e[t+2]=g,e[t+3]=p;return}if(h!==p||l!==d||c!==m||u!==g){let f=1-a;const v=l*d+c*m+u*g+h*p,M=v>=0?1:-1,_=1-v*v;if(_>Number.EPSILON){const w=Math.sqrt(_),L=Math.atan2(w,v*M);f=Math.sin(f*L)/w,a=Math.sin(a*L)/w}const E=a*M;if(l=l*f+d*E,c=c*f+m*E,u=u*f+g*E,h=h*f+p*E,f===1-a){const w=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=w,c*=w,u*=w,h*=w}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,n,i,s,o){const a=n[i],l=n[i+1],c=n[i+2],u=n[i+3],h=s[o],d=s[o+1],m=s[o+2],g=s[o+3];return e[t]=a*g+u*h+l*m-c*d,e[t+1]=l*g+u*d+c*h-a*m,e[t+2]=c*g+u*m+a*d-l*h,e[t+3]=u*g-a*h-l*d-c*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,i){return this._x=e,this._y=t,this._z=n,this._w=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t){const n=e._x,i=e._y,s=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(n/2),u=a(i/2),h=a(s/2),d=l(n/2),m=l(i/2),g=l(s/2);switch(o){case"XYZ":this._x=d*u*h+c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h-d*m*g;break;case"YXZ":this._x=d*u*h+c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h+d*m*g;break;case"ZXY":this._x=d*u*h-c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h-d*m*g;break;case"ZYX":this._x=d*u*h-c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h+d*m*g;break;case"YZX":this._x=d*u*h+c*m*g,this._y=c*m*h+d*u*g,this._z=c*u*g-d*m*h,this._w=c*u*h-d*m*g;break;case"XZY":this._x=d*u*h-c*m*g,this._y=c*m*h-d*u*g,this._z=c*u*g+d*m*h,this._w=c*u*h+d*m*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,i=Math.sin(n);return this._x=e.x*i,this._y=e.y*i,this._z=e.z*i,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],i=t[4],s=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],h=t[10],d=n+a+h;if(d>0){const m=.5/Math.sqrt(d+1);this._w=.25/m,this._x=(u-l)*m,this._y=(s-c)*m,this._z=(o-i)*m}else if(n>a&&n>h){const m=2*Math.sqrt(1+n-a-h);this._w=(u-l)/m,this._x=.25*m,this._y=(i+o)/m,this._z=(s+c)/m}else if(a>h){const m=2*Math.sqrt(1+a-n-h);this._w=(s-c)/m,this._x=(i+o)/m,this._y=.25*m,this._z=(l+u)/m}else{const m=2*Math.sqrt(1+h-n-a);this._w=(o-i)/m,this._x=(s+c)/m,this._y=(l+u)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ct(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const i=Math.min(1,t/n);return this.slerp(e,i),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,i=e._y,s=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=n*u+o*a+i*c-s*l,this._y=i*u+o*l+s*a-n*c,this._z=s*u+o*c+n*l-i*a,this._w=o*u-n*a-i*l-s*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,i=this._y,s=this._z,o=this._w;let a=o*e._w+n*e._x+i*e._y+s*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=i,this._z=s,this;const l=1-a*a;if(l<=Number.EPSILON){const m=1-t;return this._w=m*o+t*this._w,this._x=m*n+t*this._x,this._y=m*i+t*this._y,this._z=m*s+t*this._z,this.normalize(),this._onChangeCallback(),this}const c=Math.sqrt(l),u=Math.atan2(c,a),h=Math.sin((1-t)*u)/c,d=Math.sin(t*u)/c;return this._w=o*h+this._w*d,this._x=n*h+this._x*d,this._y=i*h+this._y*d,this._z=s*h+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=Math.random(),t=Math.sqrt(1-e),n=Math.sqrt(e),i=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(t*Math.cos(i),n*Math.sin(s),n*Math.cos(s),t*Math.sin(i))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class N{constructor(e=0,t=0,n=0){N.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ba.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ba.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*i,this.y=s[1]*t+s[4]*n+s[7]*i,this.z=s[2]*t+s[5]*n+s[8]*i,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,s=e.elements,o=1/(s[3]*t+s[7]*n+s[11]*i+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*i+s[12])*o,this.y=(s[1]*t+s[5]*n+s[9]*i+s[13])*o,this.z=(s[2]*t+s[6]*n+s[10]*i+s[14])*o,this}applyQuaternion(e){const t=this.x,n=this.y,i=this.z,s=e.x,o=e.y,a=e.z,l=e.w,c=l*t+o*i-a*n,u=l*n+a*t-s*i,h=l*i+s*n-o*t,d=-s*t-o*n-a*i;return this.x=c*l+d*-s+u*-a-h*-o,this.y=u*l+d*-o+h*-s-c*-a,this.z=h*l+d*-a+c*-o-u*-s,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,i=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*i,this.y=s[1]*t+s[5]*n+s[9]*i,this.z=s[2]*t+s[6]*n+s[10]*i,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,i=e.y,s=e.z,o=t.x,a=t.y,l=t.z;return this.x=i*l-s*a,this.y=s*o-n*l,this.z=n*a-i*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Hr.copy(this).projectOnVector(e),this.sub(Hr)}reflect(e){return this.sub(Hr.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ct(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,i=this.z-e.z;return t*t+n*n+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const i=Math.sin(t)*e;return this.x=i*Math.sin(n),this.y=Math.cos(t)*e,this.z=i*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),i=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=i,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,n=Math.sqrt(1-e**2);return this.x=n*Math.cos(t),this.y=n*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Hr=new N,ba=new Oi;function li(r){return r<.04045?r*.0773993808:Math.pow(r*.9478672986+.0521327014,2.4)}function Wr(r){return r<.0031308?r*12.92:1.055*Math.pow(r,.41666)-.055}const Dc=new _t().fromArray([.8224621,.0331941,.0170827,.177538,.9668058,.0723974,-1e-7,1e-7,.9105199]),Ic=new _t().fromArray([1.2249401,-.0420569,-.0196376,-.2249404,1.0420571,-.0786361,1e-7,0,1.0982735]),fn=new N;function Nc(r){return r.convertSRGBToLinear(),fn.set(r.r,r.g,r.b).applyMatrix3(Ic),r.setRGB(fn.x,fn.y,fn.z)}function Oc(r){return fn.set(r.r,r.g,r.b).applyMatrix3(Dc),r.setRGB(fn.x,fn.y,fn.z).convertLinearToSRGB()}const zc={[Ii]:r=>r,[Xt]:r=>r.convertSRGBToLinear(),[Io]:Nc},Uc={[Ii]:r=>r,[Xt]:r=>r.convertLinearToSRGB(),[Io]:Oc},ft={enabled:!1,get legacyMode(){return console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),!this.enabled},set legacyMode(r){console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),this.enabled=!r},get workingColorSpace(){return Ii},set workingColorSpace(r){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(r,e,t){if(this.enabled===!1||e===t||!e||!t)return r;const n=zc[e],i=Uc[t];if(n===void 0||i===void 0)throw new Error(`Unsupported color space conversion, "${e}" to "${t}".`);return i(n(r))},fromWorkingColorSpace:function(r,e){return this.convert(r,this.workingColorSpace,e)},toWorkingColorSpace:function(r,e){return this.convert(r,e,this.workingColorSpace)}};let kn;class Oo{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{kn===void 0&&(kn=Sr("canvas")),kn.width=e.width,kn.height=e.height;const n=kn.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=kn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Sr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const i=n.getImageData(0,0,e.width,e.height),s=i.data;for(let o=0;o<s.length;o++)s[o]=li(s[o]/255)*255;return n.putImageData(i,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(li(t[n]/255)*255):t[n]=li(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}class zo{constructor(e=null){this.isSource=!0,this.uuid=_n(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},i=this.data;if(i!==null){let s;if(Array.isArray(i)){s=[];for(let o=0,a=i.length;o<a;o++)i[o].isDataTexture?s.push(jr(i[o].image)):s.push(jr(i[o]))}else s=jr(i);n.url=s}return t||(e.images[this.uuid]=n),n}}function jr(r){return typeof HTMLImageElement<"u"&&r instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&r instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&r instanceof ImageBitmap?Oo.getDataURL(r):r.data?{data:Array.from(r.data),width:r.width,height:r.height,type:r.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Fc=0;class yt extends fi{constructor(e=yt.DEFAULT_IMAGE,t=yt.DEFAULT_MAPPING,n=Bt,i=Bt,s=Nt,o=Pi,a=Gt,l=In,c=yt.DEFAULT_ANISOTROPY,u=Nn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Fc++}),this.uuid=_n(),this.name="",this.source=new zo(e),this.mipmaps=[],this.mapping=t,this.wrapS=n,this.wrapT=i,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new De(0,0),this.repeat=new De(1,1),this.center=new De(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new _t,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.encoding=u,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.encoding=e.encoding,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.5,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,encoding:this.encoding,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Po)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Ss:e.x=e.x-Math.floor(e.x);break;case Bt:e.x=e.x<0?0:1;break;case Ms:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Ss:e.y=e.y-Math.floor(e.y);break;case Bt:e.y=e.y<0?0:1;break;case Ms:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}}yt.DEFAULT_IMAGE=null;yt.DEFAULT_MAPPING=Po;yt.DEFAULT_ANISOTROPY=1;class st{constructor(e=0,t=0,n=0,i=1){st.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=i}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,i){return this.x=e,this.y=t,this.z=n,this.w=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,i=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*i+o[12]*s,this.y=o[1]*t+o[5]*n+o[9]*i+o[13]*s,this.z=o[2]*t+o[6]*n+o[10]*i+o[14]*s,this.w=o[3]*t+o[7]*n+o[11]*i+o[15]*s,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,i,s;const l=e.elements,c=l[0],u=l[4],h=l[8],d=l[1],m=l[5],g=l[9],p=l[2],f=l[6],v=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-p)<.01&&Math.abs(g-f)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+p)<.1&&Math.abs(g+f)<.1&&Math.abs(c+m+v-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const _=(c+1)/2,E=(m+1)/2,w=(v+1)/2,L=(u+d)/4,U=(h+p)/4,y=(g+f)/4;return _>E&&_>w?_<.01?(n=0,i=.707106781,s=.707106781):(n=Math.sqrt(_),i=L/n,s=U/n):E>w?E<.01?(n=.707106781,i=0,s=.707106781):(i=Math.sqrt(E),n=L/i,s=y/i):w<.01?(n=.707106781,i=.707106781,s=0):(s=Math.sqrt(w),n=U/s,i=y/s),this.set(n,i,s,t),this}let M=Math.sqrt((f-g)*(f-g)+(h-p)*(h-p)+(d-u)*(d-u));return Math.abs(M)<.001&&(M=1),this.x=(f-g)/M,this.y=(h-p)/M,this.z=(d-u)/M,this.w=Math.acos((c+m+v-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(e,Math.min(t,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class On extends fi{constructor(e=1,t=1,n={}){super(),this.isWebGLRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new st(0,0,e,t),this.scissorTest=!1,this.viewport=new st(0,0,e,t);const i={width:e,height:t,depth:1};this.texture=new yt(i,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.encoding),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=n.generateMipmaps!==void 0?n.generateMipmaps:!1,this.texture.internalFormat=n.internalFormat!==void 0?n.internalFormat:null,this.texture.minFilter=n.minFilter!==void 0?n.minFilter:Nt,this.depthBuffer=n.depthBuffer!==void 0?n.depthBuffer:!0,this.stencilBuffer=n.stencilBuffer!==void 0?n.stencilBuffer:!1,this.depthTexture=n.depthTexture!==void 0?n.depthTexture:null,this.samples=n.samples!==void 0?n.samples:0}setSize(e,t,n=1){(this.width!==e||this.height!==t||this.depth!==n)&&(this.width=e,this.height=t,this.depth=n,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=n,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},e.texture.image);return this.texture.source=new zo(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Uo extends yt{constructor(e=null,t=1,n=1,i=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=gt,this.minFilter=gt,this.wrapR=Bt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Bc extends yt{constructor(e=null,t=1,n=1,i=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:i},this.magFilter=gt,this.minFilter=gt,this.wrapR=Bt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class zi{constructor(e=new N(1/0,1/0,1/0),t=new N(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){let t=1/0,n=1/0,i=1/0,s=-1/0,o=-1/0,a=-1/0;for(let l=0,c=e.length;l<c;l+=3){const u=e[l],h=e[l+1],d=e[l+2];u<t&&(t=u),h<n&&(n=h),d<i&&(i=d),u>s&&(s=u),h>o&&(o=h),d>a&&(a=d)}return this.min.set(t,n,i),this.max.set(s,o,a),this}setFromBufferAttribute(e){let t=1/0,n=1/0,i=1/0,s=-1/0,o=-1/0,a=-1/0;for(let l=0,c=e.count;l<c;l++){const u=e.getX(l),h=e.getY(l),d=e.getZ(l);u<t&&(t=u),h<n&&(n=h),d<i&&(i=d),u>s&&(s=u),h>o&&(o=h),d>a&&(a=d)}return this.min.set(t,n,i),this.max.set(s,o,a),this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=Mn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0)if(t&&n.attributes!=null&&n.attributes.position!==void 0){const s=n.attributes.position;for(let o=0,a=s.count;o<a;o++)Mn.fromBufferAttribute(s,o).applyMatrix4(e.matrixWorld),this.expandByPoint(Mn)}else n.boundingBox===null&&n.computeBoundingBox(),qr.copy(n.boundingBox),qr.applyMatrix4(e.matrixWorld),this.union(qr);const i=e.children;for(let s=0,o=i.length;s<o;s++)this.expandByObject(i[s],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Mn),Mn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(xi),Gi.subVectors(this.max,xi),Vn.subVectors(e.a,xi),Hn.subVectors(e.b,xi),Wn.subVectors(e.c,xi),on.subVectors(Hn,Vn),ln.subVectors(Wn,Hn),bn.subVectors(Vn,Wn);let t=[0,-on.z,on.y,0,-ln.z,ln.y,0,-bn.z,bn.y,on.z,0,-on.x,ln.z,0,-ln.x,bn.z,0,-bn.x,-on.y,on.x,0,-ln.y,ln.x,0,-bn.y,bn.x,0];return!Xr(t,Vn,Hn,Wn,Gi)||(t=[1,0,0,0,1,0,0,0,1],!Xr(t,Vn,Hn,Wn,Gi))?!1:(ki.crossVectors(on,ln),t=[ki.x,ki.y,ki.z],Xr(t,Vn,Hn,Wn,Gi))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Mn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Mn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Zt[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Zt[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Zt[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Zt[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Zt[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Zt[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Zt[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Zt[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Zt),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const Zt=[new N,new N,new N,new N,new N,new N,new N,new N],Mn=new N,qr=new zi,Vn=new N,Hn=new N,Wn=new N,on=new N,ln=new N,bn=new N,xi=new N,Gi=new N,ki=new N,wn=new N;function Xr(r,e,t,n,i){for(let s=0,o=r.length-3;s<=o;s+=3){wn.fromArray(r,s);const a=i.x*Math.abs(wn.x)+i.y*Math.abs(wn.y)+i.z*Math.abs(wn.z),l=e.dot(wn),c=t.dot(wn),u=n.dot(wn);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const Gc=new zi,vi=new N,Yr=new N;class Ui{constructor(e=new N,t=-1){this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Gc.setFromPoints(e).getCenter(n);let i=0;for(let s=0,o=e.length;s<o;s++)i=Math.max(i,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(i),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;vi.subVectors(e,this.center);const t=vi.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),i=(n-this.radius)*.5;this.center.addScaledVector(vi,i/n),this.radius+=i}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Yr.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(vi.copy(e.center).add(Yr)),this.expandByPoint(vi.copy(e.center).sub(Yr))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Jt=new N,$r=new N,Vi=new N,cn=new N,Kr=new N,Hi=new N,Zr=new N;class Ls{constructor(e=new N,t=new N(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Jt)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Jt.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Jt.copy(this.origin).addScaledVector(this.direction,t),Jt.distanceToSquared(e))}distanceSqToSegment(e,t,n,i){$r.copy(e).add(t).multiplyScalar(.5),Vi.copy(t).sub(e).normalize(),cn.copy(this.origin).sub($r);const s=e.distanceTo(t)*.5,o=-this.direction.dot(Vi),a=cn.dot(this.direction),l=-cn.dot(Vi),c=cn.lengthSq(),u=Math.abs(1-o*o);let h,d,m,g;if(u>0)if(h=o*l-a,d=o*a-l,g=s*u,h>=0)if(d>=-g)if(d<=g){const p=1/u;h*=p,d*=p,m=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=s,h=Math.max(0,-(o*d+a)),m=-h*h+d*(d+2*l)+c;else d=-s,h=Math.max(0,-(o*d+a)),m=-h*h+d*(d+2*l)+c;else d<=-g?(h=Math.max(0,-(-o*s+a)),d=h>0?-s:Math.min(Math.max(-s,-l),s),m=-h*h+d*(d+2*l)+c):d<=g?(h=0,d=Math.min(Math.max(-s,-l),s),m=d*(d+2*l)+c):(h=Math.max(0,-(o*s+a)),d=h>0?s:Math.min(Math.max(-s,-l),s),m=-h*h+d*(d+2*l)+c);else d=o>0?-s:s,h=Math.max(0,-(o*d+a)),m=-h*h+d*(d+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,h),i&&i.copy($r).addScaledVector(Vi,d),m}intersectSphere(e,t){Jt.subVectors(e.center,this.origin);const n=Jt.dot(this.direction),i=Jt.dot(Jt)-n*n,s=e.radius*e.radius;if(i>s)return null;const o=Math.sqrt(s-i),a=n-o,l=n+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,i,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,i=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,i=(e.min.x-d.x)*c),u>=0?(s=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),n>o||s>i||((s>n||isNaN(n))&&(n=s),(o<i||isNaN(i))&&(i=o),h>=0?(a=(e.min.z-d.z)*h,l=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,l=(e.min.z-d.z)*h),n>l||a>i)||((a>n||n!==n)&&(n=a),(l<i||i!==i)&&(i=l),i<0)?null:this.at(n>=0?n:i,t)}intersectsBox(e){return this.intersectBox(e,Jt)!==null}intersectTriangle(e,t,n,i,s){Kr.subVectors(t,e),Hi.subVectors(n,e),Zr.crossVectors(Kr,Hi);let o=this.direction.dot(Zr),a;if(o>0){if(i)return null;a=1}else if(o<0)a=-1,o=-o;else return null;cn.subVectors(this.origin,e);const l=a*this.direction.dot(Hi.crossVectors(cn,Hi));if(l<0)return null;const c=a*this.direction.dot(Kr.cross(cn));if(c<0||l+c>o)return null;const u=-a*cn.dot(Zr);return u<0?null:this.at(u/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class He{constructor(){He.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}set(e,t,n,i,s,o,a,l,c,u,h,d,m,g,p,f){const v=this.elements;return v[0]=e,v[4]=t,v[8]=n,v[12]=i,v[1]=s,v[5]=o,v[9]=a,v[13]=l,v[2]=c,v[6]=u,v[10]=h,v[14]=d,v[3]=m,v[7]=g,v[11]=p,v[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new He().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,i=1/jn.setFromMatrixColumn(e,0).length(),s=1/jn.setFromMatrixColumn(e,1).length(),o=1/jn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*i,t[1]=n[1]*i,t[2]=n[2]*i,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,i=e.y,s=e.z,o=Math.cos(n),a=Math.sin(n),l=Math.cos(i),c=Math.sin(i),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){const d=o*u,m=o*h,g=a*u,p=a*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=m+g*c,t[5]=d-p*c,t[9]=-a*l,t[2]=p-d*c,t[6]=g+m*c,t[10]=o*l}else if(e.order==="YXZ"){const d=l*u,m=l*h,g=c*u,p=c*h;t[0]=d+p*a,t[4]=g*a-m,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=m*a-g,t[6]=p+d*a,t[10]=o*l}else if(e.order==="ZXY"){const d=l*u,m=l*h,g=c*u,p=c*h;t[0]=d-p*a,t[4]=-o*h,t[8]=g+m*a,t[1]=m+g*a,t[5]=o*u,t[9]=p-d*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const d=o*u,m=o*h,g=a*u,p=a*h;t[0]=l*u,t[4]=g*c-m,t[8]=d*c+p,t[1]=l*h,t[5]=p*c+d,t[9]=m*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const d=o*l,m=o*c,g=a*l,p=a*c;t[0]=l*u,t[4]=p-d*h,t[8]=g*h+m,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=m*h+g,t[10]=d-p*h}else if(e.order==="XZY"){const d=o*l,m=o*c,g=a*l,p=a*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=d*h+p,t[5]=o*u,t[9]=m*h-g,t[2]=g*h-m,t[6]=a*u,t[10]=p*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(kc,e,Vc)}lookAt(e,t,n){const i=this.elements;return wt.subVectors(e,t),wt.lengthSq()===0&&(wt.z=1),wt.normalize(),un.crossVectors(n,wt),un.lengthSq()===0&&(Math.abs(n.z)===1?wt.x+=1e-4:wt.z+=1e-4,wt.normalize(),un.crossVectors(n,wt)),un.normalize(),Wi.crossVectors(wt,un),i[0]=un.x,i[4]=Wi.x,i[8]=wt.x,i[1]=un.y,i[5]=Wi.y,i[9]=wt.y,i[2]=un.z,i[6]=Wi.z,i[10]=wt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,i=t.elements,s=this.elements,o=n[0],a=n[4],l=n[8],c=n[12],u=n[1],h=n[5],d=n[9],m=n[13],g=n[2],p=n[6],f=n[10],v=n[14],M=n[3],_=n[7],E=n[11],w=n[15],L=i[0],U=i[4],y=i[8],T=i[12],F=i[1],D=i[5],Y=i[9],I=i[13],P=i[2],V=i[6],$=i[10],Q=i[14],q=i[3],K=i[7],ee=i[11],pe=i[15];return s[0]=o*L+a*F+l*P+c*q,s[4]=o*U+a*D+l*V+c*K,s[8]=o*y+a*Y+l*$+c*ee,s[12]=o*T+a*I+l*Q+c*pe,s[1]=u*L+h*F+d*P+m*q,s[5]=u*U+h*D+d*V+m*K,s[9]=u*y+h*Y+d*$+m*ee,s[13]=u*T+h*I+d*Q+m*pe,s[2]=g*L+p*F+f*P+v*q,s[6]=g*U+p*D+f*V+v*K,s[10]=g*y+p*Y+f*$+v*ee,s[14]=g*T+p*I+f*Q+v*pe,s[3]=M*L+_*F+E*P+w*q,s[7]=M*U+_*D+E*V+w*K,s[11]=M*y+_*Y+E*$+w*ee,s[15]=M*T+_*I+E*Q+w*pe,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],i=e[8],s=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],h=e[6],d=e[10],m=e[14],g=e[3],p=e[7],f=e[11],v=e[15];return g*(+s*l*h-i*c*h-s*a*d+n*c*d+i*a*m-n*l*m)+p*(+t*l*m-t*c*d+s*o*d-i*o*m+i*c*u-s*l*u)+f*(+t*c*h-t*a*m-s*o*h+n*o*m+s*a*u-n*c*u)+v*(-i*a*u-t*l*h+t*a*d+i*o*h-n*o*d+n*l*u)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const i=this.elements;return e.isVector3?(i[12]=e.x,i[13]=e.y,i[14]=e.z):(i[12]=e,i[13]=t,i[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],i=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=e[9],d=e[10],m=e[11],g=e[12],p=e[13],f=e[14],v=e[15],M=h*f*c-p*d*c+p*l*m-a*f*m-h*l*v+a*d*v,_=g*d*c-u*f*c-g*l*m+o*f*m+u*l*v-o*d*v,E=u*p*c-g*h*c+g*a*m-o*p*m-u*a*v+o*h*v,w=g*h*l-u*p*l-g*a*d+o*p*d+u*a*f-o*h*f,L=t*M+n*_+i*E+s*w;if(L===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const U=1/L;return e[0]=M*U,e[1]=(p*d*s-h*f*s-p*i*m+n*f*m+h*i*v-n*d*v)*U,e[2]=(a*f*s-p*l*s+p*i*c-n*f*c-a*i*v+n*l*v)*U,e[3]=(h*l*s-a*d*s-h*i*c+n*d*c+a*i*m-n*l*m)*U,e[4]=_*U,e[5]=(u*f*s-g*d*s+g*i*m-t*f*m-u*i*v+t*d*v)*U,e[6]=(g*l*s-o*f*s-g*i*c+t*f*c+o*i*v-t*l*v)*U,e[7]=(o*d*s-u*l*s+u*i*c-t*d*c-o*i*m+t*l*m)*U,e[8]=E*U,e[9]=(g*h*s-u*p*s-g*n*m+t*p*m+u*n*v-t*h*v)*U,e[10]=(o*p*s-g*a*s+g*n*c-t*p*c-o*n*v+t*a*v)*U,e[11]=(u*a*s-o*h*s-u*n*c+t*h*c+o*n*m-t*a*m)*U,e[12]=w*U,e[13]=(u*p*i-g*h*i+g*n*d-t*p*d-u*n*f+t*h*f)*U,e[14]=(g*a*i-o*p*i-g*n*l+t*p*l+o*n*f-t*a*f)*U,e[15]=(o*h*i-u*a*i+u*n*l-t*h*l-o*n*d+t*a*d)*U,this}scale(e){const t=this.elements,n=e.x,i=e.y,s=e.z;return t[0]*=n,t[4]*=i,t[8]*=s,t[1]*=n,t[5]*=i,t[9]*=s,t[2]*=n,t[6]*=i,t[10]*=s,t[3]*=n,t[7]*=i,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],i=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,i))}makeTranslation(e,t,n){return this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),i=Math.sin(t),s=1-n,o=e.x,a=e.y,l=e.z,c=s*o,u=s*a;return this.set(c*o+n,c*a-i*l,c*l+i*a,0,c*a+i*l,u*a+n,u*l-i*o,0,c*l-i*a,u*l+i*o,s*l*l+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,i,s,o){return this.set(1,n,s,0,e,1,o,0,t,i,1,0,0,0,0,1),this}compose(e,t,n){const i=this.elements,s=t._x,o=t._y,a=t._z,l=t._w,c=s+s,u=o+o,h=a+a,d=s*c,m=s*u,g=s*h,p=o*u,f=o*h,v=a*h,M=l*c,_=l*u,E=l*h,w=n.x,L=n.y,U=n.z;return i[0]=(1-(p+v))*w,i[1]=(m+E)*w,i[2]=(g-_)*w,i[3]=0,i[4]=(m-E)*L,i[5]=(1-(d+v))*L,i[6]=(f+M)*L,i[7]=0,i[8]=(g+_)*U,i[9]=(f-M)*U,i[10]=(1-(d+p))*U,i[11]=0,i[12]=e.x,i[13]=e.y,i[14]=e.z,i[15]=1,this}decompose(e,t,n){const i=this.elements;let s=jn.set(i[0],i[1],i[2]).length();const o=jn.set(i[4],i[5],i[6]).length(),a=jn.set(i[8],i[9],i[10]).length();this.determinant()<0&&(s=-s),e.x=i[12],e.y=i[13],e.z=i[14],zt.copy(this);const c=1/s,u=1/o,h=1/a;return zt.elements[0]*=c,zt.elements[1]*=c,zt.elements[2]*=c,zt.elements[4]*=u,zt.elements[5]*=u,zt.elements[6]*=u,zt.elements[8]*=h,zt.elements[9]*=h,zt.elements[10]*=h,t.setFromRotationMatrix(zt),n.x=s,n.y=o,n.z=a,this}makePerspective(e,t,n,i,s,o){const a=this.elements,l=2*s/(t-e),c=2*s/(n-i),u=(t+e)/(t-e),h=(n+i)/(n-i),d=-(o+s)/(o-s),m=-2*o*s/(o-s);return a[0]=l,a[4]=0,a[8]=u,a[12]=0,a[1]=0,a[5]=c,a[9]=h,a[13]=0,a[2]=0,a[6]=0,a[10]=d,a[14]=m,a[3]=0,a[7]=0,a[11]=-1,a[15]=0,this}makeOrthographic(e,t,n,i,s,o){const a=this.elements,l=1/(t-e),c=1/(n-i),u=1/(o-s),h=(t+e)*l,d=(n+i)*c,m=(o+s)*u;return a[0]=2*l,a[4]=0,a[8]=0,a[12]=-h,a[1]=0,a[5]=2*c,a[9]=0,a[13]=-d,a[2]=0,a[6]=0,a[10]=-2*u,a[14]=-m,a[3]=0,a[7]=0,a[11]=0,a[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let i=0;i<16;i++)if(t[i]!==n[i])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const jn=new N,zt=new He,kc=new N(0,0,0),Vc=new N(1,1,1),un=new N,Wi=new N,wt=new N,wa=new He,Ea=new Oi;class Cr{constructor(e=0,t=0,n=0,i=Cr.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,i=this._order){return this._x=e,this._y=t,this._z=n,this._order=i,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const i=e.elements,s=i[0],o=i[4],a=i[8],l=i[1],c=i[5],u=i[9],h=i[2],d=i[6],m=i[10];switch(t){case"XYZ":this._y=Math.asin(Ct(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,m),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Ct(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,m),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ct(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,m),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-Ct(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,m),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Ct(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,m));break;case"XZY":this._z=Math.asin(-Ct(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return wa.makeRotationFromQuaternion(e),this.setFromRotationMatrix(wa,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Ea.setFromEuler(this),this.setFromQuaternion(Ea,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Cr.DEFAULT_ORDER="XYZ";class Fo{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Hc=0;const Ta=new N,qn=new Oi,Qt=new He,ji=new N,yi=new N,Wc=new N,jc=new Oi,Ca=new N(1,0,0),Aa=new N(0,1,0),La=new N(0,0,1),qc={type:"added"},Ra={type:"removed"};class $e extends fi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Hc++}),this.uuid=_n(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=$e.DEFAULT_UP.clone();const e=new N,t=new Cr,n=new Oi,i=new N(1,1,1);function s(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new He},normalMatrix:{value:new _t}}),this.matrix=new He,this.matrixWorld=new He,this.matrixAutoUpdate=$e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=$e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.layers=new Fo,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return qn.setFromAxisAngle(e,t),this.quaternion.multiply(qn),this}rotateOnWorldAxis(e,t){return qn.setFromAxisAngle(e,t),this.quaternion.premultiply(qn),this}rotateX(e){return this.rotateOnAxis(Ca,e)}rotateY(e){return this.rotateOnAxis(Aa,e)}rotateZ(e){return this.rotateOnAxis(La,e)}translateOnAxis(e,t){return Ta.copy(e).applyQuaternion(this.quaternion),this.position.add(Ta.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(Ca,e)}translateY(e){return this.translateOnAxis(Aa,e)}translateZ(e){return this.translateOnAxis(La,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?ji.copy(e):ji.set(e,t,n);const i=this.parent;this.updateWorldMatrix(!0,!1),yi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qt.lookAt(yi,ji,this.up):Qt.lookAt(ji,yi,this.up),this.quaternion.setFromRotationMatrix(Qt),i&&(Qt.extractRotation(i.matrixWorld),qn.setFromRotationMatrix(Qt),this.quaternion.premultiply(qn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(qc)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ra)),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){for(let e=0;e<this.children.length;e++){const t=this.children[e];t.parent=null,t.dispatchEvent(Ra)}return this.children.length=0,this}attach(e){return this.updateWorldMatrix(!0,!1),Qt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qt.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qt),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,i=this.children.length;n<i;n++){const o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t){let n=[];this[e]===t&&n.push(this);for(let i=0,s=this.children.length;i<s;i++){const o=this.children[i].getObjectsByProperty(e,t);o.length>0&&(n=n.concat(o))}return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yi,e,Wc),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(yi,jc,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,i=t.length;n<i;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,i=t.length;n<i;n++){const s=t[n];(s.matrixWorldAutoUpdate===!0||e===!0)&&s.updateMatrixWorld(e)}}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const i=this.children;for(let s=0,o=i.length;s<o;s++){const a=i[s];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.5,type:"Object",generator:"Object3D.toJSON"});const i={};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.castShadow===!0&&(i.castShadow=!0),this.receiveShadow===!0&&(i.receiveShadow=!0),this.visible===!1&&(i.visible=!1),this.frustumCulled===!1&&(i.frustumCulled=!1),this.renderOrder!==0&&(i.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(i.userData=this.userData),i.layers=this.layers.mask,i.matrix=this.matrix.toArray(),this.matrixAutoUpdate===!1&&(i.matrixAutoUpdate=!1),this.isInstancedMesh&&(i.type="InstancedMesh",i.count=this.count,i.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(i.instanceColor=this.instanceColor.toJSON()));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?i.background=this.background.toJSON():this.background.isTexture&&(i.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(i.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){i.geometry=s(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];s(e.shapes,h)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(i.bindMode=this.bindMode,i.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),i.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(e.materials,this.material[l]));i.material=a}else i.material=s(e.materials,this.material);if(this.children.length>0){i.children=[];for(let a=0;a<this.children.length;a++)i.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){i.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];i.animations.push(s(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),m=o(e.animations),g=o(e.nodes);a.length>0&&(n.geometries=a),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),u.length>0&&(n.images=u),h.length>0&&(n.shapes=h),d.length>0&&(n.skeletons=d),m.length>0&&(n.animations=m),g.length>0&&(n.nodes=g)}return n.object=i,n;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const i=e.children[n];this.add(i.clone())}return this}}$e.DEFAULT_UP=new N(0,1,0);$e.DEFAULT_MATRIX_AUTO_UPDATE=!0;$e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ut=new N,en=new N,Jr=new N,tn=new N,Xn=new N,Yn=new N,Pa=new N,Qr=new N,es=new N,ts=new N;class kt{constructor(e=new N,t=new N,n=new N){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,i){i.subVectors(n,t),Ut.subVectors(e,t),i.cross(Ut);const s=i.lengthSq();return s>0?i.multiplyScalar(1/Math.sqrt(s)):i.set(0,0,0)}static getBarycoord(e,t,n,i,s){Ut.subVectors(i,t),en.subVectors(n,t),Jr.subVectors(e,t);const o=Ut.dot(Ut),a=Ut.dot(en),l=Ut.dot(Jr),c=en.dot(en),u=en.dot(Jr),h=o*c-a*a;if(h===0)return s.set(-2,-1,-1);const d=1/h,m=(c*l-a*u)*d,g=(o*u-a*l)*d;return s.set(1-m-g,g,m)}static containsPoint(e,t,n,i){return this.getBarycoord(e,t,n,i,tn),tn.x>=0&&tn.y>=0&&tn.x+tn.y<=1}static getUV(e,t,n,i,s,o,a,l){return this.getBarycoord(e,t,n,i,tn),l.set(0,0),l.addScaledVector(s,tn.x),l.addScaledVector(o,tn.y),l.addScaledVector(a,tn.z),l}static isFrontFacing(e,t,n,i){return Ut.subVectors(n,t),en.subVectors(e,t),Ut.cross(en).dot(i)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,i){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[i]),this}setFromAttributeAndIndices(e,t,n,i){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,i),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ut.subVectors(this.c,this.b),en.subVectors(this.a,this.b),Ut.cross(en).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return kt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return kt.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,n,i,s){return kt.getUV(e,this.a,this.b,this.c,t,n,i,s)}containsPoint(e){return kt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return kt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,i=this.b,s=this.c;let o,a;Xn.subVectors(i,n),Yn.subVectors(s,n),Qr.subVectors(e,n);const l=Xn.dot(Qr),c=Yn.dot(Qr);if(l<=0&&c<=0)return t.copy(n);es.subVectors(e,i);const u=Xn.dot(es),h=Yn.dot(es);if(u>=0&&h<=u)return t.copy(i);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(n).addScaledVector(Xn,o);ts.subVectors(e,s);const m=Xn.dot(ts),g=Yn.dot(ts);if(g>=0&&m<=g)return t.copy(s);const p=m*c-l*g;if(p<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(n).addScaledVector(Yn,a);const f=u*g-m*h;if(f<=0&&h-u>=0&&m-g>=0)return Pa.subVectors(s,i),a=(h-u)/(h-u+(m-g)),t.copy(i).addScaledVector(Pa,a);const v=1/(f+p+d);return o=p*v,a=d*v,t.copy(n).addScaledVector(Xn,o).addScaledVector(Yn,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}let Xc=0;class Un extends fi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Xc++}),this.uuid=_n(),this.name="",this.type="Material",this.blending=ai,this.side=xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=Ao,this.blendDst=Lo,this.blendEquation=ri,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=xs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Lc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Gr,this.stencilZFail=Gr,this.stencilZPass=Gr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn("THREE.Material: '"+t+"' parameter is undefined.");continue}const i=this[t];if(i===void 0){console.warn("THREE."+this.type+": '"+t+"' is not a property of this material.");continue}i&&i.isColor?i.set(n):i&&i.isVector3&&n&&n.isVector3?i.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.5,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ai&&(n.blending=this.blending),this.side!==xn&&(n.side=this.side),this.vertexColors&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=this.transparent),n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.stencilWrite=this.stencilWrite,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(n.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=this.premultipliedAlpha),this.forceSinglePass===!0&&(n.forceSinglePass=this.forceSinglePass),this.wireframe===!0&&(n.wireframe=this.wireframe),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=this.flatShading),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function i(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(t){const s=i(e.textures),o=i(e.images);s.length>0&&(n.textures=s),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const i=t.length;n=new Array(i);for(let s=0;s!==i;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Bo={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ft={h:0,s:0,l:0},qi={h:0,s:0,l:0};function ns(r,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?r+(e-r)*6*t:t<1/2?e:t<2/3?r+(e-r)*6*(2/3-t):r}class ze{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,t===void 0&&n===void 0?this.set(e):this.setRGB(e,t,n)}set(e){return e&&e.isColor?this.copy(e):typeof e=="number"?this.setHex(e):typeof e=="string"&&this.setStyle(e),this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ft.toWorkingColorSpace(this,t),this}setRGB(e,t,n,i=ft.workingColorSpace){return this.r=e,this.g=t,this.b=n,ft.toWorkingColorSpace(this,i),this}setHSL(e,t,n,i=ft.workingColorSpace){if(e=Rc(e,1),t=Ct(t,0,1),n=Ct(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,o=2*n-s;this.r=ns(o,s,e+1/3),this.g=ns(o,s,e),this.b=ns(o,s,e-1/3)}return ft.toWorkingColorSpace(this,i),this}setStyle(e,t=Xt){function n(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let i;if(i=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const o=i[1],a=i[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(255,parseInt(s[1],10))/255,this.g=Math.min(255,parseInt(s[2],10))/255,this.b=Math.min(255,parseInt(s[3],10))/255,ft.toWorkingColorSpace(this,t),n(s[4]),this;if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return this.r=Math.min(100,parseInt(s[1],10))/100,this.g=Math.min(100,parseInt(s[2],10))/100,this.b=Math.min(100,parseInt(s[3],10))/100,ft.toWorkingColorSpace(this,t),n(s[4]),this;break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a)){const l=parseFloat(s[1])/360,c=parseFloat(s[2])/100,u=parseFloat(s[3])/100;return n(s[4]),this.setHSL(l,c,u,t)}break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(i=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=i[1],o=s.length;if(o===3)return this.r=parseInt(s.charAt(0)+s.charAt(0),16)/255,this.g=parseInt(s.charAt(1)+s.charAt(1),16)/255,this.b=parseInt(s.charAt(2)+s.charAt(2),16)/255,ft.toWorkingColorSpace(this,t),this;if(o===6)return this.r=parseInt(s.charAt(0)+s.charAt(1),16)/255,this.g=parseInt(s.charAt(2)+s.charAt(3),16)/255,this.b=parseInt(s.charAt(4)+s.charAt(5),16)/255,ft.toWorkingColorSpace(this,t),this;console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Xt){const n=Bo[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=li(e.r),this.g=li(e.g),this.b=li(e.b),this}copyLinearToSRGB(e){return this.r=Wr(e.r),this.g=Wr(e.g),this.b=Wr(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Xt){return ft.fromWorkingColorSpace(ot.copy(this),e),Ct(ot.r*255,0,255)<<16^Ct(ot.g*255,0,255)<<8^Ct(ot.b*255,0,255)<<0}getHexString(e=Xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ft.workingColorSpace){ft.fromWorkingColorSpace(ot.copy(this),t);const n=ot.r,i=ot.g,s=ot.b,o=Math.max(n,i,s),a=Math.min(n,i,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case n:l=(i-s)/h+(i<s?6:0);break;case i:l=(s-n)/h+2;break;case s:l=(n-i)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=ft.workingColorSpace){return ft.fromWorkingColorSpace(ot.copy(this),t),e.r=ot.r,e.g=ot.g,e.b=ot.b,e}getStyle(e=Xt){ft.fromWorkingColorSpace(ot.copy(this),e);const t=ot.r,n=ot.g,i=ot.b;return e!==Xt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${i.toFixed(3)})`:`rgb(${t*255|0},${n*255|0},${i*255|0})`}offsetHSL(e,t,n){return this.getHSL(Ft),Ft.h+=e,Ft.s+=t,Ft.l+=n,this.setHSL(Ft.h,Ft.s,Ft.l),this}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Ft),e.getHSL(qi);const n=kr(Ft.h,qi.h,t),i=kr(Ft.s,qi.s,t),s=kr(Ft.l,qi.l,t);return this.setHSL(n,i,s),this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const ot=new ze;ze.NAMES=Bo;class Go extends Un{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ze(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Ro,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const Xe=new N,Xi=new De;class Lt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=bs,this.updateRange={offset:0,count:-1},this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let i=0,s=this.itemSize;i<s;i++)this.array[e+i]=t.array[n+i];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Xi.fromBufferAttribute(this,t),Xi.applyMatrix3(e),this.setXY(t,Xi.x,Xi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Xe.fromBufferAttribute(this,t),Xe.applyMatrix3(e),this.setXYZ(t,Xe.x,Xe.y,Xe.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Xe.fromBufferAttribute(this,t),Xe.applyMatrix4(e),this.setXYZ(t,Xe.x,Xe.y,Xe.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Xe.fromBufferAttribute(this,t),Xe.applyNormalMatrix(e),this.setXYZ(t,Xe.x,Xe.y,Xe.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Xe.fromBufferAttribute(this,t),Xe.transformDirection(e),this.setXYZ(t,Xe.x,Xe.y,Xe.z);return this}set(e,t=0){return this.array.set(e,t),this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=hn(t,this.array)),t}setX(e,t){return this.normalized&&(t=Fe(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=hn(t,this.array)),t}setY(e,t){return this.normalized&&(t=Fe(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=hn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Fe(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=hn(t,this.array)),t}setW(e,t){return this.normalized&&(t=Fe(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Fe(t,this.array),n=Fe(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,i){return e*=this.itemSize,this.normalized&&(t=Fe(t,this.array),n=Fe(n,this.array),i=Fe(i,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e*=this.itemSize,this.normalized&&(t=Fe(t,this.array),n=Fe(n,this.array),i=Fe(i,this.array),s=Fe(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=i,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==bs&&(e.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(e.updateRange=this.updateRange),e}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class ko extends Lt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Vo extends Lt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Rt extends Lt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Yc=0;const It=new He,is=new $e,$n=new N,Et=new zi,Si=new zi,it=new N;class Pt extends fi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Yc++}),this.uuid=_n(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(No(e)?Vo:ko)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new _t().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const i=this.attributes.tangent;return i!==void 0&&(i.transformDirection(e),i.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return It.makeRotationFromQuaternion(e),this.applyMatrix4(It),this}rotateX(e){return It.makeRotationX(e),this.applyMatrix4(It),this}rotateY(e){return It.makeRotationY(e),this.applyMatrix4(It),this}rotateZ(e){return It.makeRotationZ(e),this.applyMatrix4(It),this}translate(e,t,n){return It.makeTranslation(e,t,n),this.applyMatrix4(It),this}scale(e,t,n){return It.makeScale(e,t,n),this.applyMatrix4(It),this}lookAt(e){return is.lookAt(e),is.updateMatrix(),this.applyMatrix4(is.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter($n).negate(),this.translate($n.x,$n.y,$n.z),this}setFromPoints(e){const t=[];for(let n=0,i=e.length;n<i;n++){const s=e[n];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new Rt(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new zi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new N(-1/0,-1/0,-1/0),new N(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,i=t.length;n<i;n++){const s=t[n];Et.setFromBufferAttribute(s),this.morphTargetsRelative?(it.addVectors(this.boundingBox.min,Et.min),this.boundingBox.expandByPoint(it),it.addVectors(this.boundingBox.max,Et.max),this.boundingBox.expandByPoint(it)):(this.boundingBox.expandByPoint(Et.min),this.boundingBox.expandByPoint(Et.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ui);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new N,1/0);return}if(e){const n=this.boundingSphere.center;if(Et.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];Si.setFromBufferAttribute(a),this.morphTargetsRelative?(it.addVectors(Et.min,Si.min),Et.expandByPoint(it),it.addVectors(Et.max,Si.max),Et.expandByPoint(it)):(Et.expandByPoint(Si.min),Et.expandByPoint(Si.max))}Et.getCenter(n);let i=0;for(let s=0,o=e.count;s<o;s++)it.fromBufferAttribute(e,s),i=Math.max(i,n.distanceToSquared(it));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)it.fromBufferAttribute(a,c),l&&($n.fromBufferAttribute(e,c),it.add($n)),i=Math.max(i,n.distanceToSquared(it))}this.boundingSphere.radius=Math.sqrt(i),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.array,i=t.position.array,s=t.normal.array,o=t.uv.array,a=i.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Lt(new Float32Array(4*a),4));const l=this.getAttribute("tangent").array,c=[],u=[];for(let F=0;F<a;F++)c[F]=new N,u[F]=new N;const h=new N,d=new N,m=new N,g=new De,p=new De,f=new De,v=new N,M=new N;function _(F,D,Y){h.fromArray(i,F*3),d.fromArray(i,D*3),m.fromArray(i,Y*3),g.fromArray(o,F*2),p.fromArray(o,D*2),f.fromArray(o,Y*2),d.sub(h),m.sub(h),p.sub(g),f.sub(g);const I=1/(p.x*f.y-f.x*p.y);isFinite(I)&&(v.copy(d).multiplyScalar(f.y).addScaledVector(m,-p.y).multiplyScalar(I),M.copy(m).multiplyScalar(p.x).addScaledVector(d,-f.x).multiplyScalar(I),c[F].add(v),c[D].add(v),c[Y].add(v),u[F].add(M),u[D].add(M),u[Y].add(M))}let E=this.groups;E.length===0&&(E=[{start:0,count:n.length}]);for(let F=0,D=E.length;F<D;++F){const Y=E[F],I=Y.start,P=Y.count;for(let V=I,$=I+P;V<$;V+=3)_(n[V+0],n[V+1],n[V+2])}const w=new N,L=new N,U=new N,y=new N;function T(F){U.fromArray(s,F*3),y.copy(U);const D=c[F];w.copy(D),w.sub(U.multiplyScalar(U.dot(D))).normalize(),L.crossVectors(y,D);const I=L.dot(u[F])<0?-1:1;l[F*4]=w.x,l[F*4+1]=w.y,l[F*4+2]=w.z,l[F*4+3]=I}for(let F=0,D=E.length;F<D;++F){const Y=E[F],I=Y.start,P=Y.count;for(let V=I,$=I+P;V<$;V+=3)T(n[V+0]),T(n[V+1]),T(n[V+2])}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Lt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,m=n.count;d<m;d++)n.setXYZ(d,0,0,0);const i=new N,s=new N,o=new N,a=new N,l=new N,c=new N,u=new N,h=new N;if(e)for(let d=0,m=e.count;d<m;d+=3){const g=e.getX(d+0),p=e.getX(d+1),f=e.getX(d+2);i.fromBufferAttribute(t,g),s.fromBufferAttribute(t,p),o.fromBufferAttribute(t,f),u.subVectors(o,s),h.subVectors(i,s),u.cross(h),a.fromBufferAttribute(n,g),l.fromBufferAttribute(n,p),c.fromBufferAttribute(n,f),a.add(u),l.add(u),c.add(u),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(p,l.x,l.y,l.z),n.setXYZ(f,c.x,c.y,c.z)}else for(let d=0,m=t.count;d<m;d+=3)i.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,s),h.subVectors(i,s),u.cross(h),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeBufferGeometries() instead."),this}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)it.fromBufferAttribute(e,t),it.normalize(),e.setXYZ(t,it.x,it.y,it.z)}toNonIndexed(){function e(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let m=0,g=0;for(let p=0,f=l.length;p<f;p++){a.isInterleavedBufferAttribute?m=l[p]*a.data.stride+a.offset:m=l[p]*u;for(let v=0;v<u;v++)d[g++]=c[m++]}return new Lt(d,u,h)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Pt,n=this.index.array,i=this.attributes;for(const a in i){const l=i[a],c=e(l,n);t.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],m=e(d,n);l.push(m)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.5,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const l in n){const c=n[l];e.data.attributes[l]=c.toJSON(e.data)}const i={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const m=c[h];u.push(m.toJSON(e.data))}u.length>0&&(i[l]=u,s=!0)}s&&(e.data.morphAttributes=i,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone(t));const i=e.attributes;for(const c in i){const u=i[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],h=s[c];for(let d=0,m=h.length;d<m;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Da=new He,qt=new Ls,Yi=new Ui,Ia=new N,Mi=new N,bi=new N,wi=new N,rs=new N,$i=new N,Ki=new De,Zi=new De,Ji=new De,ss=new N,Qi=new N;class pn extends $e{constructor(e=new Pt,t=new Go){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){const n=this.geometry,i=n.attributes.position,s=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(i,e);const a=this.morphTargetInfluences;if(s&&a){$i.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],h=s[l];u!==0&&(rs.fromBufferAttribute(h,e),o?$i.addScaledVector(rs,u):$i.addScaledVector(rs.sub(t),u))}t.add($i)}return this.isSkinnedMesh&&this.boneTransform(e,t),t}raycast(e,t){const n=this.geometry,i=this.material,s=this.matrixWorld;if(i===void 0||(n.boundingSphere===null&&n.computeBoundingSphere(),Yi.copy(n.boundingSphere),Yi.applyMatrix4(s),qt.copy(e.ray).recast(e.near),Yi.containsPoint(qt.origin)===!1&&(qt.intersectSphere(Yi,Ia)===null||qt.origin.distanceToSquared(Ia)>(e.far-e.near)**2))||(Da.copy(s).invert(),qt.copy(e.ray).applyMatrix4(Da),n.boundingBox!==null&&qt.intersectsBox(n.boundingBox)===!1))return;let o;const a=n.index,l=n.attributes.position,c=n.attributes.uv,u=n.attributes.uv2,h=n.groups,d=n.drawRange;if(a!==null)if(Array.isArray(i))for(let m=0,g=h.length;m<g;m++){const p=h[m],f=i[p.materialIndex],v=Math.max(p.start,d.start),M=Math.min(a.count,Math.min(p.start+p.count,d.start+d.count));for(let _=v,E=M;_<E;_+=3){const w=a.getX(_),L=a.getX(_+1),U=a.getX(_+2);o=er(this,f,e,qt,c,u,w,L,U),o&&(o.faceIndex=Math.floor(_/3),o.face.materialIndex=p.materialIndex,t.push(o))}}else{const m=Math.max(0,d.start),g=Math.min(a.count,d.start+d.count);for(let p=m,f=g;p<f;p+=3){const v=a.getX(p),M=a.getX(p+1),_=a.getX(p+2);o=er(this,i,e,qt,c,u,v,M,_),o&&(o.faceIndex=Math.floor(p/3),t.push(o))}}else if(l!==void 0)if(Array.isArray(i))for(let m=0,g=h.length;m<g;m++){const p=h[m],f=i[p.materialIndex],v=Math.max(p.start,d.start),M=Math.min(l.count,Math.min(p.start+p.count,d.start+d.count));for(let _=v,E=M;_<E;_+=3){const w=_,L=_+1,U=_+2;o=er(this,f,e,qt,c,u,w,L,U),o&&(o.faceIndex=Math.floor(_/3),o.face.materialIndex=p.materialIndex,t.push(o))}}else{const m=Math.max(0,d.start),g=Math.min(l.count,d.start+d.count);for(let p=m,f=g;p<f;p+=3){const v=p,M=p+1,_=p+2;o=er(this,i,e,qt,c,u,v,M,_),o&&(o.faceIndex=Math.floor(p/3),t.push(o))}}}}function $c(r,e,t,n,i,s,o,a){let l;if(e.side===At?l=n.intersectTriangle(o,s,i,!0,a):l=n.intersectTriangle(i,s,o,e.side===xn,a),l===null)return null;Qi.copy(a),Qi.applyMatrix4(r.matrixWorld);const c=t.ray.origin.distanceTo(Qi);return c<t.near||c>t.far?null:{distance:c,point:Qi.clone(),object:r}}function er(r,e,t,n,i,s,o,a,l){r.getVertexPosition(o,Mi),r.getVertexPosition(a,bi),r.getVertexPosition(l,wi);const c=$c(r,e,t,n,Mi,bi,wi,ss);if(c){i&&(Ki.fromBufferAttribute(i,o),Zi.fromBufferAttribute(i,a),Ji.fromBufferAttribute(i,l),c.uv=kt.getUV(ss,Mi,bi,wi,Ki,Zi,Ji,new De)),s&&(Ki.fromBufferAttribute(s,o),Zi.fromBufferAttribute(s,a),Ji.fromBufferAttribute(s,l),c.uv2=kt.getUV(ss,Mi,bi,wi,Ki,Zi,Ji,new De));const u={a:o,b:a,c:l,normal:new N,materialIndex:0};kt.getNormal(Mi,bi,wi,u.normal),c.face=u}return c}class Fi extends Pt{constructor(e=1,t=1,n=1,i=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:i,heightSegments:s,depthSegments:o};const a=this;i=Math.floor(i),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,m=0;g("z","y","x",-1,-1,n,t,e,o,s,0),g("z","y","x",1,-1,n,t,-e,o,s,1),g("x","z","y",1,1,e,n,t,i,o,2),g("x","z","y",1,-1,e,n,-t,i,o,3),g("x","y","z",1,-1,e,t,n,i,s,4),g("x","y","z",-1,-1,e,t,-n,i,s,5),this.setIndex(l),this.setAttribute("position",new Rt(c,3)),this.setAttribute("normal",new Rt(u,3)),this.setAttribute("uv",new Rt(h,2));function g(p,f,v,M,_,E,w,L,U,y,T){const F=E/U,D=w/y,Y=E/2,I=w/2,P=L/2,V=U+1,$=y+1;let Q=0,q=0;const K=new N;for(let ee=0;ee<$;ee++){const pe=ee*D-I;for(let k=0;k<V;k++){const Z=k*F-Y;K[p]=Z*M,K[f]=pe*_,K[v]=P,c.push(K.x,K.y,K.z),K[p]=0,K[f]=0,K[v]=L>0?1:-1,u.push(K.x,K.y,K.z),h.push(k/U),h.push(1-ee/y),Q+=1}}for(let ee=0;ee<y;ee++)for(let pe=0;pe<U;pe++){const k=d+pe+V*ee,Z=d+pe+V*(ee+1),re=d+(pe+1)+V*(ee+1),B=d+(pe+1)+V*ee;l.push(k,Z,B),l.push(Z,re,B),q+=6}a.addGroup(m,q,T),m+=q,d+=Q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Fi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function hi(r){const e={};for(const t in r){e[t]={};for(const n in r[t]){const i=r[t][n];i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)?e[t][n]=i.clone():Array.isArray(i)?e[t][n]=i.slice():e[t][n]=i}}return e}function mt(r){const e={};for(let t=0;t<r.length;t++){const n=hi(r[t]);for(const i in n)e[i]=n[i]}return e}function Kc(r){const e=[];for(let t=0;t<r.length;t++)e.push(r[t].clone());return e}function Ho(r){return r.getRenderTarget()===null&&r.outputEncoding===ke?Xt:Ii}const Zc={clone:hi,merge:mt};var Jc=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Qc=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class zn extends Un{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Jc,this.fragmentShader=Qc,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv2:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=hi(e.uniforms),this.uniformsGroups=Kc(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const i in this.uniforms){const o=this.uniforms[i].value;o&&o.isTexture?t.uniforms[i]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[i]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[i]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[i]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[i]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[i]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[i]={type:"m4",value:o.toArray()}:t.uniforms[i]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader;const n={};for(const i in this.extensions)this.extensions[i]===!0&&(n[i]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class Wo extends $e{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new He,this.projectionMatrix=new He,this.projectionMatrixInverse=new He}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(-t[8],-t[9],-t[10]).normalize()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class Ot extends Wo{constructor(e=50,t=1,n=.1,i=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=i,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Sa*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(pr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Sa*2*Math.atan(Math.tan(pr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,n,i,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(pr*.5*this.fov)/this.zoom,n=2*t,i=this.aspect*n,s=-.5*i;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*i/l,t-=o.offsetY*n/c,i*=o.width/l,n*=o.height/c}const a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+i,t,t-n,e,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const Kn=-90,Zn=1;class eu extends $e{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n;const i=new Ot(Kn,Zn,e,t);i.layers=this.layers,i.up.set(0,1,0),i.lookAt(1,0,0),this.add(i);const s=new Ot(Kn,Zn,e,t);s.layers=this.layers,s.up.set(0,1,0),s.lookAt(-1,0,0),this.add(s);const o=new Ot(Kn,Zn,e,t);o.layers=this.layers,o.up.set(0,0,-1),o.lookAt(0,1,0),this.add(o);const a=new Ot(Kn,Zn,e,t);a.layers=this.layers,a.up.set(0,0,1),a.lookAt(0,-1,0),this.add(a);const l=new Ot(Kn,Zn,e,t);l.layers=this.layers,l.up.set(0,1,0),l.lookAt(0,0,1),this.add(l);const c=new Ot(Kn,Zn,e,t);c.layers=this.layers,c.up.set(0,1,0),c.lookAt(0,0,-1),this.add(c)}update(e,t){this.parent===null&&this.updateMatrixWorld();const n=this.renderTarget,[i,s,o,a,l,c]=this.children,u=e.getRenderTarget(),h=e.toneMapping,d=e.xr.enabled;e.toneMapping=rn,e.xr.enabled=!1;const m=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0),e.render(t,i),e.setRenderTarget(n,1),e.render(t,s),e.setRenderTarget(n,2),e.render(t,o),e.setRenderTarget(n,3),e.render(t,a),e.setRenderTarget(n,4),e.render(t,l),n.texture.generateMipmaps=m,e.setRenderTarget(n,5),e.render(t,c),e.setRenderTarget(u),e.toneMapping=h,e.xr.enabled=d,n.texture.needsPMREMUpdate=!0}}class jo extends yt{constructor(e,t,n,i,s,o,a,l,c,u){e=e!==void 0?e:[],t=t!==void 0?t:ci,super(e,t,n,i,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class tu extends On{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},i=[n,n,n,n,n,n];this.texture=new jo(i,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.encoding),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Nt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.encoding=t.encoding,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},i=new Fi(5,5,5),s=new zn({name:"CubemapFromEquirect",uniforms:hi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:At,blending:gn});s.uniforms.tEquirect.value=t;const o=new pn(i,s),a=t.minFilter;return t.minFilter===Pi&&(t.minFilter=Nt),new eu(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,i){const s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,i);e.setRenderTarget(s)}}const as=new N,nu=new N,iu=new _t;class Tn{constructor(e=new N(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,i){return this.normal.set(e,t,n),this.constant=i,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const i=as.subVectors(n,t).cross(nu.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(i,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(as),i=this.normal.dot(n);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/i;return s<0||s>1?null:t.copy(e.start).addScaledVector(n,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||iu.getNormalMatrix(e),i=this.coplanarPoint(as).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-i.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Jn=new Ui,tr=new N;class Rs{constructor(e=new Tn,t=new Tn,n=new Tn,i=new Tn,s=new Tn,o=new Tn){this.planes=[e,t,n,i,s,o]}set(e,t,n,i,s,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(i),a[4].copy(s),a[5].copy(o),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e){const t=this.planes,n=e.elements,i=n[0],s=n[1],o=n[2],a=n[3],l=n[4],c=n[5],u=n[6],h=n[7],d=n[8],m=n[9],g=n[10],p=n[11],f=n[12],v=n[13],M=n[14],_=n[15];return t[0].setComponents(a-i,h-l,p-d,_-f).normalize(),t[1].setComponents(a+i,h+l,p+d,_+f).normalize(),t[2].setComponents(a+s,h+c,p+m,_+v).normalize(),t[3].setComponents(a-s,h-c,p-m,_-v).normalize(),t[4].setComponents(a-o,h-u,p-g,_-M).normalize(),t[5].setComponents(a+o,h+u,p+g,_+M).normalize(),this}intersectsObject(e){const t=e.geometry;return t.boundingSphere===null&&t.computeBoundingSphere(),Jn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld),this.intersectsSphere(Jn)}intersectsSprite(e){return Jn.center.set(0,0,0),Jn.radius=.7071067811865476,Jn.applyMatrix4(e.matrixWorld),this.intersectsSphere(Jn)}intersectsSphere(e){const t=this.planes,n=e.center,i=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<i)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const i=t[n];if(tr.x=i.normal.x>0?e.max.x:e.min.x,tr.y=i.normal.y>0?e.max.y:e.min.y,tr.z=i.normal.z>0?e.max.z:e.min.z,i.distanceToPoint(tr)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function qo(){let r=null,e=!1,t=null,n=null;function i(s,o){t(s,o),n=r.requestAnimationFrame(i)}return{start:function(){e!==!0&&t!==null&&(n=r.requestAnimationFrame(i),e=!0)},stop:function(){r.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){r=s}}}function ru(r,e){const t=e.isWebGL2,n=new WeakMap;function i(c,u){const h=c.array,d=c.usage,m=r.createBuffer();r.bindBuffer(u,m),r.bufferData(u,h,d),c.onUploadCallback();let g;if(h instanceof Float32Array)g=5126;else if(h instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(t)g=5131;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else g=5123;else if(h instanceof Int16Array)g=5122;else if(h instanceof Uint32Array)g=5125;else if(h instanceof Int32Array)g=5124;else if(h instanceof Int8Array)g=5120;else if(h instanceof Uint8Array)g=5121;else if(h instanceof Uint8ClampedArray)g=5121;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+h);return{buffer:m,type:g,bytesPerElement:h.BYTES_PER_ELEMENT,version:c.version}}function s(c,u,h){const d=u.array,m=u.updateRange;r.bindBuffer(h,c),m.count===-1?r.bufferSubData(h,0,d):(t?r.bufferSubData(h,m.offset*d.BYTES_PER_ELEMENT,d,m.offset,m.count):r.bufferSubData(h,m.offset*d.BYTES_PER_ELEMENT,d.subarray(m.offset,m.offset+m.count)),m.count=-1),u.onUploadCallback()}function o(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function a(c){c.isInterleavedBufferAttribute&&(c=c.data);const u=n.get(c);u&&(r.deleteBuffer(u.buffer),n.delete(c))}function l(c,u){if(c.isGLBufferAttribute){const d=n.get(c);(!d||d.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);const h=n.get(c);h===void 0?n.set(c,i(c,u)):h.version<c.version&&(s(h.buffer,c,u),h.version=c.version)}return{get:o,remove:a,update:l}}class Ps extends Pt{constructor(e=1,t=1,n=1,i=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:i};const s=e/2,o=t/2,a=Math.floor(n),l=Math.floor(i),c=a+1,u=l+1,h=e/a,d=t/l,m=[],g=[],p=[],f=[];for(let v=0;v<u;v++){const M=v*d-o;for(let _=0;_<c;_++){const E=_*h-s;g.push(E,-M,0),p.push(0,0,1),f.push(_/a),f.push(1-v/l)}}for(let v=0;v<l;v++)for(let M=0;M<a;M++){const _=M+c*v,E=M+c*(v+1),w=M+1+c*(v+1),L=M+1+c*v;m.push(_,E,L),m.push(E,w,L)}this.setIndex(m),this.setAttribute("position",new Rt(g,3)),this.setAttribute("normal",new Rt(p,3)),this.setAttribute("uv",new Rt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ps(e.width,e.height,e.widthSegments,e.heightSegments)}}var su=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vUv ).g;
#endif`,au=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ou=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,lu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,cu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vUv2 ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,uu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,du="vec3 transformed = vec3( position );",hu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,fu=`vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float roughness ) {
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
	float D = D_GGX( alpha, dotNH );
	return F * ( V * D );
}
#ifdef USE_IRIDESCENCE
	vec3 BRDF_GGX_Iridescence( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 f0, const in float f90, const in float iridescence, const in vec3 iridescenceFresnel, const in float roughness ) {
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = mix( F_Schlick( f0, f90, dotVH ), iridescenceFresnel, iridescence );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif`,pu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			 return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,mu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vUv );
		vec2 dSTdy = dFdy( vUv );
		float Hll = bumpScale * texture2D( bumpMap, vUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,gu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,_u=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,vu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,yu=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Su=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Mu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,bu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,wu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
float w0( float a ) {
	return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
}
float w1( float a ) {
	return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
}
float w2( float a ){
    return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
}
float w3( float a ) {
	return ( 1.0 / 6.0 ) * ( a * a * a );
}
float g0( float a ) {
	return w0( a ) + w1( a );
}
float g1( float a ) {
	return w2( a ) + w3( a );
}
float h0( float a ) {
	return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
}
float h1( float a ) {
    return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
}
vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, vec2 fullSize, float lod ) {
	uv = uv * texelSize.zw + 0.5;
	vec2 iuv = floor( uv );
    vec2 fuv = fract( uv );
    float g0x = g0( fuv.x );
    float g1x = g1( fuv.x );
    float h0x = h0( fuv.x );
    float h1x = h1( fuv.x );
    float h0y = h0( fuv.y );
    float h1y = h1( fuv.y );
    vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
    vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
    vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
    vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
    
    vec2 lodFudge = pow( 1.95, lod ) / fullSize;
	return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
		   g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
}
vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
	vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
	vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
	vec2 fLodSizeInv = 1.0 / fLodSize;
	vec2 cLodSizeInv = 1.0 / cLodSize;
	vec2 fullSize = vec2( textureSize( sampler, 0 ) );
	vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), fullSize, floor( lod ) );
	vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), fullSize, ceil( lod ) );
	return mix( fSample, cSample, fract( lod ) );
}`,Eu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_v0 0.339
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_v1 0.276
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_v4 0.046
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_v5 0.016
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_v6 0.0038
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Tu=`vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Cu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Au=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vUv ).x * displacementScale + displacementBias );
#endif`,Lu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ru=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Pu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Du=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Iu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Nu=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ou=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,zu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Uu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Fu=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Bu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Gu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,ku=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Vu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Hu=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vUv2 );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Wu=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,ju=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,qu=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Xu=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometry.position;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometry.position;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Yu=`#if defined( USE_ENVMAP )
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#if defined( ENVMAP_TYPE_CUBE_UV )
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
#endif`,$u=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Ku=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Zu=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ju=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Qu=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULARINTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vUv ).a;
		#endif
		#ifdef USE_SPECULARCOLORMAP
			specularColorFactor *= texture2D( specularColorMap, vUv ).rgb;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEENCOLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEENROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vUv ).a;
	#endif
#endif`,ed=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
};
vec3 clearcoatSpecular = vec3( 0.0 );
vec3 sheenSpecular = vec3( 0.0 );
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecular += ccIrradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.clearcoatNormal, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * BRDF_Sheen( directLight.direction, geometry.viewDir, geometry.normal, material.sheenColor, material.sheenRoughness );
	#endif
	#ifdef USE_IRIDESCENCE
		reflectedLight.directSpecular += irradiance * BRDF_GGX_Iridescence( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness );
	#else
		reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularF90, material.roughness );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecular += clearcoatRadiance * EnvironmentBRDF( geometry.clearcoatNormal, geometry.viewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * material.sheenColor * IBLSheenBRDF( geometry.normal, geometry.viewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,td=`
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef USE_CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometry.viewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometry, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,nd=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,id=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,rd=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,sd=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ad=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,od=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,ld=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,cd=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ud=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,dd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	uniform mat3 uvTransform;
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,hd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vUv );
	metalnessFactor *= texelMetalness.b;
#endif`,fd=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,pd=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,md=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,gd=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,_d=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,xd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	#ifdef USE_TANGENT
		vec3 tangent = normalize( vTangent );
		vec3 bitangent = normalize( vBitangent );
		#ifdef DOUBLE_SIDED
			tangent = tangent * faceDirection;
			bitangent = bitangent * faceDirection;
		#endif
		#if defined( TANGENTSPACE_NORMALMAP ) || defined( USE_CLEARCOAT_NORMALMAP )
			mat3 vTBN = mat3( tangent, bitangent, normal );
		#endif
	#endif
#endif
vec3 geometryNormal = normal;`,vd=`#ifdef OBJECTSPACE_NORMALMAP
	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( TANGENTSPACE_NORMALMAP )
	vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	#ifdef USE_TANGENT
		normal = normalize( vTBN * mapN );
	#else
		normal = perturbNormal2Arb( - vViewPosition, normal, mapN, faceDirection );
	#endif
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,yd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Md=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,bd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef OBJECTSPACE_NORMALMAP
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( TANGENTSPACE_NORMALMAP ) || defined ( USE_CLEARCOAT_NORMALMAP ) )
	vec3 perturbNormal2Arb( vec3 eye_pos, vec3 surf_norm, vec3 mapN, float faceDirection ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( vUv.st );
		vec2 st1 = dFdy( vUv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : faceDirection * inversesqrt( det );
		return normalize( T * ( mapN.x * scale ) + B * ( mapN.y * scale ) + N * mapN.z );
	}
#endif`,wd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,Ed=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	#ifdef USE_TANGENT
		clearcoatNormal = normalize( vTBN * clearcoatMapN );
	#else
		clearcoatNormal = perturbNormal2Arb( - vViewPosition, clearcoatNormal, clearcoatMapN, faceDirection );
	#endif
#endif`,Td=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif`,Cd=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Ad=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha + 0.1;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Ld=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float linearClipZ, const in float near, const in float far ) {
	return linearClipZ * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float invClipZ, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * invClipZ - far );
}`,Rd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Pd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Dd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Id=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Nd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Od=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,zd=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,Ud=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Fd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Bd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Gd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,kd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;
	mat4 getBoneMatrix( const in float i ) {
		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );
		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );
		y = dy * ( y + 0.5 );
		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
		mat4 bone = mat4( v1, v2, v3, v4 );
		return bone;
	}
#endif`,Vd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Hd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Wd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,jd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,qd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Xd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return toneMappingExposure * color;
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Yd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmission = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmission.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmission.rgb, material.transmission );
#endif`,$d=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 applyVolumeAttenuation( const in vec3 radiance, const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return radiance;
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance * radiance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 attenuatedColor = applyVolumeAttenuation( transmittedLight.rgb, length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		return vec4( ( 1.0 - F ) * attenuatedColor * diffuseColor, transmittedLight.a );
	}
#endif`,Kd=`#if ( defined( USE_UV ) && ! defined( UVS_VERTEX_ONLY ) )
	varying vec2 vUv;
#endif`,Zd=`#ifdef USE_UV
	#ifdef UVS_VERTEX_ONLY
		vec2 vUv;
	#else
		varying vec2 vUv;
	#endif
	uniform mat3 uvTransform;
#endif`,Jd=`#ifdef USE_UV
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
#endif`,Qd=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	varying vec2 vUv2;
#endif`,eh=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	attribute vec2 uv2;
	varying vec2 vUv2;
	uniform mat3 uv2Transform;
#endif`,th=`#if defined( USE_LIGHTMAP ) || defined( USE_AOMAP )
	vUv2 = ( uv2Transform * vec3( uv2, 1 ) ).xy;
#endif`,nh=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const ih=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,rh=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,sh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ah=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,oh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,lh=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,ch=`#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,uh=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,dh=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,hh=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,fh=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,ph=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,mh=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,gh=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,_h=`#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,xh=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vUv2 );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vh=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yh=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sh=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Mh=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bh=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	vViewPosition = - mvPosition.xyz;
#endif
}`,wh=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Eh=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Th=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ch=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Ah=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULARINTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
	#ifdef USE_SPECULARCOLORMAP
		uniform sampler2D specularColorMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEENCOLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEENROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <bsdfs>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Lh=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <uv2_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <uv2_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Rh=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ph=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Dh=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ih=`#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Nh=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,Oh=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,zh=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,we={alphamap_fragment:su,alphamap_pars_fragment:au,alphatest_fragment:ou,alphatest_pars_fragment:lu,aomap_fragment:cu,aomap_pars_fragment:uu,begin_vertex:du,beginnormal_vertex:hu,bsdfs:fu,iridescence_fragment:pu,bumpmap_pars_fragment:mu,clipping_planes_fragment:gu,clipping_planes_pars_fragment:_u,clipping_planes_pars_vertex:xu,clipping_planes_vertex:vu,color_fragment:yu,color_pars_fragment:Su,color_pars_vertex:Mu,color_vertex:bu,common:wu,cube_uv_reflection_fragment:Eu,defaultnormal_vertex:Tu,displacementmap_pars_vertex:Cu,displacementmap_vertex:Au,emissivemap_fragment:Lu,emissivemap_pars_fragment:Ru,encodings_fragment:Pu,encodings_pars_fragment:Du,envmap_fragment:Iu,envmap_common_pars_fragment:Nu,envmap_pars_fragment:Ou,envmap_pars_vertex:zu,envmap_physical_pars_fragment:Yu,envmap_vertex:Uu,fog_vertex:Fu,fog_pars_vertex:Bu,fog_fragment:Gu,fog_pars_fragment:ku,gradientmap_pars_fragment:Vu,lightmap_fragment:Hu,lightmap_pars_fragment:Wu,lights_lambert_fragment:ju,lights_lambert_pars_fragment:qu,lights_pars_begin:Xu,lights_toon_fragment:$u,lights_toon_pars_fragment:Ku,lights_phong_fragment:Zu,lights_phong_pars_fragment:Ju,lights_physical_fragment:Qu,lights_physical_pars_fragment:ed,lights_fragment_begin:td,lights_fragment_maps:nd,lights_fragment_end:id,logdepthbuf_fragment:rd,logdepthbuf_pars_fragment:sd,logdepthbuf_pars_vertex:ad,logdepthbuf_vertex:od,map_fragment:ld,map_pars_fragment:cd,map_particle_fragment:ud,map_particle_pars_fragment:dd,metalnessmap_fragment:hd,metalnessmap_pars_fragment:fd,morphcolor_vertex:pd,morphnormal_vertex:md,morphtarget_pars_vertex:gd,morphtarget_vertex:_d,normal_fragment_begin:xd,normal_fragment_maps:vd,normal_pars_fragment:yd,normal_pars_vertex:Sd,normal_vertex:Md,normalmap_pars_fragment:bd,clearcoat_normal_fragment_begin:wd,clearcoat_normal_fragment_maps:Ed,clearcoat_pars_fragment:Td,iridescence_pars_fragment:Cd,output_fragment:Ad,packing:Ld,premultiplied_alpha_fragment:Rd,project_vertex:Pd,dithering_fragment:Dd,dithering_pars_fragment:Id,roughnessmap_fragment:Nd,roughnessmap_pars_fragment:Od,shadowmap_pars_fragment:zd,shadowmap_pars_vertex:Ud,shadowmap_vertex:Fd,shadowmask_pars_fragment:Bd,skinbase_vertex:Gd,skinning_pars_vertex:kd,skinning_vertex:Vd,skinnormal_vertex:Hd,specularmap_fragment:Wd,specularmap_pars_fragment:jd,tonemapping_fragment:qd,tonemapping_pars_fragment:Xd,transmission_fragment:Yd,transmission_pars_fragment:$d,uv_pars_fragment:Kd,uv_pars_vertex:Zd,uv_vertex:Jd,uv2_pars_fragment:Qd,uv2_pars_vertex:eh,uv2_vertex:th,worldpos_vertex:nh,background_vert:ih,background_frag:rh,backgroundCube_vert:sh,backgroundCube_frag:ah,cube_vert:oh,cube_frag:lh,depth_vert:ch,depth_frag:uh,distanceRGBA_vert:dh,distanceRGBA_frag:hh,equirect_vert:fh,equirect_frag:ph,linedashed_vert:mh,linedashed_frag:gh,meshbasic_vert:_h,meshbasic_frag:xh,meshlambert_vert:vh,meshlambert_frag:yh,meshmatcap_vert:Sh,meshmatcap_frag:Mh,meshnormal_vert:bh,meshnormal_frag:wh,meshphong_vert:Eh,meshphong_frag:Th,meshphysical_vert:Ch,meshphysical_frag:Ah,meshtoon_vert:Lh,meshtoon_frag:Rh,points_vert:Ph,points_frag:Dh,shadow_vert:Ih,shadow_frag:Nh,sprite_vert:Oh,sprite_frag:zh},ie={common:{diffuse:{value:new ze(16777215)},opacity:{value:1},map:{value:null},uvTransform:{value:new _t},uv2Transform:{value:new _t},alphaMap:{value:null},alphaTest:{value:0}},specularmap:{specularMap:{value:null}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1}},emissivemap:{emissiveMap:{value:null}},bumpmap:{bumpMap:{value:null},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalScale:{value:new De(1,1)}},displacementmap:{displacementMap:{value:null},displacementScale:{value:1},displacementBias:{value:0}},roughnessmap:{roughnessMap:{value:null}},metalnessmap:{metalnessMap:{value:null}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ze(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ze(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new _t}},sprite:{diffuse:{value:new ze(16777215)},opacity:{value:1},center:{value:new De(.5,.5)},rotation:{value:0},map:{value:null},alphaMap:{value:null},alphaTest:{value:0},uvTransform:{value:new _t}}},Yt={basic:{uniforms:mt([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.fog]),vertexShader:we.meshbasic_vert,fragmentShader:we.meshbasic_frag},lambert:{uniforms:mt([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new ze(0)}}]),vertexShader:we.meshlambert_vert,fragmentShader:we.meshlambert_frag},phong:{uniforms:mt([ie.common,ie.specularmap,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,ie.lights,{emissive:{value:new ze(0)},specular:{value:new ze(1118481)},shininess:{value:30}}]),vertexShader:we.meshphong_vert,fragmentShader:we.meshphong_frag},standard:{uniforms:mt([ie.common,ie.envmap,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.roughnessmap,ie.metalnessmap,ie.fog,ie.lights,{emissive:{value:new ze(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:we.meshphysical_vert,fragmentShader:we.meshphysical_frag},toon:{uniforms:mt([ie.common,ie.aomap,ie.lightmap,ie.emissivemap,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.gradientmap,ie.fog,ie.lights,{emissive:{value:new ze(0)}}]),vertexShader:we.meshtoon_vert,fragmentShader:we.meshtoon_frag},matcap:{uniforms:mt([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,ie.fog,{matcap:{value:null}}]),vertexShader:we.meshmatcap_vert,fragmentShader:we.meshmatcap_frag},points:{uniforms:mt([ie.points,ie.fog]),vertexShader:we.points_vert,fragmentShader:we.points_frag},dashed:{uniforms:mt([ie.common,ie.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:we.linedashed_vert,fragmentShader:we.linedashed_frag},depth:{uniforms:mt([ie.common,ie.displacementmap]),vertexShader:we.depth_vert,fragmentShader:we.depth_frag},normal:{uniforms:mt([ie.common,ie.bumpmap,ie.normalmap,ie.displacementmap,{opacity:{value:1}}]),vertexShader:we.meshnormal_vert,fragmentShader:we.meshnormal_frag},sprite:{uniforms:mt([ie.sprite,ie.fog]),vertexShader:we.sprite_vert,fragmentShader:we.sprite_frag},background:{uniforms:{uvTransform:{value:new _t},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:we.background_vert,fragmentShader:we.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:we.backgroundCube_vert,fragmentShader:we.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:we.cube_vert,fragmentShader:we.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:we.equirect_vert,fragmentShader:we.equirect_frag},distanceRGBA:{uniforms:mt([ie.common,ie.displacementmap,{referencePosition:{value:new N},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:we.distanceRGBA_vert,fragmentShader:we.distanceRGBA_frag},shadow:{uniforms:mt([ie.lights,ie.fog,{color:{value:new ze(0)},opacity:{value:1}}]),vertexShader:we.shadow_vert,fragmentShader:we.shadow_frag}};Yt.physical={uniforms:mt([Yt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatNormalScale:{value:new De(1,1)},clearcoatNormalMap:{value:null},iridescence:{value:0},iridescenceMap:{value:null},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},sheen:{value:0},sheenColor:{value:new ze(0)},sheenColorMap:{value:null},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},transmission:{value:0},transmissionMap:{value:null},transmissionSamplerSize:{value:new De},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},attenuationDistance:{value:0},attenuationColor:{value:new ze(0)},specularIntensity:{value:1},specularIntensityMap:{value:null},specularColor:{value:new ze(1,1,1)},specularColorMap:{value:null}}]),vertexShader:we.meshphysical_vert,fragmentShader:we.meshphysical_frag};const nr={r:0,b:0,g:0};function Uh(r,e,t,n,i,s,o){const a=new ze(0);let l=s===!0?0:1,c,u,h=null,d=0,m=null;function g(f,v){let M=!1,_=v.isScene===!0?v.background:null;_&&_.isTexture&&(_=(v.backgroundBlurriness>0?t:e).get(_));const E=r.xr,w=E.getSession&&E.getSession();w&&w.environmentBlendMode==="additive"&&(_=null),_===null?p(a,l):_&&_.isColor&&(p(_,1),M=!0),(r.autoClear||M)&&r.clear(r.autoClearColor,r.autoClearDepth,r.autoClearStencil),_&&(_.isCubeTexture||_.mapping===Tr)?(u===void 0&&(u=new pn(new Fi(1,1,1),new zn({name:"BackgroundCubeMaterial",uniforms:hi(Yt.backgroundCube.uniforms),vertexShader:Yt.backgroundCube.vertexShader,fragmentShader:Yt.backgroundCube.fragmentShader,side:At,depthTest:!1,depthWrite:!1,fog:!1})),u.geometry.deleteAttribute("normal"),u.geometry.deleteAttribute("uv"),u.onBeforeRender=function(L,U,y){this.matrixWorld.copyPosition(y.matrixWorld)},Object.defineProperty(u.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(u)),u.material.uniforms.envMap.value=_,u.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,u.material.uniforms.backgroundBlurriness.value=v.backgroundBlurriness,u.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,u.material.toneMapped=_.encoding!==ke,(h!==_||d!==_.version||m!==r.toneMapping)&&(u.material.needsUpdate=!0,h=_,d=_.version,m=r.toneMapping),u.layers.enableAll(),f.unshift(u,u.geometry,u.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new pn(new Ps(2,2),new zn({name:"BackgroundMaterial",uniforms:hi(Yt.background.uniforms),vertexShader:Yt.background.vertexShader,fragmentShader:Yt.background.fragmentShader,side:xn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=v.backgroundIntensity,c.material.toneMapped=_.encoding!==ke,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(h!==_||d!==_.version||m!==r.toneMapping)&&(c.material.needsUpdate=!0,h=_,d=_.version,m=r.toneMapping),c.layers.enableAll(),f.unshift(c,c.geometry,c.material,0,0,null))}function p(f,v){f.getRGB(nr,Ho(r)),n.buffers.color.setClear(nr.r,nr.g,nr.b,v,o)}return{getClearColor:function(){return a},setClearColor:function(f,v=1){a.set(f),l=v,p(a,l)},getClearAlpha:function(){return l},setClearAlpha:function(f){l=f,p(a,l)},render:g}}function Fh(r,e,t,n){const i=r.getParameter(34921),s=n.isWebGL2?null:e.get("OES_vertex_array_object"),o=n.isWebGL2||s!==null,a={},l=f(null);let c=l,u=!1;function h(P,V,$,Q,q){let K=!1;if(o){const ee=p(Q,$,V);c!==ee&&(c=ee,m(c.object)),K=v(P,Q,$,q),K&&M(P,Q,$,q)}else{const ee=V.wireframe===!0;(c.geometry!==Q.id||c.program!==$.id||c.wireframe!==ee)&&(c.geometry=Q.id,c.program=$.id,c.wireframe=ee,K=!0)}q!==null&&t.update(q,34963),(K||u)&&(u=!1,y(P,V,$,Q),q!==null&&r.bindBuffer(34963,t.get(q).buffer))}function d(){return n.isWebGL2?r.createVertexArray():s.createVertexArrayOES()}function m(P){return n.isWebGL2?r.bindVertexArray(P):s.bindVertexArrayOES(P)}function g(P){return n.isWebGL2?r.deleteVertexArray(P):s.deleteVertexArrayOES(P)}function p(P,V,$){const Q=$.wireframe===!0;let q=a[P.id];q===void 0&&(q={},a[P.id]=q);let K=q[V.id];K===void 0&&(K={},q[V.id]=K);let ee=K[Q];return ee===void 0&&(ee=f(d()),K[Q]=ee),ee}function f(P){const V=[],$=[],Q=[];for(let q=0;q<i;q++)V[q]=0,$[q]=0,Q[q]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:V,enabledAttributes:$,attributeDivisors:Q,object:P,attributes:{},index:null}}function v(P,V,$,Q){const q=c.attributes,K=V.attributes;let ee=0;const pe=$.getAttributes();for(const k in pe)if(pe[k].location>=0){const re=q[k];let B=K[k];if(B===void 0&&(k==="instanceMatrix"&&P.instanceMatrix&&(B=P.instanceMatrix),k==="instanceColor"&&P.instanceColor&&(B=P.instanceColor)),re===void 0||re.attribute!==B||B&&re.data!==B.data)return!0;ee++}return c.attributesNum!==ee||c.index!==Q}function M(P,V,$,Q){const q={},K=V.attributes;let ee=0;const pe=$.getAttributes();for(const k in pe)if(pe[k].location>=0){let re=K[k];re===void 0&&(k==="instanceMatrix"&&P.instanceMatrix&&(re=P.instanceMatrix),k==="instanceColor"&&P.instanceColor&&(re=P.instanceColor));const B={};B.attribute=re,re&&re.data&&(B.data=re.data),q[k]=B,ee++}c.attributes=q,c.attributesNum=ee,c.index=Q}function _(){const P=c.newAttributes;for(let V=0,$=P.length;V<$;V++)P[V]=0}function E(P){w(P,0)}function w(P,V){const $=c.newAttributes,Q=c.enabledAttributes,q=c.attributeDivisors;$[P]=1,Q[P]===0&&(r.enableVertexAttribArray(P),Q[P]=1),q[P]!==V&&((n.isWebGL2?r:e.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](P,V),q[P]=V)}function L(){const P=c.newAttributes,V=c.enabledAttributes;for(let $=0,Q=V.length;$<Q;$++)V[$]!==P[$]&&(r.disableVertexAttribArray($),V[$]=0)}function U(P,V,$,Q,q,K){n.isWebGL2===!0&&($===5124||$===5125)?r.vertexAttribIPointer(P,V,$,q,K):r.vertexAttribPointer(P,V,$,Q,q,K)}function y(P,V,$,Q){if(n.isWebGL2===!1&&(P.isInstancedMesh||Q.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;_();const q=Q.attributes,K=$.getAttributes(),ee=V.defaultAttributeValues;for(const pe in K){const k=K[pe];if(k.location>=0){let Z=q[pe];if(Z===void 0&&(pe==="instanceMatrix"&&P.instanceMatrix&&(Z=P.instanceMatrix),pe==="instanceColor"&&P.instanceColor&&(Z=P.instanceColor)),Z!==void 0){const re=Z.normalized,B=Z.itemSize,ce=t.get(Z);if(ce===void 0)continue;const ue=ce.buffer,he=ce.type,de=ce.bytesPerElement;if(Z.isInterleavedBufferAttribute){const Se=Z.data,be=Se.stride,Ee=Z.offset;if(Se.isInstancedInterleavedBuffer){for(let Ie=0;Ie<k.locationSize;Ie++)w(k.location+Ie,Se.meshPerAttribute);P.isInstancedMesh!==!0&&Q._maxInstanceCount===void 0&&(Q._maxInstanceCount=Se.meshPerAttribute*Se.count)}else for(let Ie=0;Ie<k.locationSize;Ie++)E(k.location+Ie);r.bindBuffer(34962,ue);for(let Ie=0;Ie<k.locationSize;Ie++)U(k.location+Ie,B/k.locationSize,he,re,be*de,(Ee+B/k.locationSize*Ie)*de)}else{if(Z.isInstancedBufferAttribute){for(let Se=0;Se<k.locationSize;Se++)w(k.location+Se,Z.meshPerAttribute);P.isInstancedMesh!==!0&&Q._maxInstanceCount===void 0&&(Q._maxInstanceCount=Z.meshPerAttribute*Z.count)}else for(let Se=0;Se<k.locationSize;Se++)E(k.location+Se);r.bindBuffer(34962,ue);for(let Se=0;Se<k.locationSize;Se++)U(k.location+Se,B/k.locationSize,he,re,B*de,B/k.locationSize*Se*de)}}else if(ee!==void 0){const re=ee[pe];if(re!==void 0)switch(re.length){case 2:r.vertexAttrib2fv(k.location,re);break;case 3:r.vertexAttrib3fv(k.location,re);break;case 4:r.vertexAttrib4fv(k.location,re);break;default:r.vertexAttrib1fv(k.location,re)}}}}L()}function T(){Y();for(const P in a){const V=a[P];for(const $ in V){const Q=V[$];for(const q in Q)g(Q[q].object),delete Q[q];delete V[$]}delete a[P]}}function F(P){if(a[P.id]===void 0)return;const V=a[P.id];for(const $ in V){const Q=V[$];for(const q in Q)g(Q[q].object),delete Q[q];delete V[$]}delete a[P.id]}function D(P){for(const V in a){const $=a[V];if($[P.id]===void 0)continue;const Q=$[P.id];for(const q in Q)g(Q[q].object),delete Q[q];delete $[P.id]}}function Y(){I(),u=!0,c!==l&&(c=l,m(c.object))}function I(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:h,reset:Y,resetDefaultState:I,dispose:T,releaseStatesOfGeometry:F,releaseStatesOfProgram:D,initAttributes:_,enableAttribute:E,disableUnusedAttributes:L}}function Bh(r,e,t,n){const i=n.isWebGL2;let s;function o(c){s=c}function a(c,u){r.drawArrays(s,c,u),t.update(u,s,1)}function l(c,u,h){if(h===0)return;let d,m;if(i)d=r,m="drawArraysInstanced";else if(d=e.get("ANGLE_instanced_arrays"),m="drawArraysInstancedANGLE",d===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}d[m](s,c,u,h),t.update(u,s,h)}this.setMode=o,this.render=a,this.renderInstances=l}function Gh(r,e,t){let n;function i(){if(n!==void 0)return n;if(e.has("EXT_texture_filter_anisotropic")===!0){const U=e.get("EXT_texture_filter_anisotropic");n=r.getParameter(U.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function s(U){if(U==="highp"){if(r.getShaderPrecisionFormat(35633,36338).precision>0&&r.getShaderPrecisionFormat(35632,36338).precision>0)return"highp";U="mediump"}return U==="mediump"&&r.getShaderPrecisionFormat(35633,36337).precision>0&&r.getShaderPrecisionFormat(35632,36337).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&r instanceof WebGL2RenderingContext;let a=t.precision!==void 0?t.precision:"highp";const l=s(a);l!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",l,"instead."),a=l);const c=o||e.has("WEBGL_draw_buffers"),u=t.logarithmicDepthBuffer===!0,h=r.getParameter(34930),d=r.getParameter(35660),m=r.getParameter(3379),g=r.getParameter(34076),p=r.getParameter(34921),f=r.getParameter(36347),v=r.getParameter(36348),M=r.getParameter(36349),_=d>0,E=o||e.has("OES_texture_float"),w=_&&E,L=o?r.getParameter(36183):0;return{isWebGL2:o,drawBuffers:c,getMaxAnisotropy:i,getMaxPrecision:s,precision:a,logarithmicDepthBuffer:u,maxTextures:h,maxVertexTextures:d,maxTextureSize:m,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:f,maxVaryings:v,maxFragmentUniforms:M,vertexTextures:_,floatFragmentTextures:E,floatVertexTextures:w,maxSamples:L}}function kh(r){const e=this;let t=null,n=0,i=!1,s=!1;const o=new Tn,a=new _t,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const m=h.length!==0||d||n!==0||i;return i=d,n=h.length,m},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,m){const g=h.clippingPlanes,p=h.clipIntersection,f=h.clipShadows,v=r.get(h);if(!i||g===null||g.length===0||s&&!f)s?u(null):c();else{const M=s?0:n,_=M*4;let E=v.clippingState||null;l.value=E,E=u(g,d,_,m);for(let w=0;w!==_;++w)E[w]=t[w];v.clippingState=E,this.numIntersection=p?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(h,d,m,g){const p=h!==null?h.length:0;let f=null;if(p!==0){if(f=l.value,g!==!0||f===null){const v=m+p*4,M=d.matrixWorldInverse;a.getNormalMatrix(M),(f===null||f.length<v)&&(f=new Float32Array(v));for(let _=0,E=m;_!==p;++_,E+=4)o.copy(h[_]).applyMatrix4(M,a),o.normal.toArray(f,E),f[E+3]=o.constant}l.value=f,l.needsUpdate=!0}return e.numPlanes=p,e.numIntersection=0,f}}function Vh(r){let e=new WeakMap;function t(o,a){return a===vs?o.mapping=ci:a===ys&&(o.mapping=ui),o}function n(o){if(o&&o.isTexture&&o.isRenderTargetTexture===!1){const a=o.mapping;if(a===vs||a===ys)if(e.has(o)){const l=e.get(o).texture;return t(l,o.mapping)}else{const l=o.image;if(l&&l.height>0){const c=new tu(l.height/2);return c.fromEquirectangularTexture(r,o),e.set(o,c),o.addEventListener("dispose",i),t(c.texture,o.mapping)}else return null}}return o}function i(o){const a=o.target;a.removeEventListener("dispose",i);const l=e.get(a);l!==void 0&&(e.delete(a),l.dispose())}function s(){e=new WeakMap}return{get:n,dispose:s}}class Xo extends Wo{constructor(e=-1,t=1,n=1,i=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=i,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,i,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=i,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,i=(this.top+this.bottom)/2;let s=n-e,o=n+e,a=i+t,l=i-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const si=4,Na=[.125,.215,.35,.446,.526,.582],Ln=20,os=new Xo,Oa=new ze;let ls=null;const Cn=(1+Math.sqrt(5))/2,Qn=1/Cn,za=[new N(1,1,1),new N(-1,1,1),new N(1,1,-1),new N(-1,1,-1),new N(0,Cn,Qn),new N(0,Cn,-Qn),new N(Qn,0,Cn),new N(-Qn,0,Cn),new N(Cn,Qn,0),new N(-Cn,Qn,0)];class Ua{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,i=100){ls=this._renderer.getRenderTarget(),this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(e,n,i,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ga(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ba(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(ls),e.scissorTest=!1,ir(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ci||e.mapping===ui?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),ls=this._renderer.getRenderTarget();const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Nt,minFilter:Nt,generateMipmaps:!1,type:Di,format:Gt,encoding:Nn,depthBuffer:!1},i=Fa(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Fa(e,t,n);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Hh(s)),this._blurMaterial=Wh(s,e,t)}return i}_compileMaterial(e){const t=new pn(this._lodPlanes[0],e);this._renderer.compile(t,os)}_sceneToCubeUV(e,t,n,i){const a=new Ot(90,1,t,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],u=this._renderer,h=u.autoClear,d=u.toneMapping;u.getClearColor(Oa),u.toneMapping=rn,u.autoClear=!1;const m=new Go({name:"PMREM.Background",side:At,depthWrite:!1,depthTest:!1}),g=new pn(new Fi,m);let p=!1;const f=e.background;f?f.isColor&&(m.color.copy(f),e.background=null,p=!0):(m.color.copy(Oa),p=!0);for(let v=0;v<6;v++){const M=v%3;M===0?(a.up.set(0,l[v],0),a.lookAt(c[v],0,0)):M===1?(a.up.set(0,0,l[v]),a.lookAt(0,c[v],0)):(a.up.set(0,l[v],0),a.lookAt(0,0,c[v]));const _=this._cubeSize;ir(i,M*_,v>2?_:0,_,_),u.setRenderTarget(i),p&&u.render(g,a),u.render(e,a)}g.geometry.dispose(),g.material.dispose(),u.toneMapping=d,u.autoClear=h,e.background=f}_textureToCubeUV(e,t){const n=this._renderer,i=e.mapping===ci||e.mapping===ui;i?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ga()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ba());const s=i?this._cubemapMaterial:this._equirectMaterial,o=new pn(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=e;const l=this._cubeSize;ir(t,0,0,3*l,2*l),n.setRenderTarget(t),n.render(o,os)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;for(let i=1;i<this._lodPlanes.length;i++){const s=Math.sqrt(this._sigmas[i]*this._sigmas[i]-this._sigmas[i-1]*this._sigmas[i-1]),o=za[(i-1)%za.length];this._blur(e,i-1,i,s,o)}t.autoClear=n}_blur(e,t,n,i,s){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,i,"latitudinal",s),this._halfBlur(o,e,n,n,i,"longitudinal",s)}_halfBlur(e,t,n,i,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const u=3,h=new pn(this._lodPlanes[i],c),d=c.uniforms,m=this._sizeLods[n]-1,g=isFinite(s)?Math.PI/(2*m):2*Math.PI/(2*Ln-1),p=s/g,f=isFinite(s)?1+Math.floor(u*p):Ln;f>Ln&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${f} samples when the maximum is set to ${Ln}`);const v=[];let M=0;for(let U=0;U<Ln;++U){const y=U/p,T=Math.exp(-y*y/2);v.push(T),U===0?M+=T:U<f&&(M+=2*T)}for(let U=0;U<v.length;U++)v[U]=v[U]/M;d.envMap.value=e.texture,d.samples.value=f,d.weights.value=v,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:_}=this;d.dTheta.value=g,d.mipInt.value=_-n;const E=this._sizeLods[i],w=3*E*(i>_-si?i-_+si:0),L=4*(this._cubeSize-E);ir(t,w,L,3*E,2*E),l.setRenderTarget(t),l.render(h,os)}}function Hh(r){const e=[],t=[],n=[];let i=r;const s=r-si+1+Na.length;for(let o=0;o<s;o++){const a=Math.pow(2,i);t.push(a);let l=1/a;o>r-si?l=Na[o-r+si-1]:o===0&&(l=0),n.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],m=6,g=6,p=3,f=2,v=1,M=new Float32Array(p*g*m),_=new Float32Array(f*g*m),E=new Float32Array(v*g*m);for(let L=0;L<m;L++){const U=L%3*2/3-1,y=L>2?0:-1,T=[U,y,0,U+2/3,y,0,U+2/3,y+1,0,U,y,0,U+2/3,y+1,0,U,y+1,0];M.set(T,p*g*L),_.set(d,f*g*L);const F=[L,L,L,L,L,L];E.set(F,v*g*L)}const w=new Pt;w.setAttribute("position",new Lt(M,p)),w.setAttribute("uv",new Lt(_,f)),w.setAttribute("faceIndex",new Lt(E,v)),e.push(w),i>si&&i--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function Fa(r,e,t){const n=new On(r,e,t);return n.texture.mapping=Tr,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ir(r,e,t,n,i){r.viewport.set(e,t,n,i),r.scissor.set(e,t,n,i)}function Wh(r,e,t){const n=new Float32Array(Ln),i=new N(0,1,0);return new zn({name:"SphericalGaussianBlur",defines:{n:Ln,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${r}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:i}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Ba(){return new zn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Ga(){return new zn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ds(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:gn,depthTest:!1,depthWrite:!1})}function Ds(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function jh(r){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){const l=a.mapping,c=l===vs||l===ys,u=l===ci||l===ui;if(c||u)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let h=e.get(a);return t===null&&(t=new Ua(r)),h=c?t.fromEquirectangular(a,h):t.fromCubemap(a,h),e.set(a,h),h.texture}else{if(e.has(a))return e.get(a).texture;{const h=a.image;if(c&&h&&h.height>0||u&&h&&i(h)){t===null&&(t=new Ua(r));const d=c?t.fromEquirectangular(a):t.fromCubemap(a);return e.set(a,d),a.addEventListener("dispose",s),d.texture}else return null}}}return a}function i(a){let l=0;const c=6;for(let u=0;u<c;u++)a[u]!==void 0&&l++;return l===c}function s(a){const l=a.target;l.removeEventListener("dispose",s);const c=e.get(l);c!==void 0&&(e.delete(l),c.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function qh(r){const e={};function t(n){if(e[n]!==void 0)return e[n];let i;switch(n){case"WEBGL_depth_texture":i=r.getExtension("WEBGL_depth_texture")||r.getExtension("MOZ_WEBGL_depth_texture")||r.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":i=r.getExtension("EXT_texture_filter_anisotropic")||r.getExtension("MOZ_EXT_texture_filter_anisotropic")||r.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":i=r.getExtension("WEBGL_compressed_texture_s3tc")||r.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":i=r.getExtension("WEBGL_compressed_texture_pvrtc")||r.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:i=r.getExtension(n)}return e[n]=i,i}return{has:function(n){return t(n)!==null},init:function(n){n.isWebGL2?t("EXT_color_buffer_float"):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(n){const i=t(n);return i===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),i}}}function Xh(r,e,t,n){const i={},s=new WeakMap;function o(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const g in d.attributes)e.remove(d.attributes[g]);d.removeEventListener("dispose",o),delete i[d.id];const m=s.get(d);m&&(e.remove(m),s.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return i[d.id]===!0||(d.addEventListener("dispose",o),i[d.id]=!0,t.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)e.update(d[g],34962);const m=h.morphAttributes;for(const g in m){const p=m[g];for(let f=0,v=p.length;f<v;f++)e.update(p[f],34962)}}function c(h){const d=[],m=h.index,g=h.attributes.position;let p=0;if(m!==null){const M=m.array;p=m.version;for(let _=0,E=M.length;_<E;_+=3){const w=M[_+0],L=M[_+1],U=M[_+2];d.push(w,L,L,U,U,w)}}else{const M=g.array;p=g.version;for(let _=0,E=M.length/3-1;_<E;_+=3){const w=_+0,L=_+1,U=_+2;d.push(w,L,L,U,U,w)}}const f=new(No(d)?Vo:ko)(d,1);f.version=p;const v=s.get(h);v&&e.remove(v),s.set(h,f)}function u(h){const d=s.get(h);if(d){const m=h.index;m!==null&&d.version<m.version&&c(h)}else c(h);return s.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function Yh(r,e,t,n){const i=n.isWebGL2;let s;function o(d){s=d}let a,l;function c(d){a=d.type,l=d.bytesPerElement}function u(d,m){r.drawElements(s,m,a,d*l),t.update(m,s,1)}function h(d,m,g){if(g===0)return;let p,f;if(i)p=r,f="drawElementsInstanced";else if(p=e.get("ANGLE_instanced_arrays"),f="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[f](s,m,a,d*l,g),t.update(m,s,g)}this.setMode=o,this.setIndex=c,this.render=u,this.renderInstances=h}function $h(r){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,o,a){switch(t.calls++,o){case 4:t.triangles+=a*(s/3);break;case 1:t.lines+=a*(s/2);break;case 3:t.lines+=a*(s-1);break;case 2:t.lines+=a*s;break;case 0:t.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function i(){t.frame++,t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:i,update:n}}function Kh(r,e){return r[0]-e[0]}function Zh(r,e){return Math.abs(e[1])-Math.abs(r[1])}function Jh(r,e,t){const n={},i=new Float32Array(8),s=new WeakMap,o=new st,a=[];for(let c=0;c<8;c++)a[c]=[c,0];function l(c,u,h){const d=c.morphTargetInfluences;if(e.isWebGL2===!0){const m=u.morphAttributes.position||u.morphAttributes.normal||u.morphAttributes.color,g=m!==void 0?m.length:0;let p=s.get(u);if(p===void 0||p.count!==g){let P=function(){Y.dispose(),s.delete(u),u.removeEventListener("dispose",P)};p!==void 0&&p.texture.dispose();const M=u.morphAttributes.position!==void 0,_=u.morphAttributes.normal!==void 0,E=u.morphAttributes.color!==void 0,w=u.morphAttributes.position||[],L=u.morphAttributes.normal||[],U=u.morphAttributes.color||[];let y=0;M===!0&&(y=1),_===!0&&(y=2),E===!0&&(y=3);let T=u.attributes.position.count*y,F=1;T>e.maxTextureSize&&(F=Math.ceil(T/e.maxTextureSize),T=e.maxTextureSize);const D=new Float32Array(T*F*4*g),Y=new Uo(D,T,F,g);Y.type=Pn,Y.needsUpdate=!0;const I=y*4;for(let V=0;V<g;V++){const $=w[V],Q=L[V],q=U[V],K=T*F*4*V;for(let ee=0;ee<$.count;ee++){const pe=ee*I;M===!0&&(o.fromBufferAttribute($,ee),D[K+pe+0]=o.x,D[K+pe+1]=o.y,D[K+pe+2]=o.z,D[K+pe+3]=0),_===!0&&(o.fromBufferAttribute(Q,ee),D[K+pe+4]=o.x,D[K+pe+5]=o.y,D[K+pe+6]=o.z,D[K+pe+7]=0),E===!0&&(o.fromBufferAttribute(q,ee),D[K+pe+8]=o.x,D[K+pe+9]=o.y,D[K+pe+10]=o.z,D[K+pe+11]=q.itemSize===4?o.w:1)}}p={count:g,texture:Y,size:new De(T,F)},s.set(u,p),u.addEventListener("dispose",P)}let f=0;for(let M=0;M<d.length;M++)f+=d[M];const v=u.morphTargetsRelative?1:1-f;h.getUniforms().setValue(r,"morphTargetBaseInfluence",v),h.getUniforms().setValue(r,"morphTargetInfluences",d),h.getUniforms().setValue(r,"morphTargetsTexture",p.texture,t),h.getUniforms().setValue(r,"morphTargetsTextureSize",p.size)}else{const m=d===void 0?0:d.length;let g=n[u.id];if(g===void 0||g.length!==m){g=[];for(let _=0;_<m;_++)g[_]=[_,0];n[u.id]=g}for(let _=0;_<m;_++){const E=g[_];E[0]=_,E[1]=d[_]}g.sort(Zh);for(let _=0;_<8;_++)_<m&&g[_][1]?(a[_][0]=g[_][0],a[_][1]=g[_][1]):(a[_][0]=Number.MAX_SAFE_INTEGER,a[_][1]=0);a.sort(Kh);const p=u.morphAttributes.position,f=u.morphAttributes.normal;let v=0;for(let _=0;_<8;_++){const E=a[_],w=E[0],L=E[1];w!==Number.MAX_SAFE_INTEGER&&L?(p&&u.getAttribute("morphTarget"+_)!==p[w]&&u.setAttribute("morphTarget"+_,p[w]),f&&u.getAttribute("morphNormal"+_)!==f[w]&&u.setAttribute("morphNormal"+_,f[w]),i[_]=L,v+=L):(p&&u.hasAttribute("morphTarget"+_)===!0&&u.deleteAttribute("morphTarget"+_),f&&u.hasAttribute("morphNormal"+_)===!0&&u.deleteAttribute("morphNormal"+_),i[_]=0)}const M=u.morphTargetsRelative?1:1-v;h.getUniforms().setValue(r,"morphTargetBaseInfluence",M),h.getUniforms().setValue(r,"morphTargetInfluences",i)}}return{update:l}}function Qh(r,e,t,n){let i=new WeakMap;function s(l){const c=n.render.frame,u=l.geometry,h=e.get(l,u);return i.get(h)!==c&&(e.update(h),i.set(h,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",a)===!1&&l.addEventListener("dispose",a),t.update(l.instanceMatrix,34962),l.instanceColor!==null&&t.update(l.instanceColor,34962)),h}function o(){i=new WeakMap}function a(l){const c=l.target;c.removeEventListener("dispose",a),t.remove(c.instanceMatrix),c.instanceColor!==null&&t.remove(c.instanceColor)}return{update:s,dispose:o}}const Yo=new yt,$o=new Uo,Ko=new Bc,Zo=new jo,ka=[],Va=[],Ha=new Float32Array(16),Wa=new Float32Array(9),ja=new Float32Array(4);function pi(r,e,t){const n=r[0];if(n<=0||n>0)return r;const i=e*t;let s=ka[i];if(s===void 0&&(s=new Float32Array(i),ka[i]=s),e!==0){n.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,r[o].toArray(s,a)}return s}function Ke(r,e){if(r.length!==e.length)return!1;for(let t=0,n=r.length;t<n;t++)if(r[t]!==e[t])return!1;return!0}function Ze(r,e){for(let t=0,n=e.length;t<n;t++)r[t]=e[t]}function Ar(r,e){let t=Va[e];t===void 0&&(t=new Int32Array(e),Va[e]=t);for(let n=0;n!==e;++n)t[n]=r.allocateTextureUnit();return t}function ef(r,e){const t=this.cache;t[0]!==e&&(r.uniform1f(this.addr,e),t[0]=e)}function tf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ke(t,e))return;r.uniform2fv(this.addr,e),Ze(t,e)}}function nf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(r.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Ke(t,e))return;r.uniform3fv(this.addr,e),Ze(t,e)}}function rf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ke(t,e))return;r.uniform4fv(this.addr,e),Ze(t,e)}}function sf(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ke(t,e))return;r.uniformMatrix2fv(this.addr,!1,e),Ze(t,e)}else{if(Ke(t,n))return;ja.set(n),r.uniformMatrix2fv(this.addr,!1,ja),Ze(t,n)}}function af(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ke(t,e))return;r.uniformMatrix3fv(this.addr,!1,e),Ze(t,e)}else{if(Ke(t,n))return;Wa.set(n),r.uniformMatrix3fv(this.addr,!1,Wa),Ze(t,n)}}function of(r,e){const t=this.cache,n=e.elements;if(n===void 0){if(Ke(t,e))return;r.uniformMatrix4fv(this.addr,!1,e),Ze(t,e)}else{if(Ke(t,n))return;Ha.set(n),r.uniformMatrix4fv(this.addr,!1,Ha),Ze(t,n)}}function lf(r,e){const t=this.cache;t[0]!==e&&(r.uniform1i(this.addr,e),t[0]=e)}function cf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ke(t,e))return;r.uniform2iv(this.addr,e),Ze(t,e)}}function uf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ke(t,e))return;r.uniform3iv(this.addr,e),Ze(t,e)}}function df(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ke(t,e))return;r.uniform4iv(this.addr,e),Ze(t,e)}}function hf(r,e){const t=this.cache;t[0]!==e&&(r.uniform1ui(this.addr,e),t[0]=e)}function ff(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(r.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Ke(t,e))return;r.uniform2uiv(this.addr,e),Ze(t,e)}}function pf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(r.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Ke(t,e))return;r.uniform3uiv(this.addr,e),Ze(t,e)}}function mf(r,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(r.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Ke(t,e))return;r.uniform4uiv(this.addr,e),Ze(t,e)}}function gf(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture2D(e||Yo,i)}function _f(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture3D(e||Ko,i)}function xf(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTextureCube(e||Zo,i)}function vf(r,e,t){const n=this.cache,i=t.allocateTextureUnit();n[0]!==i&&(r.uniform1i(this.addr,i),n[0]=i),t.setTexture2DArray(e||$o,i)}function yf(r){switch(r){case 5126:return ef;case 35664:return tf;case 35665:return nf;case 35666:return rf;case 35674:return sf;case 35675:return af;case 35676:return of;case 5124:case 35670:return lf;case 35667:case 35671:return cf;case 35668:case 35672:return uf;case 35669:case 35673:return df;case 5125:return hf;case 36294:return ff;case 36295:return pf;case 36296:return mf;case 35678:case 36198:case 36298:case 36306:case 35682:return gf;case 35679:case 36299:case 36307:return _f;case 35680:case 36300:case 36308:case 36293:return xf;case 36289:case 36303:case 36311:case 36292:return vf}}function Sf(r,e){r.uniform1fv(this.addr,e)}function Mf(r,e){const t=pi(e,this.size,2);r.uniform2fv(this.addr,t)}function bf(r,e){const t=pi(e,this.size,3);r.uniform3fv(this.addr,t)}function wf(r,e){const t=pi(e,this.size,4);r.uniform4fv(this.addr,t)}function Ef(r,e){const t=pi(e,this.size,4);r.uniformMatrix2fv(this.addr,!1,t)}function Tf(r,e){const t=pi(e,this.size,9);r.uniformMatrix3fv(this.addr,!1,t)}function Cf(r,e){const t=pi(e,this.size,16);r.uniformMatrix4fv(this.addr,!1,t)}function Af(r,e){r.uniform1iv(this.addr,e)}function Lf(r,e){r.uniform2iv(this.addr,e)}function Rf(r,e){r.uniform3iv(this.addr,e)}function Pf(r,e){r.uniform4iv(this.addr,e)}function Df(r,e){r.uniform1uiv(this.addr,e)}function If(r,e){r.uniform2uiv(this.addr,e)}function Nf(r,e){r.uniform3uiv(this.addr,e)}function Of(r,e){r.uniform4uiv(this.addr,e)}function zf(r,e,t){const n=this.cache,i=e.length,s=Ar(t,i);Ke(n,s)||(r.uniform1iv(this.addr,s),Ze(n,s));for(let o=0;o!==i;++o)t.setTexture2D(e[o]||Yo,s[o])}function Uf(r,e,t){const n=this.cache,i=e.length,s=Ar(t,i);Ke(n,s)||(r.uniform1iv(this.addr,s),Ze(n,s));for(let o=0;o!==i;++o)t.setTexture3D(e[o]||Ko,s[o])}function Ff(r,e,t){const n=this.cache,i=e.length,s=Ar(t,i);Ke(n,s)||(r.uniform1iv(this.addr,s),Ze(n,s));for(let o=0;o!==i;++o)t.setTextureCube(e[o]||Zo,s[o])}function Bf(r,e,t){const n=this.cache,i=e.length,s=Ar(t,i);Ke(n,s)||(r.uniform1iv(this.addr,s),Ze(n,s));for(let o=0;o!==i;++o)t.setTexture2DArray(e[o]||$o,s[o])}function Gf(r){switch(r){case 5126:return Sf;case 35664:return Mf;case 35665:return bf;case 35666:return wf;case 35674:return Ef;case 35675:return Tf;case 35676:return Cf;case 5124:case 35670:return Af;case 35667:case 35671:return Lf;case 35668:case 35672:return Rf;case 35669:case 35673:return Pf;case 5125:return Df;case 36294:return If;case 36295:return Nf;case 36296:return Of;case 35678:case 36198:case 36298:case 36306:case 35682:return zf;case 35679:case 36299:case 36307:return Uf;case 35680:case 36300:case 36308:case 36293:return Ff;case 36289:case 36303:case 36311:case 36292:return Bf}}class kf{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.setValue=yf(t.type)}}class Vf{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.size=t.size,this.setValue=Gf(t.type)}}class Hf{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const i=this.seq;for(let s=0,o=i.length;s!==o;++s){const a=i[s];a.setValue(e,t[a.id],n)}}}const cs=/(\w+)(\])?(\[|\.)?/g;function qa(r,e){r.seq.push(e),r.map[e.id]=e}function Wf(r,e,t){const n=r.name,i=n.length;for(cs.lastIndex=0;;){const s=cs.exec(n),o=cs.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===i){qa(t,c===void 0?new kf(a,r,e):new Vf(a,r,e));break}else{let h=t.map[a];h===void 0&&(h=new Hf(a),qa(t,h)),t=h}}}class mr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,35718);for(let i=0;i<n;++i){const s=e.getActiveUniform(t,i),o=e.getUniformLocation(t,s.name);Wf(s,o,this)}}setValue(e,t,n,i){const s=this.map[t];s!==void 0&&s.setValue(e,n,i)}setOptional(e,t,n){const i=t[n];i!==void 0&&this.setValue(e,n,i)}static upload(e,t,n,i){for(let s=0,o=t.length;s!==o;++s){const a=t[s],l=n[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,i)}}static seqWithValue(e,t){const n=[];for(let i=0,s=e.length;i!==s;++i){const o=e[i];o.id in t&&n.push(o)}return n}}function Xa(r,e,t){const n=r.createShader(e);return r.shaderSource(n,t),r.compileShader(n),n}let jf=0;function qf(r,e){const t=r.split(`
`),n=[],i=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=i;o<s;o++){const a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}function Xf(r){switch(r){case Nn:return["Linear","( value )"];case ke:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported encoding:",r),["Linear","( value )"]}}function Ya(r,e,t){const n=r.getShaderParameter(e,35713),i=r.getShaderInfoLog(e).trim();if(n&&i==="")return"";const s=/ERROR: 0:(\d+)/.exec(i);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+i+`

`+qf(r.getShaderSource(e),o)}else return i}function Yf(r,e){const t=Xf(e);return"vec4 "+r+"( vec4 value ) { return LinearTo"+t[0]+t[1]+"; }"}function $f(r,e){let t;switch(e){case rc:t="Linear";break;case sc:t="Reinhard";break;case ac:t="OptimizedCineon";break;case oc:t="ACESFilmic";break;case lc:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+r+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Kf(r){return[r.extensionDerivatives||r.envMapCubeUVHeight||r.bumpMap||r.tangentSpaceNormalMap||r.clearcoatNormalMap||r.flatShading||r.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(r.extensionFragDepth||r.logarithmicDepthBuffer)&&r.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",r.extensionDrawBuffers&&r.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(r.extensionShaderTextureLOD||r.envMap||r.transmission)&&r.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Li).join(`
`)}function Zf(r){const e=[];for(const t in r){const n=r[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function Jf(r,e){const t={},n=r.getProgramParameter(e,35721);for(let i=0;i<n;i++){const s=r.getActiveAttrib(e,i),o=s.name;let a=1;s.type===35674&&(a=2),s.type===35675&&(a=3),s.type===35676&&(a=4),t[o]={type:s.type,location:r.getAttribLocation(e,o),locationSize:a}}return t}function Li(r){return r!==""}function $a(r,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return r.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Ka(r,e){return r.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Qf=/^[ \t]*#include +<([\w\d./]+)>/gm;function Es(r){return r.replace(Qf,ep)}function ep(r,e){const t=we[e];if(t===void 0)throw new Error("Can not resolve #include <"+e+">");return Es(t)}const tp=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Za(r){return r.replace(tp,np)}function np(r,e,t,n){let i="";for(let s=parseInt(e);s<parseInt(t);s++)i+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return i}function Ja(r){let e="precision "+r.precision+` float;
precision `+r.precision+" int;";return r.precision==="highp"?e+=`
#define HIGH_PRECISION`:r.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:r.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function ip(r){let e="SHADOWMAP_TYPE_BASIC";return r.shadowMapType===Co?e="SHADOWMAP_TYPE_PCF":r.shadowMapType===zl?e="SHADOWMAP_TYPE_PCF_SOFT":r.shadowMapType===Ai&&(e="SHADOWMAP_TYPE_VSM"),e}function rp(r){let e="ENVMAP_TYPE_CUBE";if(r.envMap)switch(r.envMapMode){case ci:case ui:e="ENVMAP_TYPE_CUBE";break;case Tr:e="ENVMAP_TYPE_CUBE_UV";break}return e}function sp(r){let e="ENVMAP_MODE_REFLECTION";if(r.envMap)switch(r.envMapMode){case ui:e="ENVMAP_MODE_REFRACTION";break}return e}function ap(r){let e="ENVMAP_BLENDING_NONE";if(r.envMap)switch(r.combine){case Ro:e="ENVMAP_BLENDING_MULTIPLY";break;case nc:e="ENVMAP_BLENDING_MIX";break;case ic:e="ENVMAP_BLENDING_ADD";break}return e}function op(r){const e=r.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function lp(r,e,t,n){const i=r.getContext(),s=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=ip(t),c=rp(t),u=sp(t),h=ap(t),d=op(t),m=t.isWebGL2?"":Kf(t),g=Zf(s),p=i.createProgram();let f,v,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(f=[g].filter(Li).join(`
`),f.length>0&&(f+=`
`),v=[m,g].filter(Li).join(`
`),v.length>0&&(v+=`
`)):(f=[Ja(t),"#define SHADER_NAME "+t.shaderName,g,t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.supportsVertexTextures?"#define VERTEX_TEXTURES":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.displacementMap&&t.supportsVertexTextures?"#define USE_DISPLACEMENTMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Li).join(`
`),v=[m,Ja(t),"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMap&&t.objectSpaceNormalMap?"#define OBJECTSPACE_NORMALMAP":"",t.normalMap&&t.tangentSpaceNormalMap?"#define TANGENTSPACE_NORMALMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularIntensityMap?"#define USE_SPECULARINTENSITYMAP":"",t.specularColorMap?"#define USE_SPECULARCOLORMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEENCOLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEENROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUvs?"#define USE_UV":"",t.uvsVertexOnly?"#define UVS_VERTEX_ONLY":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==rn?"#define TONE_MAPPING":"",t.toneMapping!==rn?we.tonemapping_pars_fragment:"",t.toneMapping!==rn?$f("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",we.encodings_pars_fragment,Yf("linearToOutputTexel",t.outputEncoding),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Li).join(`
`)),o=Es(o),o=$a(o,t),o=Ka(o,t),a=Es(a),a=$a(a,t),a=Ka(a,t),o=Za(o),a=Za(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,f=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+f,v=["#define varying in",t.glslVersion===ya?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ya?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+v);const _=M+f+o,E=M+v+a,w=Xa(i,35633,_),L=Xa(i,35632,E);if(i.attachShader(p,w),i.attachShader(p,L),t.index0AttributeName!==void 0?i.bindAttribLocation(p,0,t.index0AttributeName):t.morphTargets===!0&&i.bindAttribLocation(p,0,"position"),i.linkProgram(p),r.debug.checkShaderErrors){const T=i.getProgramInfoLog(p).trim(),F=i.getShaderInfoLog(w).trim(),D=i.getShaderInfoLog(L).trim();let Y=!0,I=!0;if(i.getProgramParameter(p,35714)===!1){Y=!1;const P=Ya(i,w,"vertex"),V=Ya(i,L,"fragment");console.error("THREE.WebGLProgram: Shader Error "+i.getError()+" - VALIDATE_STATUS "+i.getProgramParameter(p,35715)+`

Program Info Log: `+T+`
`+P+`
`+V)}else T!==""?console.warn("THREE.WebGLProgram: Program Info Log:",T):(F===""||D==="")&&(I=!1);I&&(this.diagnostics={runnable:Y,programLog:T,vertexShader:{log:F,prefix:f},fragmentShader:{log:D,prefix:v}})}i.deleteShader(w),i.deleteShader(L);let U;this.getUniforms=function(){return U===void 0&&(U=new mr(i,p)),U};let y;return this.getAttributes=function(){return y===void 0&&(y=Jf(i,p)),y},this.destroy=function(){n.releaseStatesOfProgram(this),i.deleteProgram(p),this.program=void 0},this.name=t.shaderName,this.id=jf++,this.cacheKey=e,this.usedTimes=1,this.program=p,this.vertexShader=w,this.fragmentShader=L,this}let cp=0;class up{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,i=this._getShaderStage(t),s=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(i)===!1&&(o.add(i),i.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new dp(e),t.set(e,n)),n}}class dp{constructor(e){this.id=cp++,this.code=e,this.usedTimes=0}}function hp(r,e,t,n,i,s,o){const a=new Fo,l=new up,c=[],u=i.isWebGL2,h=i.logarithmicDepthBuffer,d=i.vertexTextures;let m=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(y,T,F,D,Y){const I=D.fog,P=Y.geometry,V=y.isMeshStandardMaterial?D.environment:null,$=(y.isMeshStandardMaterial?t:e).get(y.envMap||V),Q=$&&$.mapping===Tr?$.image.height:null,q=g[y.type];y.precision!==null&&(m=i.getMaxPrecision(y.precision),m!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",m,"instead."));const K=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,ee=K!==void 0?K.length:0;let pe=0;P.morphAttributes.position!==void 0&&(pe=1),P.morphAttributes.normal!==void 0&&(pe=2),P.morphAttributes.color!==void 0&&(pe=3);let k,Z,re,B;if(q){const be=Yt[q];k=be.vertexShader,Z=be.fragmentShader}else k=y.vertexShader,Z=y.fragmentShader,l.update(y),re=l.getVertexShaderID(y),B=l.getFragmentShaderID(y);const ce=r.getRenderTarget(),ue=y.alphaTest>0,he=y.clearcoat>0,de=y.iridescence>0;return{isWebGL2:u,shaderID:q,shaderName:y.type,vertexShader:k,fragmentShader:Z,defines:y.defines,customVertexShaderID:re,customFragmentShaderID:B,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:m,instancing:Y.isInstancedMesh===!0,instancingColor:Y.isInstancedMesh===!0&&Y.instanceColor!==null,supportsVertexTextures:d,outputEncoding:ce===null?r.outputEncoding:ce.isXRRenderTarget===!0?ce.texture.encoding:Nn,map:!!y.map,matcap:!!y.matcap,envMap:!!$,envMapMode:$&&$.mapping,envMapCubeUVHeight:Q,lightMap:!!y.lightMap,aoMap:!!y.aoMap,emissiveMap:!!y.emissiveMap,bumpMap:!!y.bumpMap,normalMap:!!y.normalMap,objectSpaceNormalMap:y.normalMapType===Ac,tangentSpaceNormalMap:y.normalMapType===Cc,decodeVideoTexture:!!y.map&&y.map.isVideoTexture===!0&&y.map.encoding===ke,clearcoat:he,clearcoatMap:he&&!!y.clearcoatMap,clearcoatRoughnessMap:he&&!!y.clearcoatRoughnessMap,clearcoatNormalMap:he&&!!y.clearcoatNormalMap,iridescence:de,iridescenceMap:de&&!!y.iridescenceMap,iridescenceThicknessMap:de&&!!y.iridescenceThicknessMap,displacementMap:!!y.displacementMap,roughnessMap:!!y.roughnessMap,metalnessMap:!!y.metalnessMap,specularMap:!!y.specularMap,specularIntensityMap:!!y.specularIntensityMap,specularColorMap:!!y.specularColorMap,opaque:y.transparent===!1&&y.blending===ai,alphaMap:!!y.alphaMap,alphaTest:ue,gradientMap:!!y.gradientMap,sheen:y.sheen>0,sheenColorMap:!!y.sheenColorMap,sheenRoughnessMap:!!y.sheenRoughnessMap,transmission:y.transmission>0,transmissionMap:!!y.transmissionMap,thicknessMap:!!y.thicknessMap,combine:y.combine,vertexTangents:!!y.normalMap&&!!P.attributes.tangent,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,vertexUvs:!!y.map||!!y.bumpMap||!!y.normalMap||!!y.specularMap||!!y.alphaMap||!!y.emissiveMap||!!y.roughnessMap||!!y.metalnessMap||!!y.clearcoatMap||!!y.clearcoatRoughnessMap||!!y.clearcoatNormalMap||!!y.iridescenceMap||!!y.iridescenceThicknessMap||!!y.displacementMap||!!y.transmissionMap||!!y.thicknessMap||!!y.specularIntensityMap||!!y.specularColorMap||!!y.sheenColorMap||!!y.sheenRoughnessMap,uvsVertexOnly:!(y.map||y.bumpMap||y.normalMap||y.specularMap||y.alphaMap||y.emissiveMap||y.roughnessMap||y.metalnessMap||y.clearcoatNormalMap||y.iridescenceMap||y.iridescenceThicknessMap||y.transmission>0||y.transmissionMap||y.thicknessMap||y.specularIntensityMap||y.specularColorMap||y.sheen>0||y.sheenColorMap||y.sheenRoughnessMap)&&!!y.displacementMap,fog:!!I,useFog:y.fog===!0,fogExp2:I&&I.isFogExp2,flatShading:!!y.flatShading,sizeAttenuation:y.sizeAttenuation,logarithmicDepthBuffer:h,skinning:Y.isSkinnedMesh===!0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:ee,morphTextureStride:pe,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:y.dithering,shadowMapEnabled:r.shadowMap.enabled&&F.length>0,shadowMapType:r.shadowMap.type,toneMapping:y.toneMapped?r.toneMapping:rn,useLegacyLights:r.useLegacyLights,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===dn,flipSided:y.side===At,useDepthPacking:!!y.depthPacking,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionDerivatives:y.extensions&&y.extensions.derivatives,extensionFragDepth:y.extensions&&y.extensions.fragDepth,extensionDrawBuffers:y.extensions&&y.extensions.drawBuffers,extensionShaderTextureLOD:y.extensions&&y.extensions.shaderTextureLOD,rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),customProgramCacheKey:y.customProgramCacheKey()}}function f(y){const T=[];if(y.shaderID?T.push(y.shaderID):(T.push(y.customVertexShaderID),T.push(y.customFragmentShaderID)),y.defines!==void 0)for(const F in y.defines)T.push(F),T.push(y.defines[F]);return y.isRawShaderMaterial===!1&&(v(T,y),M(T,y),T.push(r.outputEncoding)),T.push(y.customProgramCacheKey),T.join()}function v(y,T){y.push(T.precision),y.push(T.outputEncoding),y.push(T.envMapMode),y.push(T.envMapCubeUVHeight),y.push(T.combine),y.push(T.vertexUvs),y.push(T.fogExp2),y.push(T.sizeAttenuation),y.push(T.morphTargetsCount),y.push(T.morphAttributeCount),y.push(T.numDirLights),y.push(T.numPointLights),y.push(T.numSpotLights),y.push(T.numSpotLightMaps),y.push(T.numHemiLights),y.push(T.numRectAreaLights),y.push(T.numDirLightShadows),y.push(T.numPointLightShadows),y.push(T.numSpotLightShadows),y.push(T.numSpotLightShadowsWithMaps),y.push(T.shadowMapType),y.push(T.toneMapping),y.push(T.numClippingPlanes),y.push(T.numClipIntersection),y.push(T.depthPacking)}function M(y,T){a.disableAll(),T.isWebGL2&&a.enable(0),T.supportsVertexTextures&&a.enable(1),T.instancing&&a.enable(2),T.instancingColor&&a.enable(3),T.map&&a.enable(4),T.matcap&&a.enable(5),T.envMap&&a.enable(6),T.lightMap&&a.enable(7),T.aoMap&&a.enable(8),T.emissiveMap&&a.enable(9),T.bumpMap&&a.enable(10),T.normalMap&&a.enable(11),T.objectSpaceNormalMap&&a.enable(12),T.tangentSpaceNormalMap&&a.enable(13),T.clearcoat&&a.enable(14),T.clearcoatMap&&a.enable(15),T.clearcoatRoughnessMap&&a.enable(16),T.clearcoatNormalMap&&a.enable(17),T.iridescence&&a.enable(18),T.iridescenceMap&&a.enable(19),T.iridescenceThicknessMap&&a.enable(20),T.displacementMap&&a.enable(21),T.specularMap&&a.enable(22),T.roughnessMap&&a.enable(23),T.metalnessMap&&a.enable(24),T.gradientMap&&a.enable(25),T.alphaMap&&a.enable(26),T.alphaTest&&a.enable(27),T.vertexColors&&a.enable(28),T.vertexAlphas&&a.enable(29),T.vertexUvs&&a.enable(30),T.vertexTangents&&a.enable(31),T.uvsVertexOnly&&a.enable(32),y.push(a.mask),a.disableAll(),T.fog&&a.enable(0),T.useFog&&a.enable(1),T.flatShading&&a.enable(2),T.logarithmicDepthBuffer&&a.enable(3),T.skinning&&a.enable(4),T.morphTargets&&a.enable(5),T.morphNormals&&a.enable(6),T.morphColors&&a.enable(7),T.premultipliedAlpha&&a.enable(8),T.shadowMapEnabled&&a.enable(9),T.useLegacyLights&&a.enable(10),T.doubleSided&&a.enable(11),T.flipSided&&a.enable(12),T.useDepthPacking&&a.enable(13),T.dithering&&a.enable(14),T.specularIntensityMap&&a.enable(15),T.specularColorMap&&a.enable(16),T.transmission&&a.enable(17),T.transmissionMap&&a.enable(18),T.thicknessMap&&a.enable(19),T.sheen&&a.enable(20),T.sheenColorMap&&a.enable(21),T.sheenRoughnessMap&&a.enable(22),T.decodeVideoTexture&&a.enable(23),T.opaque&&a.enable(24),y.push(a.mask)}function _(y){const T=g[y.type];let F;if(T){const D=Yt[T];F=Zc.clone(D.uniforms)}else F=y.uniforms;return F}function E(y,T){let F;for(let D=0,Y=c.length;D<Y;D++){const I=c[D];if(I.cacheKey===T){F=I,++F.usedTimes;break}}return F===void 0&&(F=new lp(r,T,y,s),c.push(F)),F}function w(y){if(--y.usedTimes===0){const T=c.indexOf(y);c[T]=c[c.length-1],c.pop(),y.destroy()}}function L(y){l.remove(y)}function U(){l.dispose()}return{getParameters:p,getProgramCacheKey:f,getUniforms:_,acquireProgram:E,releaseProgram:w,releaseShaderCache:L,programs:c,dispose:U}}function fp(){let r=new WeakMap;function e(s){let o=r.get(s);return o===void 0&&(o={},r.set(s,o)),o}function t(s){r.delete(s)}function n(s,o,a){r.get(s)[o]=a}function i(){r=new WeakMap}return{get:e,remove:t,update:n,dispose:i}}function pp(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.material.id!==e.material.id?r.material.id-e.material.id:r.z!==e.z?r.z-e.z:r.id-e.id}function Qa(r,e){return r.groupOrder!==e.groupOrder?r.groupOrder-e.groupOrder:r.renderOrder!==e.renderOrder?r.renderOrder-e.renderOrder:r.z!==e.z?e.z-r.z:r.id-e.id}function eo(){const r=[];let e=0;const t=[],n=[],i=[];function s(){e=0,t.length=0,n.length=0,i.length=0}function o(h,d,m,g,p,f){let v=r[e];return v===void 0?(v={id:h.id,object:h,geometry:d,material:m,groupOrder:g,renderOrder:h.renderOrder,z:p,group:f},r[e]=v):(v.id=h.id,v.object=h,v.geometry=d,v.material=m,v.groupOrder=g,v.renderOrder=h.renderOrder,v.z=p,v.group=f),e++,v}function a(h,d,m,g,p,f){const v=o(h,d,m,g,p,f);m.transmission>0?n.push(v):m.transparent===!0?i.push(v):t.push(v)}function l(h,d,m,g,p,f){const v=o(h,d,m,g,p,f);m.transmission>0?n.unshift(v):m.transparent===!0?i.unshift(v):t.unshift(v)}function c(h,d){t.length>1&&t.sort(h||pp),n.length>1&&n.sort(d||Qa),i.length>1&&i.sort(d||Qa)}function u(){for(let h=e,d=r.length;h<d;h++){const m=r[h];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:i,init:s,push:a,unshift:l,finish:u,sort:c}}function mp(){let r=new WeakMap;function e(n,i){const s=r.get(n);let o;return s===void 0?(o=new eo,r.set(n,[o])):i>=s.length?(o=new eo,s.push(o)):o=s[i],o}function t(){r=new WeakMap}return{get:e,dispose:t}}function gp(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new N,color:new ze};break;case"SpotLight":t={position:new N,direction:new N,color:new ze,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new N,color:new ze,distance:0,decay:0};break;case"HemisphereLight":t={direction:new N,skyColor:new ze,groundColor:new ze};break;case"RectAreaLight":t={color:new ze,position:new N,halfWidth:new N,halfHeight:new N};break}return r[e.id]=t,t}}}function _p(){const r={};return{get:function(e){if(r[e.id]!==void 0)return r[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new De,shadowCameraNear:1,shadowCameraFar:1e3};break}return r[e.id]=t,t}}}let xp=0;function vp(r,e){return(e.castShadow?2:0)-(r.castShadow?2:0)+(e.map?1:0)-(r.map?1:0)}function yp(r,e){const t=new gp,n=_p(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let u=0;u<9;u++)i.probe.push(new N);const s=new N,o=new He,a=new He;function l(u,h){let d=0,m=0,g=0;for(let D=0;D<9;D++)i.probe[D].set(0,0,0);let p=0,f=0,v=0,M=0,_=0,E=0,w=0,L=0,U=0,y=0;u.sort(vp);const T=h===!0?Math.PI:1;for(let D=0,Y=u.length;D<Y;D++){const I=u[D],P=I.color,V=I.intensity,$=I.distance,Q=I.shadow&&I.shadow.map?I.shadow.map.texture:null;if(I.isAmbientLight)d+=P.r*V*T,m+=P.g*V*T,g+=P.b*V*T;else if(I.isLightProbe)for(let q=0;q<9;q++)i.probe[q].addScaledVector(I.sh.coefficients[q],V);else if(I.isDirectionalLight){const q=t.get(I);if(q.color.copy(I.color).multiplyScalar(I.intensity*T),I.castShadow){const K=I.shadow,ee=n.get(I);ee.shadowBias=K.bias,ee.shadowNormalBias=K.normalBias,ee.shadowRadius=K.radius,ee.shadowMapSize=K.mapSize,i.directionalShadow[p]=ee,i.directionalShadowMap[p]=Q,i.directionalShadowMatrix[p]=I.shadow.matrix,E++}i.directional[p]=q,p++}else if(I.isSpotLight){const q=t.get(I);q.position.setFromMatrixPosition(I.matrixWorld),q.color.copy(P).multiplyScalar(V*T),q.distance=$,q.coneCos=Math.cos(I.angle),q.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),q.decay=I.decay,i.spot[v]=q;const K=I.shadow;if(I.map&&(i.spotLightMap[U]=I.map,U++,K.updateMatrices(I),I.castShadow&&y++),i.spotLightMatrix[v]=K.matrix,I.castShadow){const ee=n.get(I);ee.shadowBias=K.bias,ee.shadowNormalBias=K.normalBias,ee.shadowRadius=K.radius,ee.shadowMapSize=K.mapSize,i.spotShadow[v]=ee,i.spotShadowMap[v]=Q,L++}v++}else if(I.isRectAreaLight){const q=t.get(I);q.color.copy(P).multiplyScalar(V),q.halfWidth.set(I.width*.5,0,0),q.halfHeight.set(0,I.height*.5,0),i.rectArea[M]=q,M++}else if(I.isPointLight){const q=t.get(I);if(q.color.copy(I.color).multiplyScalar(I.intensity*T),q.distance=I.distance,q.decay=I.decay,I.castShadow){const K=I.shadow,ee=n.get(I);ee.shadowBias=K.bias,ee.shadowNormalBias=K.normalBias,ee.shadowRadius=K.radius,ee.shadowMapSize=K.mapSize,ee.shadowCameraNear=K.camera.near,ee.shadowCameraFar=K.camera.far,i.pointShadow[f]=ee,i.pointShadowMap[f]=Q,i.pointShadowMatrix[f]=I.shadow.matrix,w++}i.point[f]=q,f++}else if(I.isHemisphereLight){const q=t.get(I);q.skyColor.copy(I.color).multiplyScalar(V*T),q.groundColor.copy(I.groundColor).multiplyScalar(V*T),i.hemi[_]=q,_++}}M>0&&(e.isWebGL2||r.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ie.LTC_FLOAT_1,i.rectAreaLTC2=ie.LTC_FLOAT_2):r.has("OES_texture_half_float_linear")===!0?(i.rectAreaLTC1=ie.LTC_HALF_1,i.rectAreaLTC2=ie.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),i.ambient[0]=d,i.ambient[1]=m,i.ambient[2]=g;const F=i.hash;(F.directionalLength!==p||F.pointLength!==f||F.spotLength!==v||F.rectAreaLength!==M||F.hemiLength!==_||F.numDirectionalShadows!==E||F.numPointShadows!==w||F.numSpotShadows!==L||F.numSpotMaps!==U)&&(i.directional.length=p,i.spot.length=v,i.rectArea.length=M,i.point.length=f,i.hemi.length=_,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.pointShadow.length=w,i.pointShadowMap.length=w,i.spotShadow.length=L,i.spotShadowMap.length=L,i.directionalShadowMatrix.length=E,i.pointShadowMatrix.length=w,i.spotLightMatrix.length=L+U-y,i.spotLightMap.length=U,i.numSpotLightShadowsWithMaps=y,F.directionalLength=p,F.pointLength=f,F.spotLength=v,F.rectAreaLength=M,F.hemiLength=_,F.numDirectionalShadows=E,F.numPointShadows=w,F.numSpotShadows=L,F.numSpotMaps=U,i.version=xp++)}function c(u,h){let d=0,m=0,g=0,p=0,f=0;const v=h.matrixWorldInverse;for(let M=0,_=u.length;M<_;M++){const E=u[M];if(E.isDirectionalLight){const w=i.directional[d];w.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(v),d++}else if(E.isSpotLight){const w=i.spot[g];w.position.setFromMatrixPosition(E.matrixWorld),w.position.applyMatrix4(v),w.direction.setFromMatrixPosition(E.matrixWorld),s.setFromMatrixPosition(E.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(v),g++}else if(E.isRectAreaLight){const w=i.rectArea[p];w.position.setFromMatrixPosition(E.matrixWorld),w.position.applyMatrix4(v),a.identity(),o.copy(E.matrixWorld),o.premultiply(v),a.extractRotation(o),w.halfWidth.set(E.width*.5,0,0),w.halfHeight.set(0,E.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),p++}else if(E.isPointLight){const w=i.point[m];w.position.setFromMatrixPosition(E.matrixWorld),w.position.applyMatrix4(v),m++}else if(E.isHemisphereLight){const w=i.hemi[f];w.direction.setFromMatrixPosition(E.matrixWorld),w.direction.transformDirection(v),f++}}}return{setup:l,setupView:c,state:i}}function to(r,e){const t=new yp(r,e),n=[],i=[];function s(){n.length=0,i.length=0}function o(h){n.push(h)}function a(h){i.push(h)}function l(h){t.setup(n,h)}function c(h){t.setupView(n,h)}return{init:s,state:{lightsArray:n,shadowsArray:i,lights:t},setupLights:l,setupLightsView:c,pushLight:o,pushShadow:a}}function Sp(r,e){let t=new WeakMap;function n(s,o=0){const a=t.get(s);let l;return a===void 0?(l=new to(r,e),t.set(s,[l])):o>=a.length?(l=new to(r,e),a.push(l)):l=a[o],l}function i(){t=new WeakMap}return{get:n,dispose:i}}class Mp extends Un{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Ec,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class bp extends Un{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.referencePosition=new N,this.nearDistance=1,this.farDistance=1e3,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.referencePosition.copy(e.referencePosition),this.nearDistance=e.nearDistance,this.farDistance=e.farDistance,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const wp=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Ep=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Tp(r,e,t){let n=new Rs;const i=new De,s=new De,o=new st,a=new Mp({depthPacking:Tc}),l=new bp,c={},u=t.maxTextureSize,h={[xn]:At,[At]:xn,[dn]:dn},d=new zn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new De},radius:{value:4}},vertexShader:wp,fragmentShader:Ep}),m=d.clone();m.defines.HORIZONTAL_PASS=1;const g=new Pt;g.setAttribute("position",new Lt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const p=new pn(g,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Co,this.render=function(E,w,L){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||E.length===0)return;const U=r.getRenderTarget(),y=r.getActiveCubeFace(),T=r.getActiveMipmapLevel(),F=r.state;F.setBlending(gn),F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);for(let D=0,Y=E.length;D<Y;D++){const I=E[D],P=I.shadow;if(P===void 0){console.warn("THREE.WebGLShadowMap:",I,"has no shadow.");continue}if(P.autoUpdate===!1&&P.needsUpdate===!1)continue;i.copy(P.mapSize);const V=P.getFrameExtents();if(i.multiply(V),s.copy(P.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(s.x=Math.floor(u/V.x),i.x=s.x*V.x,P.mapSize.x=s.x),i.y>u&&(s.y=Math.floor(u/V.y),i.y=s.y*V.y,P.mapSize.y=s.y)),P.map===null){const Q=this.type!==Ai?{minFilter:gt,magFilter:gt}:{};P.map=new On(i.x,i.y,Q),P.map.texture.name=I.name+".shadowMap",P.camera.updateProjectionMatrix()}r.setRenderTarget(P.map),r.clear();const $=P.getViewportCount();for(let Q=0;Q<$;Q++){const q=P.getViewport(Q);o.set(s.x*q.x,s.y*q.y,s.x*q.z,s.y*q.w),F.viewport(o),P.updateMatrices(I,Q),n=P.getFrustum(),_(w,L,P.camera,I,this.type)}P.isPointLightShadow!==!0&&this.type===Ai&&v(P,L),P.needsUpdate=!1}f.needsUpdate=!1,r.setRenderTarget(U,y,T)};function v(E,w){const L=e.update(p);d.defines.VSM_SAMPLES!==E.blurSamples&&(d.defines.VSM_SAMPLES=E.blurSamples,m.defines.VSM_SAMPLES=E.blurSamples,d.needsUpdate=!0,m.needsUpdate=!0),E.mapPass===null&&(E.mapPass=new On(i.x,i.y)),d.uniforms.shadow_pass.value=E.map.texture,d.uniforms.resolution.value=E.mapSize,d.uniforms.radius.value=E.radius,r.setRenderTarget(E.mapPass),r.clear(),r.renderBufferDirect(w,null,L,d,p,null),m.uniforms.shadow_pass.value=E.mapPass.texture,m.uniforms.resolution.value=E.mapSize,m.uniforms.radius.value=E.radius,r.setRenderTarget(E.map),r.clear(),r.renderBufferDirect(w,null,L,m,p,null)}function M(E,w,L,U,y,T){let F=null;const D=L.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(D!==void 0)F=D;else if(F=L.isPointLight===!0?l:a,r.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){const Y=F.uuid,I=w.uuid;let P=c[Y];P===void 0&&(P={},c[Y]=P);let V=P[I];V===void 0&&(V=F.clone(),P[I]=V),F=V}return F.visible=w.visible,F.wireframe=w.wireframe,T===Ai?F.side=w.shadowSide!==null?w.shadowSide:w.side:F.side=w.shadowSide!==null?w.shadowSide:h[w.side],F.alphaMap=w.alphaMap,F.alphaTest=w.alphaTest,F.map=w.map,F.clipShadows=w.clipShadows,F.clippingPlanes=w.clippingPlanes,F.clipIntersection=w.clipIntersection,F.displacementMap=w.displacementMap,F.displacementScale=w.displacementScale,F.displacementBias=w.displacementBias,F.wireframeLinewidth=w.wireframeLinewidth,F.linewidth=w.linewidth,L.isPointLight===!0&&F.isMeshDistanceMaterial===!0&&(F.referencePosition.setFromMatrixPosition(L.matrixWorld),F.nearDistance=U,F.farDistance=y),F}function _(E,w,L,U,y){if(E.visible===!1)return;if(E.layers.test(w.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&y===Ai)&&(!E.frustumCulled||n.intersectsObject(E))){E.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,E.matrixWorld);const D=e.update(E),Y=E.material;if(Array.isArray(Y)){const I=D.groups;for(let P=0,V=I.length;P<V;P++){const $=I[P],Q=Y[$.materialIndex];if(Q&&Q.visible){const q=M(E,Q,U,L.near,L.far,y);r.renderBufferDirect(L,null,D,q,E,$)}}}else if(Y.visible){const I=M(E,Y,U,L.near,L.far,y);r.renderBufferDirect(L,null,D,I,E,null)}}const F=E.children;for(let D=0,Y=F.length;D<Y;D++)_(F[D],w,L,U,y)}}function Cp(r,e,t){const n=t.isWebGL2;function i(){let R=!1;const j=new st;let J=null;const le=new st(0,0,0,0);return{setMask:function(fe){J!==fe&&!R&&(r.colorMask(fe,fe,fe,fe),J=fe)},setLocked:function(fe){R=fe},setClear:function(fe,Ge,tt,dt,Ht){Ht===!0&&(fe*=dt,Ge*=dt,tt*=dt),j.set(fe,Ge,tt,dt),le.equals(j)===!1&&(r.clearColor(fe,Ge,tt,dt),le.copy(j))},reset:function(){R=!1,J=null,le.set(-1,0,0,0)}}}function s(){let R=!1,j=null,J=null,le=null;return{setTest:function(fe){fe?ue(2929):he(2929)},setMask:function(fe){j!==fe&&!R&&(r.depthMask(fe),j=fe)},setFunc:function(fe){if(J!==fe){switch(fe){case $l:r.depthFunc(512);break;case Kl:r.depthFunc(519);break;case Zl:r.depthFunc(513);break;case xs:r.depthFunc(515);break;case Jl:r.depthFunc(514);break;case Ql:r.depthFunc(518);break;case ec:r.depthFunc(516);break;case tc:r.depthFunc(517);break;default:r.depthFunc(515)}J=fe}},setLocked:function(fe){R=fe},setClear:function(fe){le!==fe&&(r.clearDepth(fe),le=fe)},reset:function(){R=!1,j=null,J=null,le=null}}}function o(){let R=!1,j=null,J=null,le=null,fe=null,Ge=null,tt=null,dt=null,Ht=null;return{setTest:function(We){R||(We?ue(2960):he(2960))},setMask:function(We){j!==We&&!R&&(r.stencilMask(We),j=We)},setFunc:function(We,Dt,Wt){(J!==We||le!==Dt||fe!==Wt)&&(r.stencilFunc(We,Dt,Wt),J=We,le=Dt,fe=Wt)},setOp:function(We,Dt,Wt){(Ge!==We||tt!==Dt||dt!==Wt)&&(r.stencilOp(We,Dt,Wt),Ge=We,tt=Dt,dt=Wt)},setLocked:function(We){R=We},setClear:function(We){Ht!==We&&(r.clearStencil(We),Ht=We)},reset:function(){R=!1,j=null,J=null,le=null,fe=null,Ge=null,tt=null,dt=null,Ht=null}}}const a=new i,l=new s,c=new o,u=new WeakMap,h=new WeakMap;let d={},m={},g=new WeakMap,p=[],f=null,v=!1,M=null,_=null,E=null,w=null,L=null,U=null,y=null,T=!1,F=null,D=null,Y=null,I=null,P=null;const V=r.getParameter(35661);let $=!1,Q=0;const q=r.getParameter(7938);q.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\d)/.exec(q)[1]),$=Q>=1):q.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),$=Q>=2);let K=null,ee={};const pe=r.getParameter(3088),k=r.getParameter(2978),Z=new st().fromArray(pe),re=new st().fromArray(k);function B(R,j,J){const le=new Uint8Array(4),fe=r.createTexture();r.bindTexture(R,fe),r.texParameteri(R,10241,9728),r.texParameteri(R,10240,9728);for(let Ge=0;Ge<J;Ge++)r.texImage2D(j+Ge,0,6408,1,1,0,6408,5121,le);return fe}const ce={};ce[3553]=B(3553,3553,1),ce[34067]=B(34067,34069,6),a.setClear(0,0,0,1),l.setClear(1),c.setClear(0),ue(2929),l.setFunc(xs),Qe(!1),et(js),ue(2884),Je(gn);function ue(R){d[R]!==!0&&(r.enable(R),d[R]=!0)}function he(R){d[R]!==!1&&(r.disable(R),d[R]=!1)}function de(R,j){return m[R]!==j?(r.bindFramebuffer(R,j),m[R]=j,n&&(R===36009&&(m[36160]=j),R===36160&&(m[36009]=j)),!0):!1}function Se(R,j){let J=p,le=!1;if(R)if(J=g.get(j),J===void 0&&(J=[],g.set(j,J)),R.isWebGLMultipleRenderTargets){const fe=R.texture;if(J.length!==fe.length||J[0]!==36064){for(let Ge=0,tt=fe.length;Ge<tt;Ge++)J[Ge]=36064+Ge;J.length=fe.length,le=!0}}else J[0]!==36064&&(J[0]=36064,le=!0);else J[0]!==1029&&(J[0]=1029,le=!0);le&&(t.isWebGL2?r.drawBuffers(J):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(J))}function be(R){return f!==R?(r.useProgram(R),f=R,!0):!1}const Ee={[ri]:32774,[Fl]:32778,[Bl]:32779};if(n)Ee[Ys]=32775,Ee[$s]=32776;else{const R=e.get("EXT_blend_minmax");R!==null&&(Ee[Ys]=R.MIN_EXT,Ee[$s]=R.MAX_EXT)}const Ie={[Gl]:0,[kl]:1,[Vl]:768,[Ao]:770,[Yl]:776,[ql]:774,[Wl]:772,[Hl]:769,[Lo]:771,[Xl]:775,[jl]:773};function Je(R,j,J,le,fe,Ge,tt,dt){if(R===gn){v===!0&&(he(3042),v=!1);return}if(v===!1&&(ue(3042),v=!0),R!==Ul){if(R!==M||dt!==T){if((_!==ri||L!==ri)&&(r.blendEquation(32774),_=ri,L=ri),dt)switch(R){case ai:r.blendFuncSeparate(1,771,1,771);break;case yr:r.blendFunc(1,1);break;case qs:r.blendFuncSeparate(0,769,0,1);break;case Xs:r.blendFuncSeparate(0,768,0,770);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}else switch(R){case ai:r.blendFuncSeparate(770,771,1,771);break;case yr:r.blendFunc(770,1);break;case qs:r.blendFuncSeparate(0,769,0,1);break;case Xs:r.blendFunc(0,768);break;default:console.error("THREE.WebGLState: Invalid blending: ",R);break}E=null,w=null,U=null,y=null,M=R,T=dt}return}fe=fe||j,Ge=Ge||J,tt=tt||le,(j!==_||fe!==L)&&(r.blendEquationSeparate(Ee[j],Ee[fe]),_=j,L=fe),(J!==E||le!==w||Ge!==U||tt!==y)&&(r.blendFuncSeparate(Ie[J],Ie[le],Ie[Ge],Ie[tt]),E=J,w=le,U=Ge,y=tt),M=R,T=!1}function ct(R,j){R.side===dn?he(2884):ue(2884);let J=R.side===At;j&&(J=!J),Qe(J),R.blending===ai&&R.transparent===!1?Je(gn):Je(R.blending,R.blendEquation,R.blendSrc,R.blendDst,R.blendEquationAlpha,R.blendSrcAlpha,R.blendDstAlpha,R.premultipliedAlpha),l.setFunc(R.depthFunc),l.setTest(R.depthTest),l.setMask(R.depthWrite),a.setMask(R.colorWrite);const le=R.stencilWrite;c.setTest(le),le&&(c.setMask(R.stencilWriteMask),c.setFunc(R.stencilFunc,R.stencilRef,R.stencilFuncMask),c.setOp(R.stencilFail,R.stencilZFail,R.stencilZPass)),Be(R.polygonOffset,R.polygonOffsetFactor,R.polygonOffsetUnits),R.alphaToCoverage===!0?ue(32926):he(32926)}function Qe(R){F!==R&&(R?r.frontFace(2304):r.frontFace(2305),F=R)}function et(R){R!==Nl?(ue(2884),R!==D&&(R===js?r.cullFace(1029):R===Ol?r.cullFace(1028):r.cullFace(1032))):he(2884),D=R}function Ve(R){R!==Y&&($&&r.lineWidth(R),Y=R)}function Be(R,j,J){R?(ue(32823),(I!==j||P!==J)&&(r.polygonOffset(j,J),I=j,P=J)):he(32823)}function St(R){R?ue(3089):he(3089)}function ut(R){R===void 0&&(R=33984+V-1),K!==R&&(r.activeTexture(R),K=R)}function b(R,j,J){J===void 0&&(K===null?J=33984+V-1:J=K);let le=ee[J];le===void 0&&(le={type:void 0,texture:void 0},ee[J]=le),(le.type!==R||le.texture!==j)&&(K!==J&&(r.activeTexture(J),K=J),r.bindTexture(R,j||ce[R]),le.type=R,le.texture=j)}function x(){const R=ee[K];R!==void 0&&R.type!==void 0&&(r.bindTexture(R.type,null),R.type=void 0,R.texture=void 0)}function W(){try{r.compressedTexImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function te(){try{r.compressedTexImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ne(){try{r.texSubImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function ae(){try{r.texSubImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function xe(){try{r.compressedTexSubImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function C(){try{r.compressedTexSubImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function O(){try{r.texStorage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function oe(){try{r.texStorage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function se(){try{r.texImage2D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function me(){try{r.texImage3D.apply(r,arguments)}catch(R){console.error("THREE.WebGLState:",R)}}function _e(R){Z.equals(R)===!1&&(r.scissor(R.x,R.y,R.z,R.w),Z.copy(R))}function ge(R){re.equals(R)===!1&&(r.viewport(R.x,R.y,R.z,R.w),re.copy(R))}function Ae(R,j){let J=h.get(j);J===void 0&&(J=new WeakMap,h.set(j,J));let le=J.get(R);le===void 0&&(le=r.getUniformBlockIndex(j,R.name),J.set(R,le))}function Ne(R,j){const le=h.get(j).get(R);u.get(j)!==le&&(r.uniformBlockBinding(j,le,R.__bindingPointIndex),u.set(j,le))}function Ue(){r.disable(3042),r.disable(2884),r.disable(2929),r.disable(32823),r.disable(3089),r.disable(2960),r.disable(32926),r.blendEquation(32774),r.blendFunc(1,0),r.blendFuncSeparate(1,0,1,0),r.colorMask(!0,!0,!0,!0),r.clearColor(0,0,0,0),r.depthMask(!0),r.depthFunc(513),r.clearDepth(1),r.stencilMask(4294967295),r.stencilFunc(519,0,4294967295),r.stencilOp(7680,7680,7680),r.clearStencil(0),r.cullFace(1029),r.frontFace(2305),r.polygonOffset(0,0),r.activeTexture(33984),r.bindFramebuffer(36160,null),n===!0&&(r.bindFramebuffer(36009,null),r.bindFramebuffer(36008,null)),r.useProgram(null),r.lineWidth(1),r.scissor(0,0,r.canvas.width,r.canvas.height),r.viewport(0,0,r.canvas.width,r.canvas.height),d={},K=null,ee={},m={},g=new WeakMap,p=[],f=null,v=!1,M=null,_=null,E=null,w=null,L=null,U=null,y=null,T=!1,F=null,D=null,Y=null,I=null,P=null,Z.set(0,0,r.canvas.width,r.canvas.height),re.set(0,0,r.canvas.width,r.canvas.height),a.reset(),l.reset(),c.reset()}return{buffers:{color:a,depth:l,stencil:c},enable:ue,disable:he,bindFramebuffer:de,drawBuffers:Se,useProgram:be,setBlending:Je,setMaterial:ct,setFlipSided:Qe,setCullFace:et,setLineWidth:Ve,setPolygonOffset:Be,setScissorTest:St,activeTexture:ut,bindTexture:b,unbindTexture:x,compressedTexImage2D:W,compressedTexImage3D:te,texImage2D:se,texImage3D:me,updateUBOMapping:Ae,uniformBlockBinding:Ne,texStorage2D:O,texStorage3D:oe,texSubImage2D:ne,texSubImage3D:ae,compressedTexSubImage2D:xe,compressedTexSubImage3D:C,scissor:_e,viewport:ge,reset:Ue}}function Ap(r,e,t,n,i,s,o){const a=i.isWebGL2,l=i.maxTextures,c=i.maxCubemapSize,u=i.maxTextureSize,h=i.maxSamples,d=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,m=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),g=new WeakMap;let p;const f=new WeakMap;let v=!1;try{v=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function M(b,x){return v?new OffscreenCanvas(b,x):Sr("canvas")}function _(b,x,W,te){let ne=1;if((b.width>te||b.height>te)&&(ne=te/Math.max(b.width,b.height)),ne<1||x===!0)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap){const ae=x?Pc:Math.floor,xe=ae(ne*b.width),C=ae(ne*b.height);p===void 0&&(p=M(xe,C));const O=W?M(xe,C):p;return O.width=xe,O.height=C,O.getContext("2d").drawImage(b,0,0,xe,C),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+b.width+"x"+b.height+") to ("+xe+"x"+C+")."),O}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+b.width+"x"+b.height+")."),b;return b}function E(b){return Ma(b.width)&&Ma(b.height)}function w(b){return a?!1:b.wrapS!==Bt||b.wrapT!==Bt||b.minFilter!==gt&&b.minFilter!==Nt}function L(b,x){return b.generateMipmaps&&x&&b.minFilter!==gt&&b.minFilter!==Nt}function U(b){r.generateMipmap(b)}function y(b,x,W,te,ne=!1){if(a===!1)return x;if(b!==null){if(r[b]!==void 0)return r[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let ae=x;return x===6403&&(W===5126&&(ae=33326),W===5131&&(ae=33325),W===5121&&(ae=33321)),x===33319&&(W===5126&&(ae=33328),W===5131&&(ae=33327),W===5121&&(ae=33323)),x===6408&&(W===5126&&(ae=34836),W===5131&&(ae=34842),W===5121&&(ae=te===ke&&ne===!1?35907:32856),W===32819&&(ae=32854),W===32820&&(ae=32855)),(ae===33325||ae===33326||ae===33327||ae===33328||ae===34842||ae===34836)&&e.get("EXT_color_buffer_float"),ae}function T(b,x,W){return L(b,W)===!0||b.isFramebufferTexture&&b.minFilter!==gt&&b.minFilter!==Nt?Math.log2(Math.max(x.width,x.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?x.mipmaps.length:1}function F(b){return b===gt||b===Ks||b===Nr?9728:9729}function D(b){const x=b.target;x.removeEventListener("dispose",D),I(x),x.isVideoTexture&&g.delete(x)}function Y(b){const x=b.target;x.removeEventListener("dispose",Y),V(x)}function I(b){const x=n.get(b);if(x.__webglInit===void 0)return;const W=b.source,te=f.get(W);if(te){const ne=te[x.__cacheKey];ne.usedTimes--,ne.usedTimes===0&&P(b),Object.keys(te).length===0&&f.delete(W)}n.remove(b)}function P(b){const x=n.get(b);r.deleteTexture(x.__webglTexture);const W=b.source,te=f.get(W);delete te[x.__cacheKey],o.memory.textures--}function V(b){const x=b.texture,W=n.get(b),te=n.get(x);if(te.__webglTexture!==void 0&&(r.deleteTexture(te.__webglTexture),o.memory.textures--),b.depthTexture&&b.depthTexture.dispose(),b.isWebGLCubeRenderTarget)for(let ne=0;ne<6;ne++)r.deleteFramebuffer(W.__webglFramebuffer[ne]),W.__webglDepthbuffer&&r.deleteRenderbuffer(W.__webglDepthbuffer[ne]);else{if(r.deleteFramebuffer(W.__webglFramebuffer),W.__webglDepthbuffer&&r.deleteRenderbuffer(W.__webglDepthbuffer),W.__webglMultisampledFramebuffer&&r.deleteFramebuffer(W.__webglMultisampledFramebuffer),W.__webglColorRenderbuffer)for(let ne=0;ne<W.__webglColorRenderbuffer.length;ne++)W.__webglColorRenderbuffer[ne]&&r.deleteRenderbuffer(W.__webglColorRenderbuffer[ne]);W.__webglDepthRenderbuffer&&r.deleteRenderbuffer(W.__webglDepthRenderbuffer)}if(b.isWebGLMultipleRenderTargets)for(let ne=0,ae=x.length;ne<ae;ne++){const xe=n.get(x[ne]);xe.__webglTexture&&(r.deleteTexture(xe.__webglTexture),o.memory.textures--),n.remove(x[ne])}n.remove(x),n.remove(b)}let $=0;function Q(){$=0}function q(){const b=$;return b>=l&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+l),$+=1,b}function K(b){const x=[];return x.push(b.wrapS),x.push(b.wrapT),x.push(b.wrapR||0),x.push(b.magFilter),x.push(b.minFilter),x.push(b.anisotropy),x.push(b.internalFormat),x.push(b.format),x.push(b.type),x.push(b.generateMipmaps),x.push(b.premultiplyAlpha),x.push(b.flipY),x.push(b.unpackAlignment),x.push(b.encoding),x.join()}function ee(b,x){const W=n.get(b);if(b.isVideoTexture&&St(b),b.isRenderTargetTexture===!1&&b.version>0&&W.__version!==b.version){const te=b.image;if(te===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(te.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{he(W,b,x);return}}t.bindTexture(3553,W.__webglTexture,33984+x)}function pe(b,x){const W=n.get(b);if(b.version>0&&W.__version!==b.version){he(W,b,x);return}t.bindTexture(35866,W.__webglTexture,33984+x)}function k(b,x){const W=n.get(b);if(b.version>0&&W.__version!==b.version){he(W,b,x);return}t.bindTexture(32879,W.__webglTexture,33984+x)}function Z(b,x){const W=n.get(b);if(b.version>0&&W.__version!==b.version){de(W,b,x);return}t.bindTexture(34067,W.__webglTexture,33984+x)}const re={[Ss]:10497,[Bt]:33071,[Ms]:33648},B={[gt]:9728,[Ks]:9984,[Nr]:9986,[Nt]:9729,[cc]:9985,[Pi]:9987};function ce(b,x,W){if(W?(r.texParameteri(b,10242,re[x.wrapS]),r.texParameteri(b,10243,re[x.wrapT]),(b===32879||b===35866)&&r.texParameteri(b,32882,re[x.wrapR]),r.texParameteri(b,10240,B[x.magFilter]),r.texParameteri(b,10241,B[x.minFilter])):(r.texParameteri(b,10242,33071),r.texParameteri(b,10243,33071),(b===32879||b===35866)&&r.texParameteri(b,32882,33071),(x.wrapS!==Bt||x.wrapT!==Bt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),r.texParameteri(b,10240,F(x.magFilter)),r.texParameteri(b,10241,F(x.minFilter)),x.minFilter!==gt&&x.minFilter!==Nt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),e.has("EXT_texture_filter_anisotropic")===!0){const te=e.get("EXT_texture_filter_anisotropic");if(x.magFilter===gt||x.minFilter!==Nr&&x.minFilter!==Pi||x.type===Pn&&e.has("OES_texture_float_linear")===!1||a===!1&&x.type===Di&&e.has("OES_texture_half_float_linear")===!1)return;(x.anisotropy>1||n.get(x).__currentAnisotropy)&&(r.texParameterf(b,te.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,i.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy)}}function ue(b,x){let W=!1;b.__webglInit===void 0&&(b.__webglInit=!0,x.addEventListener("dispose",D));const te=x.source;let ne=f.get(te);ne===void 0&&(ne={},f.set(te,ne));const ae=K(x);if(ae!==b.__cacheKey){ne[ae]===void 0&&(ne[ae]={texture:r.createTexture(),usedTimes:0},o.memory.textures++,W=!0),ne[ae].usedTimes++;const xe=ne[b.__cacheKey];xe!==void 0&&(ne[b.__cacheKey].usedTimes--,xe.usedTimes===0&&P(x)),b.__cacheKey=ae,b.__webglTexture=ne[ae].texture}return W}function he(b,x,W){let te=3553;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(te=35866),x.isData3DTexture&&(te=32879);const ne=ue(b,x),ae=x.source;t.bindTexture(te,b.__webglTexture,33984+W);const xe=n.get(ae);if(ae.version!==xe.__version||ne===!0){t.activeTexture(33984+W),r.pixelStorei(37440,x.flipY),r.pixelStorei(37441,x.premultiplyAlpha),r.pixelStorei(3317,x.unpackAlignment),r.pixelStorei(37443,0);const C=w(x)&&E(x.image)===!1;let O=_(x.image,C,!1,u);O=ut(x,O);const oe=E(O)||a,se=s.convert(x.format,x.encoding);let me=s.convert(x.type),_e=y(x.internalFormat,se,me,x.encoding,x.isVideoTexture);ce(te,x,oe);let ge;const Ae=x.mipmaps,Ne=a&&x.isVideoTexture!==!0,Ue=xe.__version===void 0||ne===!0,R=T(x,O,oe);if(x.isDepthTexture)_e=6402,a?x.type===Pn?_e=36012:x.type===Rn?_e=33190:x.type===oi?_e=35056:_e=33189:x.type===Pn&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),x.format===Dn&&_e===6402&&x.type!==Do&&x.type!==Rn&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),x.type=Rn,me=s.convert(x.type)),x.format===di&&_e===6402&&(_e=34041,x.type!==oi&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),x.type=oi,me=s.convert(x.type))),Ue&&(Ne?t.texStorage2D(3553,1,_e,O.width,O.height):t.texImage2D(3553,0,_e,O.width,O.height,0,se,me,null));else if(x.isDataTexture)if(Ae.length>0&&oe){Ne&&Ue&&t.texStorage2D(3553,R,_e,Ae[0].width,Ae[0].height);for(let j=0,J=Ae.length;j<J;j++)ge=Ae[j],Ne?t.texSubImage2D(3553,j,0,0,ge.width,ge.height,se,me,ge.data):t.texImage2D(3553,j,_e,ge.width,ge.height,0,se,me,ge.data);x.generateMipmaps=!1}else Ne?(Ue&&t.texStorage2D(3553,R,_e,O.width,O.height),t.texSubImage2D(3553,0,0,0,O.width,O.height,se,me,O.data)):t.texImage2D(3553,0,_e,O.width,O.height,0,se,me,O.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ne&&Ue&&t.texStorage3D(35866,R,_e,Ae[0].width,Ae[0].height,O.depth);for(let j=0,J=Ae.length;j<J;j++)ge=Ae[j],x.format!==Gt?se!==null?Ne?t.compressedTexSubImage3D(35866,j,0,0,0,ge.width,ge.height,O.depth,se,ge.data,0,0):t.compressedTexImage3D(35866,j,_e,ge.width,ge.height,O.depth,0,ge.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ne?t.texSubImage3D(35866,j,0,0,0,ge.width,ge.height,O.depth,se,me,ge.data):t.texImage3D(35866,j,_e,ge.width,ge.height,O.depth,0,se,me,ge.data)}else{Ne&&Ue&&t.texStorage2D(3553,R,_e,Ae[0].width,Ae[0].height);for(let j=0,J=Ae.length;j<J;j++)ge=Ae[j],x.format!==Gt?se!==null?Ne?t.compressedTexSubImage2D(3553,j,0,0,ge.width,ge.height,se,ge.data):t.compressedTexImage2D(3553,j,_e,ge.width,ge.height,0,ge.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ne?t.texSubImage2D(3553,j,0,0,ge.width,ge.height,se,me,ge.data):t.texImage2D(3553,j,_e,ge.width,ge.height,0,se,me,ge.data)}else if(x.isDataArrayTexture)Ne?(Ue&&t.texStorage3D(35866,R,_e,O.width,O.height,O.depth),t.texSubImage3D(35866,0,0,0,0,O.width,O.height,O.depth,se,me,O.data)):t.texImage3D(35866,0,_e,O.width,O.height,O.depth,0,se,me,O.data);else if(x.isData3DTexture)Ne?(Ue&&t.texStorage3D(32879,R,_e,O.width,O.height,O.depth),t.texSubImage3D(32879,0,0,0,0,O.width,O.height,O.depth,se,me,O.data)):t.texImage3D(32879,0,_e,O.width,O.height,O.depth,0,se,me,O.data);else if(x.isFramebufferTexture){if(Ue)if(Ne)t.texStorage2D(3553,R,_e,O.width,O.height);else{let j=O.width,J=O.height;for(let le=0;le<R;le++)t.texImage2D(3553,le,_e,j,J,0,se,me,null),j>>=1,J>>=1}}else if(Ae.length>0&&oe){Ne&&Ue&&t.texStorage2D(3553,R,_e,Ae[0].width,Ae[0].height);for(let j=0,J=Ae.length;j<J;j++)ge=Ae[j],Ne?t.texSubImage2D(3553,j,0,0,se,me,ge):t.texImage2D(3553,j,_e,se,me,ge);x.generateMipmaps=!1}else Ne?(Ue&&t.texStorage2D(3553,R,_e,O.width,O.height),t.texSubImage2D(3553,0,0,0,se,me,O)):t.texImage2D(3553,0,_e,se,me,O);L(x,oe)&&U(te),xe.__version=ae.version,x.onUpdate&&x.onUpdate(x)}b.__version=x.version}function de(b,x,W){if(x.image.length!==6)return;const te=ue(b,x),ne=x.source;t.bindTexture(34067,b.__webglTexture,33984+W);const ae=n.get(ne);if(ne.version!==ae.__version||te===!0){t.activeTexture(33984+W),r.pixelStorei(37440,x.flipY),r.pixelStorei(37441,x.premultiplyAlpha),r.pixelStorei(3317,x.unpackAlignment),r.pixelStorei(37443,0);const xe=x.isCompressedTexture||x.image[0].isCompressedTexture,C=x.image[0]&&x.image[0].isDataTexture,O=[];for(let j=0;j<6;j++)!xe&&!C?O[j]=_(x.image[j],!1,!0,c):O[j]=C?x.image[j].image:x.image[j],O[j]=ut(x,O[j]);const oe=O[0],se=E(oe)||a,me=s.convert(x.format,x.encoding),_e=s.convert(x.type),ge=y(x.internalFormat,me,_e,x.encoding),Ae=a&&x.isVideoTexture!==!0,Ne=ae.__version===void 0||te===!0;let Ue=T(x,oe,se);ce(34067,x,se);let R;if(xe){Ae&&Ne&&t.texStorage2D(34067,Ue,ge,oe.width,oe.height);for(let j=0;j<6;j++){R=O[j].mipmaps;for(let J=0;J<R.length;J++){const le=R[J];x.format!==Gt?me!==null?Ae?t.compressedTexSubImage2D(34069+j,J,0,0,le.width,le.height,me,le.data):t.compressedTexImage2D(34069+j,J,ge,le.width,le.height,0,le.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ae?t.texSubImage2D(34069+j,J,0,0,le.width,le.height,me,_e,le.data):t.texImage2D(34069+j,J,ge,le.width,le.height,0,me,_e,le.data)}}}else{R=x.mipmaps,Ae&&Ne&&(R.length>0&&Ue++,t.texStorage2D(34067,Ue,ge,O[0].width,O[0].height));for(let j=0;j<6;j++)if(C){Ae?t.texSubImage2D(34069+j,0,0,0,O[j].width,O[j].height,me,_e,O[j].data):t.texImage2D(34069+j,0,ge,O[j].width,O[j].height,0,me,_e,O[j].data);for(let J=0;J<R.length;J++){const fe=R[J].image[j].image;Ae?t.texSubImage2D(34069+j,J+1,0,0,fe.width,fe.height,me,_e,fe.data):t.texImage2D(34069+j,J+1,ge,fe.width,fe.height,0,me,_e,fe.data)}}else{Ae?t.texSubImage2D(34069+j,0,0,0,me,_e,O[j]):t.texImage2D(34069+j,0,ge,me,_e,O[j]);for(let J=0;J<R.length;J++){const le=R[J];Ae?t.texSubImage2D(34069+j,J+1,0,0,me,_e,le.image[j]):t.texImage2D(34069+j,J+1,ge,me,_e,le.image[j])}}}L(x,se)&&U(34067),ae.__version=ne.version,x.onUpdate&&x.onUpdate(x)}b.__version=x.version}function Se(b,x,W,te,ne){const ae=s.convert(W.format,W.encoding),xe=s.convert(W.type),C=y(W.internalFormat,ae,xe,W.encoding);n.get(x).__hasExternalTextures||(ne===32879||ne===35866?t.texImage3D(ne,0,C,x.width,x.height,x.depth,0,ae,xe,null):t.texImage2D(ne,0,C,x.width,x.height,0,ae,xe,null)),t.bindFramebuffer(36160,b),Be(x)?d.framebufferTexture2DMultisampleEXT(36160,te,ne,n.get(W).__webglTexture,0,Ve(x)):(ne===3553||ne>=34069&&ne<=34074)&&r.framebufferTexture2D(36160,te,ne,n.get(W).__webglTexture,0),t.bindFramebuffer(36160,null)}function be(b,x,W){if(r.bindRenderbuffer(36161,b),x.depthBuffer&&!x.stencilBuffer){let te=33189;if(W||Be(x)){const ne=x.depthTexture;ne&&ne.isDepthTexture&&(ne.type===Pn?te=36012:ne.type===Rn&&(te=33190));const ae=Ve(x);Be(x)?d.renderbufferStorageMultisampleEXT(36161,ae,te,x.width,x.height):r.renderbufferStorageMultisample(36161,ae,te,x.width,x.height)}else r.renderbufferStorage(36161,te,x.width,x.height);r.framebufferRenderbuffer(36160,36096,36161,b)}else if(x.depthBuffer&&x.stencilBuffer){const te=Ve(x);W&&Be(x)===!1?r.renderbufferStorageMultisample(36161,te,35056,x.width,x.height):Be(x)?d.renderbufferStorageMultisampleEXT(36161,te,35056,x.width,x.height):r.renderbufferStorage(36161,34041,x.width,x.height),r.framebufferRenderbuffer(36160,33306,36161,b)}else{const te=x.isWebGLMultipleRenderTargets===!0?x.texture:[x.texture];for(let ne=0;ne<te.length;ne++){const ae=te[ne],xe=s.convert(ae.format,ae.encoding),C=s.convert(ae.type),O=y(ae.internalFormat,xe,C,ae.encoding),oe=Ve(x);W&&Be(x)===!1?r.renderbufferStorageMultisample(36161,oe,O,x.width,x.height):Be(x)?d.renderbufferStorageMultisampleEXT(36161,oe,O,x.width,x.height):r.renderbufferStorage(36161,O,x.width,x.height)}}r.bindRenderbuffer(36161,null)}function Ee(b,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(36160,b),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(x.depthTexture).__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),ee(x.depthTexture,0);const te=n.get(x.depthTexture).__webglTexture,ne=Ve(x);if(x.depthTexture.format===Dn)Be(x)?d.framebufferTexture2DMultisampleEXT(36160,36096,3553,te,0,ne):r.framebufferTexture2D(36160,36096,3553,te,0);else if(x.depthTexture.format===di)Be(x)?d.framebufferTexture2DMultisampleEXT(36160,33306,3553,te,0,ne):r.framebufferTexture2D(36160,33306,3553,te,0);else throw new Error("Unknown depthTexture format")}function Ie(b){const x=n.get(b),W=b.isWebGLCubeRenderTarget===!0;if(b.depthTexture&&!x.__autoAllocateDepthBuffer){if(W)throw new Error("target.depthTexture not supported in Cube render targets");Ee(x.__webglFramebuffer,b)}else if(W){x.__webglDepthbuffer=[];for(let te=0;te<6;te++)t.bindFramebuffer(36160,x.__webglFramebuffer[te]),x.__webglDepthbuffer[te]=r.createRenderbuffer(),be(x.__webglDepthbuffer[te],b,!1)}else t.bindFramebuffer(36160,x.__webglFramebuffer),x.__webglDepthbuffer=r.createRenderbuffer(),be(x.__webglDepthbuffer,b,!1);t.bindFramebuffer(36160,null)}function Je(b,x,W){const te=n.get(b);x!==void 0&&Se(te.__webglFramebuffer,b,b.texture,36064,3553),W!==void 0&&Ie(b)}function ct(b){const x=b.texture,W=n.get(b),te=n.get(x);b.addEventListener("dispose",Y),b.isWebGLMultipleRenderTargets!==!0&&(te.__webglTexture===void 0&&(te.__webglTexture=r.createTexture()),te.__version=x.version,o.memory.textures++);const ne=b.isWebGLCubeRenderTarget===!0,ae=b.isWebGLMultipleRenderTargets===!0,xe=E(b)||a;if(ne){W.__webglFramebuffer=[];for(let C=0;C<6;C++)W.__webglFramebuffer[C]=r.createFramebuffer()}else{if(W.__webglFramebuffer=r.createFramebuffer(),ae)if(i.drawBuffers){const C=b.texture;for(let O=0,oe=C.length;O<oe;O++){const se=n.get(C[O]);se.__webglTexture===void 0&&(se.__webglTexture=r.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&b.samples>0&&Be(b)===!1){const C=ae?x:[x];W.__webglMultisampledFramebuffer=r.createFramebuffer(),W.__webglColorRenderbuffer=[],t.bindFramebuffer(36160,W.__webglMultisampledFramebuffer);for(let O=0;O<C.length;O++){const oe=C[O];W.__webglColorRenderbuffer[O]=r.createRenderbuffer(),r.bindRenderbuffer(36161,W.__webglColorRenderbuffer[O]);const se=s.convert(oe.format,oe.encoding),me=s.convert(oe.type),_e=y(oe.internalFormat,se,me,oe.encoding,b.isXRRenderTarget===!0),ge=Ve(b);r.renderbufferStorageMultisample(36161,ge,_e,b.width,b.height),r.framebufferRenderbuffer(36160,36064+O,36161,W.__webglColorRenderbuffer[O])}r.bindRenderbuffer(36161,null),b.depthBuffer&&(W.__webglDepthRenderbuffer=r.createRenderbuffer(),be(W.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(36160,null)}}if(ne){t.bindTexture(34067,te.__webglTexture),ce(34067,x,xe);for(let C=0;C<6;C++)Se(W.__webglFramebuffer[C],b,x,36064,34069+C);L(x,xe)&&U(34067),t.unbindTexture()}else if(ae){const C=b.texture;for(let O=0,oe=C.length;O<oe;O++){const se=C[O],me=n.get(se);t.bindTexture(3553,me.__webglTexture),ce(3553,se,xe),Se(W.__webglFramebuffer,b,se,36064+O,3553),L(se,xe)&&U(3553)}t.unbindTexture()}else{let C=3553;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(a?C=b.isWebGL3DRenderTarget?32879:35866:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(C,te.__webglTexture),ce(C,x,xe),Se(W.__webglFramebuffer,b,x,36064,C),L(x,xe)&&U(C),t.unbindTexture()}b.depthBuffer&&Ie(b)}function Qe(b){const x=E(b)||a,W=b.isWebGLMultipleRenderTargets===!0?b.texture:[b.texture];for(let te=0,ne=W.length;te<ne;te++){const ae=W[te];if(L(ae,x)){const xe=b.isWebGLCubeRenderTarget?34067:3553,C=n.get(ae).__webglTexture;t.bindTexture(xe,C),U(xe),t.unbindTexture()}}}function et(b){if(a&&b.samples>0&&Be(b)===!1){const x=b.isWebGLMultipleRenderTargets?b.texture:[b.texture],W=b.width,te=b.height;let ne=16384;const ae=[],xe=b.stencilBuffer?33306:36096,C=n.get(b),O=b.isWebGLMultipleRenderTargets===!0;if(O)for(let oe=0;oe<x.length;oe++)t.bindFramebuffer(36160,C.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(36160,36064+oe,36161,null),t.bindFramebuffer(36160,C.__webglFramebuffer),r.framebufferTexture2D(36009,36064+oe,3553,null,0);t.bindFramebuffer(36008,C.__webglMultisampledFramebuffer),t.bindFramebuffer(36009,C.__webglFramebuffer);for(let oe=0;oe<x.length;oe++){ae.push(36064+oe),b.depthBuffer&&ae.push(xe);const se=C.__ignoreDepthValues!==void 0?C.__ignoreDepthValues:!1;if(se===!1&&(b.depthBuffer&&(ne|=256),b.stencilBuffer&&(ne|=1024)),O&&r.framebufferRenderbuffer(36008,36064,36161,C.__webglColorRenderbuffer[oe]),se===!0&&(r.invalidateFramebuffer(36008,[xe]),r.invalidateFramebuffer(36009,[xe])),O){const me=n.get(x[oe]).__webglTexture;r.framebufferTexture2D(36009,36064,3553,me,0)}r.blitFramebuffer(0,0,W,te,0,0,W,te,ne,9728),m&&r.invalidateFramebuffer(36008,ae)}if(t.bindFramebuffer(36008,null),t.bindFramebuffer(36009,null),O)for(let oe=0;oe<x.length;oe++){t.bindFramebuffer(36160,C.__webglMultisampledFramebuffer),r.framebufferRenderbuffer(36160,36064+oe,36161,C.__webglColorRenderbuffer[oe]);const se=n.get(x[oe]).__webglTexture;t.bindFramebuffer(36160,C.__webglFramebuffer),r.framebufferTexture2D(36009,36064+oe,3553,se,0)}t.bindFramebuffer(36009,C.__webglMultisampledFramebuffer)}}function Ve(b){return Math.min(h,b.samples)}function Be(b){const x=n.get(b);return a&&b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function St(b){const x=o.render.frame;g.get(b)!==x&&(g.set(b,x),b.update())}function ut(b,x){const W=b.encoding,te=b.format,ne=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||b.format===ws||W!==Nn&&(W===ke?a===!1?e.has("EXT_sRGB")===!0&&te===Gt?(b.format=ws,b.minFilter=Nt,b.generateMipmaps=!1):x=Oo.sRGBToLinear(x):(te!==Gt||ne!==In)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture encoding:",W)),x}this.allocateTextureUnit=q,this.resetTextureUnits=Q,this.setTexture2D=ee,this.setTexture2DArray=pe,this.setTexture3D=k,this.setTextureCube=Z,this.rebindTextures=Je,this.setupRenderTarget=ct,this.updateRenderTargetMipmap=Qe,this.updateMultisampleRenderTarget=et,this.setupDepthRenderbuffer=Ie,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=Be}function Lp(r,e,t){const n=t.isWebGL2;function i(s,o=null){let a;if(s===In)return 5121;if(s===fc)return 32819;if(s===pc)return 32820;if(s===uc)return 5120;if(s===dc)return 5122;if(s===Do)return 5123;if(s===hc)return 5124;if(s===Rn)return 5125;if(s===Pn)return 5126;if(s===Di)return n?5131:(a=e.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(s===mc)return 6406;if(s===Gt)return 6408;if(s===gc)return 6409;if(s===_c)return 6410;if(s===Dn)return 6402;if(s===di)return 34041;if(s===ws)return a=e.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(s===xc)return 6403;if(s===vc)return 36244;if(s===yc)return 33319;if(s===Sc)return 33320;if(s===Mc)return 36249;if(s===Or||s===zr||s===Ur||s===Fr)if(o===ke)if(a=e.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(s===Or)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===zr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===Ur)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===Fr)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=e.get("WEBGL_compressed_texture_s3tc"),a!==null){if(s===Or)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===zr)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===Ur)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===Fr)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===Zs||s===Js||s===Qs||s===ea)if(a=e.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(s===Zs)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===Js)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===Qs)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===ea)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===bc)return a=e.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(s===ta||s===na)if(a=e.get("WEBGL_compressed_texture_etc"),a!==null){if(s===ta)return o===ke?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(s===na)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(s===ia||s===ra||s===sa||s===aa||s===oa||s===la||s===ca||s===ua||s===da||s===ha||s===fa||s===pa||s===ma||s===ga)if(a=e.get("WEBGL_compressed_texture_astc"),a!==null){if(s===ia)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===ra)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===sa)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===aa)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===oa)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===la)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===ca)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===ua)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===da)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===ha)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===fa)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===pa)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===ma)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===ga)return o===ke?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===Br)if(a=e.get("EXT_texture_compression_bptc"),a!==null){if(s===Br)return o===ke?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT}else return null;if(s===wc||s===_a||s===xa||s===va)if(a=e.get("EXT_texture_compression_rgtc"),a!==null){if(s===Br)return a.COMPRESSED_RED_RGTC1_EXT;if(s===_a)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===xa)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===va)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===oi?n?34042:(a=e.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):r[s]!==void 0?r[s]:null}return{convert:i}}class Rp extends Ot{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}}class rr extends $e{constructor(){super(),this.isGroup=!0,this.type="Group"}}const Pp={type:"move"};class us{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new rr,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new rr,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new N,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new N),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new rr,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new N,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new N),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let i=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const p of e.hand.values()){const f=t.getJointPose(p,n),v=this._getHandJoint(c,p);f!==null&&(v.matrix.fromArray(f.transform.matrix),v.matrix.decompose(v.position,v.rotation,v.scale),v.jointRadius=f.radius),v.visible=f!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),m=.02,g=.005;c.inputState.pinching&&d>m+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=m-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(i=t.getPose(e.targetRaySpace,n),i===null&&s!==null&&(i=s),i!==null&&(a.matrix.fromArray(i.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),i.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(i.linearVelocity)):a.hasLinearVelocity=!1,i.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(i.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Pp)))}return a!==null&&(a.visible=i!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new rr;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Dp extends yt{constructor(e,t,n,i,s,o,a,l,c,u){if(u=u!==void 0?u:Dn,u!==Dn&&u!==di)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&u===Dn&&(n=Rn),n===void 0&&u===di&&(n=oi),super(null,i,s,o,a,l,u,n,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:gt,this.minFilter=l!==void 0?l:gt,this.flipY=!1,this.generateMipmaps=!1}}class Ip extends fi{constructor(e,t){super();const n=this;let i=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,m=null,g=null;const p=t.getContextAttributes();let f=null,v=null;const M=[],_=[],E=new Set,w=new Map,L=new Ot;L.layers.enable(1),L.viewport=new st;const U=new Ot;U.layers.enable(2),U.viewport=new st;const y=[L,U],T=new Rp;T.layers.enable(1),T.layers.enable(2);let F=null,D=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(k){let Z=M[k];return Z===void 0&&(Z=new us,M[k]=Z),Z.getTargetRaySpace()},this.getControllerGrip=function(k){let Z=M[k];return Z===void 0&&(Z=new us,M[k]=Z),Z.getGripSpace()},this.getHand=function(k){let Z=M[k];return Z===void 0&&(Z=new us,M[k]=Z),Z.getHandSpace()};function Y(k){const Z=_.indexOf(k.inputSource);if(Z===-1)return;const re=M[Z];re!==void 0&&re.dispatchEvent({type:k.type,data:k.inputSource})}function I(){i.removeEventListener("select",Y),i.removeEventListener("selectstart",Y),i.removeEventListener("selectend",Y),i.removeEventListener("squeeze",Y),i.removeEventListener("squeezestart",Y),i.removeEventListener("squeezeend",Y),i.removeEventListener("end",I),i.removeEventListener("inputsourceschange",P);for(let k=0;k<M.length;k++){const Z=_[k];Z!==null&&(_[k]=null,M[k].disconnect(Z))}F=null,D=null,e.setRenderTarget(f),m=null,d=null,h=null,i=null,v=null,pe.stop(),n.isPresenting=!1,n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(k){s=k,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(k){a=k,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(k){c=k},this.getBaseLayer=function(){return d!==null?d:m},this.getBinding=function(){return h},this.getFrame=function(){return g},this.getSession=function(){return i},this.setSession=async function(k){if(i=k,i!==null){if(f=e.getRenderTarget(),i.addEventListener("select",Y),i.addEventListener("selectstart",Y),i.addEventListener("selectend",Y),i.addEventListener("squeeze",Y),i.addEventListener("squeezestart",Y),i.addEventListener("squeezeend",Y),i.addEventListener("end",I),i.addEventListener("inputsourceschange",P),p.xrCompatible!==!0&&await t.makeXRCompatible(),i.renderState.layers===void 0||e.capabilities.isWebGL2===!1){const Z={antialias:i.renderState.layers===void 0?p.antialias:!0,alpha:p.alpha,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:s};m=new XRWebGLLayer(i,t,Z),i.updateRenderState({baseLayer:m}),v=new On(m.framebufferWidth,m.framebufferHeight,{format:Gt,type:In,encoding:e.outputEncoding,stencilBuffer:p.stencil})}else{let Z=null,re=null,B=null;p.depth&&(B=p.stencil?35056:33190,Z=p.stencil?di:Dn,re=p.stencil?oi:Rn);const ce={colorFormat:32856,depthFormat:B,scaleFactor:s};h=new XRWebGLBinding(i,t),d=h.createProjectionLayer(ce),i.updateRenderState({layers:[d]}),v=new On(d.textureWidth,d.textureHeight,{format:Gt,type:In,depthTexture:new Dp(d.textureWidth,d.textureHeight,re,void 0,void 0,void 0,void 0,void 0,void 0,Z),stencilBuffer:p.stencil,encoding:e.outputEncoding,samples:p.antialias?4:0});const ue=e.properties.get(v);ue.__ignoreDepthValues=d.ignoreDepthValues}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await i.requestReferenceSpace(a),pe.setContext(i),pe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}};function P(k){for(let Z=0;Z<k.removed.length;Z++){const re=k.removed[Z],B=_.indexOf(re);B>=0&&(_[B]=null,M[B].disconnect(re))}for(let Z=0;Z<k.added.length;Z++){const re=k.added[Z];let B=_.indexOf(re);if(B===-1){for(let ue=0;ue<M.length;ue++)if(ue>=_.length){_.push(re),B=ue;break}else if(_[ue]===null){_[ue]=re,B=ue;break}if(B===-1)break}const ce=M[B];ce&&ce.connect(re)}}const V=new N,$=new N;function Q(k,Z,re){V.setFromMatrixPosition(Z.matrixWorld),$.setFromMatrixPosition(re.matrixWorld);const B=V.distanceTo($),ce=Z.projectionMatrix.elements,ue=re.projectionMatrix.elements,he=ce[14]/(ce[10]-1),de=ce[14]/(ce[10]+1),Se=(ce[9]+1)/ce[5],be=(ce[9]-1)/ce[5],Ee=(ce[8]-1)/ce[0],Ie=(ue[8]+1)/ue[0],Je=he*Ee,ct=he*Ie,Qe=B/(-Ee+Ie),et=Qe*-Ee;Z.matrixWorld.decompose(k.position,k.quaternion,k.scale),k.translateX(et),k.translateZ(Qe),k.matrixWorld.compose(k.position,k.quaternion,k.scale),k.matrixWorldInverse.copy(k.matrixWorld).invert();const Ve=he+Qe,Be=de+Qe,St=Je-et,ut=ct+(B-et),b=Se*de/Be*Ve,x=be*de/Be*Ve;k.projectionMatrix.makePerspective(St,ut,b,x,Ve,Be)}function q(k,Z){Z===null?k.matrixWorld.copy(k.matrix):k.matrixWorld.multiplyMatrices(Z.matrixWorld,k.matrix),k.matrixWorldInverse.copy(k.matrixWorld).invert()}this.updateCamera=function(k){if(i===null)return;T.near=U.near=L.near=k.near,T.far=U.far=L.far=k.far,(F!==T.near||D!==T.far)&&(i.updateRenderState({depthNear:T.near,depthFar:T.far}),F=T.near,D=T.far);const Z=k.parent,re=T.cameras;q(T,Z);for(let ce=0;ce<re.length;ce++)q(re[ce],Z);T.matrixWorld.decompose(T.position,T.quaternion,T.scale),k.matrix.copy(T.matrix),k.matrix.decompose(k.position,k.quaternion,k.scale);const B=k.children;for(let ce=0,ue=B.length;ce<ue;ce++)B[ce].updateMatrixWorld(!0);re.length===2?Q(T,L,U):T.projectionMatrix.copy(L.projectionMatrix)},this.getCamera=function(){return T},this.getFoveation=function(){if(!(d===null&&m===null))return l},this.setFoveation=function(k){l=k,d!==null&&(d.fixedFoveation=k),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=k)},this.getPlanes=function(){return E};let K=null;function ee(k,Z){if(u=Z.getViewerPose(c||o),g=Z,u!==null){const re=u.views;m!==null&&(e.setRenderTargetFramebuffer(v,m.framebuffer),e.setRenderTarget(v));let B=!1;re.length!==T.cameras.length&&(T.cameras.length=0,B=!0);for(let ce=0;ce<re.length;ce++){const ue=re[ce];let he=null;if(m!==null)he=m.getViewport(ue);else{const Se=h.getViewSubImage(d,ue);he=Se.viewport,ce===0&&(e.setRenderTargetTextures(v,Se.colorTexture,d.ignoreDepthValues?void 0:Se.depthStencilTexture),e.setRenderTarget(v))}let de=y[ce];de===void 0&&(de=new Ot,de.layers.enable(ce),de.viewport=new st,y[ce]=de),de.matrix.fromArray(ue.transform.matrix),de.projectionMatrix.fromArray(ue.projectionMatrix),de.viewport.set(he.x,he.y,he.width,he.height),ce===0&&T.matrix.copy(de.matrix),B===!0&&T.cameras.push(de)}}for(let re=0;re<M.length;re++){const B=_[re],ce=M[re];B!==null&&ce!==void 0&&ce.update(B,Z,c||o)}if(K&&K(k,Z),Z.detectedPlanes){n.dispatchEvent({type:"planesdetected",data:Z.detectedPlanes});let re=null;for(const B of E)Z.detectedPlanes.has(B)||(re===null&&(re=[]),re.push(B));if(re!==null)for(const B of re)E.delete(B),w.delete(B),n.dispatchEvent({type:"planeremoved",data:B});for(const B of Z.detectedPlanes)if(!E.has(B))E.add(B),w.set(B,Z.lastChangedTime),n.dispatchEvent({type:"planeadded",data:B});else{const ce=w.get(B);B.lastChangedTime>ce&&(w.set(B,B.lastChangedTime),n.dispatchEvent({type:"planechanged",data:B}))}}g=null}const pe=new qo;pe.setAnimationLoop(ee),this.setAnimationLoop=function(k){K=k},this.dispose=function(){}}}function Np(r,e){function t(p,f){f.color.getRGB(p.fogColor.value,Ho(r)),f.isFog?(p.fogNear.value=f.near,p.fogFar.value=f.far):f.isFogExp2&&(p.fogDensity.value=f.density)}function n(p,f,v,M,_){f.isMeshBasicMaterial||f.isMeshLambertMaterial?i(p,f):f.isMeshToonMaterial?(i(p,f),u(p,f)):f.isMeshPhongMaterial?(i(p,f),c(p,f)):f.isMeshStandardMaterial?(i(p,f),h(p,f),f.isMeshPhysicalMaterial&&d(p,f,_)):f.isMeshMatcapMaterial?(i(p,f),m(p,f)):f.isMeshDepthMaterial?i(p,f):f.isMeshDistanceMaterial?(i(p,f),g(p,f)):f.isMeshNormalMaterial?i(p,f):f.isLineBasicMaterial?(s(p,f),f.isLineDashedMaterial&&o(p,f)):f.isPointsMaterial?a(p,f,v,M):f.isSpriteMaterial?l(p,f):f.isShadowMaterial?(p.color.value.copy(f.color),p.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function i(p,f){p.opacity.value=f.opacity,f.color&&p.diffuse.value.copy(f.color),f.emissive&&p.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(p.map.value=f.map),f.alphaMap&&(p.alphaMap.value=f.alphaMap),f.bumpMap&&(p.bumpMap.value=f.bumpMap,p.bumpScale.value=f.bumpScale,f.side===At&&(p.bumpScale.value*=-1)),f.displacementMap&&(p.displacementMap.value=f.displacementMap,p.displacementScale.value=f.displacementScale,p.displacementBias.value=f.displacementBias),f.emissiveMap&&(p.emissiveMap.value=f.emissiveMap),f.normalMap&&(p.normalMap.value=f.normalMap,p.normalScale.value.copy(f.normalScale),f.side===At&&p.normalScale.value.negate()),f.specularMap&&(p.specularMap.value=f.specularMap),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);const v=e.get(f).envMap;if(v&&(p.envMap.value=v,p.flipEnvMap.value=v.isCubeTexture&&v.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=f.reflectivity,p.ior.value=f.ior,p.refractionRatio.value=f.refractionRatio),f.lightMap){p.lightMap.value=f.lightMap;const E=r.useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=f.lightMapIntensity*E}f.aoMap&&(p.aoMap.value=f.aoMap,p.aoMapIntensity.value=f.aoMapIntensity);let M;f.map?M=f.map:f.specularMap?M=f.specularMap:f.displacementMap?M=f.displacementMap:f.normalMap?M=f.normalMap:f.bumpMap?M=f.bumpMap:f.roughnessMap?M=f.roughnessMap:f.metalnessMap?M=f.metalnessMap:f.alphaMap?M=f.alphaMap:f.emissiveMap?M=f.emissiveMap:f.clearcoatMap?M=f.clearcoatMap:f.clearcoatNormalMap?M=f.clearcoatNormalMap:f.clearcoatRoughnessMap?M=f.clearcoatRoughnessMap:f.iridescenceMap?M=f.iridescenceMap:f.iridescenceThicknessMap?M=f.iridescenceThicknessMap:f.specularIntensityMap?M=f.specularIntensityMap:f.specularColorMap?M=f.specularColorMap:f.transmissionMap?M=f.transmissionMap:f.thicknessMap?M=f.thicknessMap:f.sheenColorMap?M=f.sheenColorMap:f.sheenRoughnessMap&&(M=f.sheenRoughnessMap),M!==void 0&&(M.isWebGLRenderTarget&&(M=M.texture),M.matrixAutoUpdate===!0&&M.updateMatrix(),p.uvTransform.value.copy(M.matrix));let _;f.aoMap?_=f.aoMap:f.lightMap&&(_=f.lightMap),_!==void 0&&(_.isWebGLRenderTarget&&(_=_.texture),_.matrixAutoUpdate===!0&&_.updateMatrix(),p.uv2Transform.value.copy(_.matrix))}function s(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity}function o(p,f){p.dashSize.value=f.dashSize,p.totalSize.value=f.dashSize+f.gapSize,p.scale.value=f.scale}function a(p,f,v,M){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.size.value=f.size*v,p.scale.value=M*.5,f.map&&(p.map.value=f.map),f.alphaMap&&(p.alphaMap.value=f.alphaMap),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let _;f.map?_=f.map:f.alphaMap&&(_=f.alphaMap),_!==void 0&&(_.matrixAutoUpdate===!0&&_.updateMatrix(),p.uvTransform.value.copy(_.matrix))}function l(p,f){p.diffuse.value.copy(f.color),p.opacity.value=f.opacity,p.rotation.value=f.rotation,f.map&&(p.map.value=f.map),f.alphaMap&&(p.alphaMap.value=f.alphaMap),f.alphaTest>0&&(p.alphaTest.value=f.alphaTest);let v;f.map?v=f.map:f.alphaMap&&(v=f.alphaMap),v!==void 0&&(v.matrixAutoUpdate===!0&&v.updateMatrix(),p.uvTransform.value.copy(v.matrix))}function c(p,f){p.specular.value.copy(f.specular),p.shininess.value=Math.max(f.shininess,1e-4)}function u(p,f){f.gradientMap&&(p.gradientMap.value=f.gradientMap)}function h(p,f){p.roughness.value=f.roughness,p.metalness.value=f.metalness,f.roughnessMap&&(p.roughnessMap.value=f.roughnessMap),f.metalnessMap&&(p.metalnessMap.value=f.metalnessMap),e.get(f).envMap&&(p.envMapIntensity.value=f.envMapIntensity)}function d(p,f,v){p.ior.value=f.ior,f.sheen>0&&(p.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),p.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(p.sheenColorMap.value=f.sheenColorMap),f.sheenRoughnessMap&&(p.sheenRoughnessMap.value=f.sheenRoughnessMap)),f.clearcoat>0&&(p.clearcoat.value=f.clearcoat,p.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(p.clearcoatMap.value=f.clearcoatMap),f.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap),f.clearcoatNormalMap&&(p.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),p.clearcoatNormalMap.value=f.clearcoatNormalMap,f.side===At&&p.clearcoatNormalScale.value.negate())),f.iridescence>0&&(p.iridescence.value=f.iridescence,p.iridescenceIOR.value=f.iridescenceIOR,p.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(p.iridescenceMap.value=f.iridescenceMap),f.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=f.iridescenceThicknessMap)),f.transmission>0&&(p.transmission.value=f.transmission,p.transmissionSamplerMap.value=v.texture,p.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(p.transmissionMap.value=f.transmissionMap),p.thickness.value=f.thickness,f.thicknessMap&&(p.thicknessMap.value=f.thicknessMap),p.attenuationDistance.value=f.attenuationDistance,p.attenuationColor.value.copy(f.attenuationColor)),p.specularIntensity.value=f.specularIntensity,p.specularColor.value.copy(f.specularColor),f.specularIntensityMap&&(p.specularIntensityMap.value=f.specularIntensityMap),f.specularColorMap&&(p.specularColorMap.value=f.specularColorMap)}function m(p,f){f.matcap&&(p.matcap.value=f.matcap)}function g(p,f){p.referencePosition.value.copy(f.referencePosition),p.nearDistance.value=f.nearDistance,p.farDistance.value=f.farDistance}return{refreshFogUniforms:t,refreshMaterialUniforms:n}}function Op(r,e,t,n){let i={},s={},o=[];const a=t.isWebGL2?r.getParameter(35375):0;function l(M,_){const E=_.program;n.uniformBlockBinding(M,E)}function c(M,_){let E=i[M.id];E===void 0&&(g(M),E=u(M),i[M.id]=E,M.addEventListener("dispose",f));const w=_.program;n.updateUBOMapping(M,w);const L=e.render.frame;s[M.id]!==L&&(d(M),s[M.id]=L)}function u(M){const _=h();M.__bindingPointIndex=_;const E=r.createBuffer(),w=M.__size,L=M.usage;return r.bindBuffer(35345,E),r.bufferData(35345,w,L),r.bindBuffer(35345,null),r.bindBufferBase(35345,_,E),E}function h(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){const _=i[M.id],E=M.uniforms,w=M.__cache;r.bindBuffer(35345,_);for(let L=0,U=E.length;L<U;L++){const y=E[L];if(m(y,L,w)===!0){const T=y.__offset,F=Array.isArray(y.value)?y.value:[y.value];let D=0;for(let Y=0;Y<F.length;Y++){const I=F[Y],P=p(I);typeof I=="number"?(y.__data[0]=I,r.bufferSubData(35345,T+D,y.__data)):I.isMatrix3?(y.__data[0]=I.elements[0],y.__data[1]=I.elements[1],y.__data[2]=I.elements[2],y.__data[3]=I.elements[0],y.__data[4]=I.elements[3],y.__data[5]=I.elements[4],y.__data[6]=I.elements[5],y.__data[7]=I.elements[0],y.__data[8]=I.elements[6],y.__data[9]=I.elements[7],y.__data[10]=I.elements[8],y.__data[11]=I.elements[0]):(I.toArray(y.__data,D),D+=P.storage/Float32Array.BYTES_PER_ELEMENT)}r.bufferSubData(35345,T,y.__data)}}r.bindBuffer(35345,null)}function m(M,_,E){const w=M.value;if(E[_]===void 0){if(typeof w=="number")E[_]=w;else{const L=Array.isArray(w)?w:[w],U=[];for(let y=0;y<L.length;y++)U.push(L[y].clone());E[_]=U}return!0}else if(typeof w=="number"){if(E[_]!==w)return E[_]=w,!0}else{const L=Array.isArray(E[_])?E[_]:[E[_]],U=Array.isArray(w)?w:[w];for(let y=0;y<L.length;y++){const T=L[y];if(T.equals(U[y])===!1)return T.copy(U[y]),!0}}return!1}function g(M){const _=M.uniforms;let E=0;const w=16;let L=0;for(let U=0,y=_.length;U<y;U++){const T=_[U],F={boundary:0,storage:0},D=Array.isArray(T.value)?T.value:[T.value];for(let Y=0,I=D.length;Y<I;Y++){const P=D[Y],V=p(P);F.boundary+=V.boundary,F.storage+=V.storage}if(T.__data=new Float32Array(F.storage/Float32Array.BYTES_PER_ELEMENT),T.__offset=E,U>0){L=E%w;const Y=w-L;L!==0&&Y-F.boundary<0&&(E+=w-L,T.__offset=E)}E+=F.storage}return L=E%w,L>0&&(E+=w-L),M.__size=E,M.__cache={},this}function p(M){const _={boundary:0,storage:0};return typeof M=="number"?(_.boundary=4,_.storage=4):M.isVector2?(_.boundary=8,_.storage=8):M.isVector3||M.isColor?(_.boundary=16,_.storage=12):M.isVector4?(_.boundary=16,_.storage=16):M.isMatrix3?(_.boundary=48,_.storage=48):M.isMatrix4?(_.boundary=64,_.storage=64):M.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",M),_}function f(M){const _=M.target;_.removeEventListener("dispose",f);const E=o.indexOf(_.__bindingPointIndex);o.splice(E,1),r.deleteBuffer(i[_.id]),delete i[_.id],delete s[_.id]}function v(){for(const M in i)r.deleteBuffer(i[M]);o=[],i={},s={}}return{bind:l,update:c,dispose:v}}function zp(){const r=Sr("canvas");return r.style.display="block",r}function Is(r={}){this.isWebGLRenderer=!0;const e=r.canvas!==void 0?r.canvas:zp(),t=r.context!==void 0?r.context:null,n=r.depth!==void 0?r.depth:!0,i=r.stencil!==void 0?r.stencil:!0,s=r.antialias!==void 0?r.antialias:!1,o=r.premultipliedAlpha!==void 0?r.premultipliedAlpha:!0,a=r.preserveDrawingBuffer!==void 0?r.preserveDrawingBuffer:!1,l=r.powerPreference!==void 0?r.powerPreference:"default",c=r.failIfMajorPerformanceCaveat!==void 0?r.failIfMajorPerformanceCaveat:!1;let u;t!==null?u=t.getContextAttributes().alpha:u=r.alpha!==void 0?r.alpha:!1;let h=null,d=null;const m=[],g=[];this.domElement=e,this.debug={checkShaderErrors:!0},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.outputEncoding=Nn,this.useLegacyLights=!0,this.toneMapping=rn,this.toneMappingExposure=1;const p=this;let f=!1,v=0,M=0,_=null,E=-1,w=null;const L=new st,U=new st;let y=null,T=e.width,F=e.height,D=1,Y=null,I=null;const P=new st(0,0,T,F),V=new st(0,0,T,F);let $=!1;const Q=new Rs;let q=!1,K=!1,ee=null;const pe=new He,k=new N,Z={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function re(){return _===null?D:1}let B=t;function ce(S,G){for(let H=0;H<S.length;H++){const z=S[H],X=e.getContext(z,G);if(X!==null)return X}return null}try{const S={alpha:!0,depth:n,stencil:i,antialias:s,premultipliedAlpha:o,preserveDrawingBuffer:a,powerPreference:l,failIfMajorPerformanceCaveat:c};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${As}`),e.addEventListener("webglcontextlost",me,!1),e.addEventListener("webglcontextrestored",_e,!1),e.addEventListener("webglcontextcreationerror",ge,!1),B===null){const G=["webgl2","webgl","experimental-webgl"];if(p.isWebGL1Renderer===!0&&G.shift(),B=ce(G,S),B===null)throw ce(G)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}B.getShaderPrecisionFormat===void 0&&(B.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(S){throw console.error("THREE.WebGLRenderer: "+S.message),S}let ue,he,de,Se,be,Ee,Ie,Je,ct,Qe,et,Ve,Be,St,ut,b,x,W,te,ne,ae,xe,C,O;function oe(){ue=new qh(B),he=new Gh(B,ue,r),ue.init(he),xe=new Lp(B,ue,he),de=new Cp(B,ue,he),Se=new $h,be=new fp,Ee=new Ap(B,ue,de,be,he,xe,Se),Ie=new Vh(p),Je=new jh(p),ct=new ru(B,he),C=new Fh(B,ue,ct,he),Qe=new Xh(B,ct,Se,C),et=new Qh(B,Qe,ct,Se),te=new Jh(B,he,Ee),b=new kh(be),Ve=new hp(p,Ie,Je,ue,he,C,b),Be=new Np(p,be),St=new mp,ut=new Sp(ue,he),W=new Uh(p,Ie,Je,de,et,u,o),x=new Tp(p,et,he),O=new Op(B,Se,he,de),ne=new Bh(B,ue,Se,he),ae=new Yh(B,ue,Se,he),Se.programs=Ve.programs,p.capabilities=he,p.extensions=ue,p.properties=be,p.renderLists=St,p.shadowMap=x,p.state=de,p.info=Se}oe();const se=new Ip(p,B);this.xr=se,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){const S=ue.get("WEBGL_lose_context");S&&S.loseContext()},this.forceContextRestore=function(){const S=ue.get("WEBGL_lose_context");S&&S.restoreContext()},this.getPixelRatio=function(){return D},this.setPixelRatio=function(S){S!==void 0&&(D=S,this.setSize(T,F,!1))},this.getSize=function(S){return S.set(T,F)},this.setSize=function(S,G,H=!0){if(se.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}T=S,F=G,e.width=Math.floor(S*D),e.height=Math.floor(G*D),H===!0&&(e.style.width=S+"px",e.style.height=G+"px"),this.setViewport(0,0,S,G)},this.getDrawingBufferSize=function(S){return S.set(T*D,F*D).floor()},this.setDrawingBufferSize=function(S,G,H){T=S,F=G,D=H,e.width=Math.floor(S*H),e.height=Math.floor(G*H),this.setViewport(0,0,S,G)},this.getCurrentViewport=function(S){return S.copy(L)},this.getViewport=function(S){return S.copy(P)},this.setViewport=function(S,G,H,z){S.isVector4?P.set(S.x,S.y,S.z,S.w):P.set(S,G,H,z),de.viewport(L.copy(P).multiplyScalar(D).floor())},this.getScissor=function(S){return S.copy(V)},this.setScissor=function(S,G,H,z){S.isVector4?V.set(S.x,S.y,S.z,S.w):V.set(S,G,H,z),de.scissor(U.copy(V).multiplyScalar(D).floor())},this.getScissorTest=function(){return $},this.setScissorTest=function(S){de.setScissorTest($=S)},this.setOpaqueSort=function(S){Y=S},this.setTransparentSort=function(S){I=S},this.getClearColor=function(S){return S.copy(W.getClearColor())},this.setClearColor=function(){W.setClearColor.apply(W,arguments)},this.getClearAlpha=function(){return W.getClearAlpha()},this.setClearAlpha=function(){W.setClearAlpha.apply(W,arguments)},this.clear=function(S=!0,G=!0,H=!0){let z=0;S&&(z|=16384),G&&(z|=256),H&&(z|=1024),B.clear(z)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",me,!1),e.removeEventListener("webglcontextrestored",_e,!1),e.removeEventListener("webglcontextcreationerror",ge,!1),St.dispose(),ut.dispose(),be.dispose(),Ie.dispose(),Je.dispose(),et.dispose(),C.dispose(),O.dispose(),Ve.dispose(),se.dispose(),se.removeEventListener("sessionstart",J),se.removeEventListener("sessionend",le),ee&&(ee.dispose(),ee=null),fe.stop()};function me(S){S.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),f=!0}function _e(){console.log("THREE.WebGLRenderer: Context Restored."),f=!1;const S=Se.autoReset,G=x.enabled,H=x.autoUpdate,z=x.needsUpdate,X=x.type;oe(),Se.autoReset=S,x.enabled=G,x.autoUpdate=H,x.needsUpdate=z,x.type=X}function ge(S){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",S.statusMessage)}function Ae(S){const G=S.target;G.removeEventListener("dispose",Ae),Ne(G)}function Ne(S){Ue(S),be.remove(S)}function Ue(S){const G=be.get(S).programs;G!==void 0&&(G.forEach(function(H){Ve.releaseProgram(H)}),S.isShaderMaterial&&Ve.releaseShaderCache(S))}this.renderBufferDirect=function(S,G,H,z,X,ye){G===null&&(G=Z);const Me=X.isMesh&&X.matrixWorld.determinant()<0,Te=al(S,G,H,z,X);de.setMaterial(z,Me);let Ce=H.index,Oe=1;z.wireframe===!0&&(Ce=Qe.getWireframeAttribute(H),Oe=2);const Le=H.drawRange,Re=H.attributes.position;let je=Le.start*Oe,Mt=(Le.start+Le.count)*Oe;ye!==null&&(je=Math.max(je,ye.start*Oe),Mt=Math.min(Mt,(ye.start+ye.count)*Oe)),Ce!==null?(je=Math.max(je,0),Mt=Math.min(Mt,Ce.count)):Re!=null&&(je=Math.max(je,0),Mt=Math.min(Mt,Re.count));const $t=Mt-je;if($t<0||$t===1/0)return;C.setup(X,z,Te,H,Ce);let vn,qe=ne;if(Ce!==null&&(vn=ct.get(Ce),qe=ae,qe.setIndex(vn)),X.isMesh)z.wireframe===!0?(de.setLineWidth(z.wireframeLinewidth*re()),qe.setMode(1)):qe.setMode(4);else if(X.isLine){let Pe=z.linewidth;Pe===void 0&&(Pe=1),de.setLineWidth(Pe*re()),X.isLineSegments?qe.setMode(1):X.isLineLoop?qe.setMode(2):qe.setMode(3)}else X.isPoints?qe.setMode(0):X.isSprite&&qe.setMode(4);if(X.isInstancedMesh)qe.renderInstances(je,$t,X.count);else if(H.isInstancedBufferGeometry){const Pe=H._maxInstanceCount!==void 0?H._maxInstanceCount:1/0,Lr=Math.min(H.instanceCount,Pe);qe.renderInstances(je,$t,Lr)}else qe.render(je,$t)},this.compile=function(S,G){function H(z,X,ye){z.transparent===!0&&z.side===dn&&z.forceSinglePass===!1?(z.side=At,z.needsUpdate=!0,Dt(z,X,ye),z.side=xn,z.needsUpdate=!0,Dt(z,X,ye),z.side=dn):Dt(z,X,ye)}d=ut.get(S),d.init(),g.push(d),S.traverseVisible(function(z){z.isLight&&z.layers.test(G.layers)&&(d.pushLight(z),z.castShadow&&d.pushShadow(z))}),d.setupLights(p.useLegacyLights),S.traverse(function(z){const X=z.material;if(X)if(Array.isArray(X))for(let ye=0;ye<X.length;ye++){const Me=X[ye];H(Me,S,z)}else H(X,S,z)}),g.pop(),d=null};let R=null;function j(S){R&&R(S)}function J(){fe.stop()}function le(){fe.start()}const fe=new qo;fe.setAnimationLoop(j),typeof self<"u"&&fe.setContext(self),this.setAnimationLoop=function(S){R=S,se.setAnimationLoop(S),S===null?fe.stop():fe.start()},se.addEventListener("sessionstart",J),se.addEventListener("sessionend",le),this.render=function(S,G){if(G!==void 0&&G.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(f===!0)return;S.matrixWorldAutoUpdate===!0&&S.updateMatrixWorld(),G.parent===null&&G.matrixWorldAutoUpdate===!0&&G.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(se.cameraAutoUpdate===!0&&se.updateCamera(G),G=se.getCamera()),S.isScene===!0&&S.onBeforeRender(p,S,G,_),d=ut.get(S,g.length),d.init(),g.push(d),pe.multiplyMatrices(G.projectionMatrix,G.matrixWorldInverse),Q.setFromProjectionMatrix(pe),K=this.localClippingEnabled,q=b.init(this.clippingPlanes,K),h=St.get(S,m.length),h.init(),m.push(h),Ge(S,G,0,p.sortObjects),h.finish(),p.sortObjects===!0&&h.sort(Y,I),q===!0&&b.beginShadows();const H=d.state.shadowsArray;if(x.render(H,S,G),q===!0&&b.endShadows(),this.info.autoReset===!0&&this.info.reset(),W.render(h,S),d.setupLights(p.useLegacyLights),G.isArrayCamera){const z=G.cameras;for(let X=0,ye=z.length;X<ye;X++){const Me=z[X];tt(h,S,Me,Me.viewport)}}else tt(h,S,G);_!==null&&(Ee.updateMultisampleRenderTarget(_),Ee.updateRenderTargetMipmap(_)),S.isScene===!0&&S.onAfterRender(p,S,G),C.resetDefaultState(),E=-1,w=null,g.pop(),g.length>0?d=g[g.length-1]:d=null,m.pop(),m.length>0?h=m[m.length-1]:h=null};function Ge(S,G,H,z){if(S.visible===!1)return;if(S.layers.test(G.layers)){if(S.isGroup)H=S.renderOrder;else if(S.isLOD)S.autoUpdate===!0&&S.update(G);else if(S.isLight)d.pushLight(S),S.castShadow&&d.pushShadow(S);else if(S.isSprite){if(!S.frustumCulled||Q.intersectsSprite(S)){z&&k.setFromMatrixPosition(S.matrixWorld).applyMatrix4(pe);const Me=et.update(S),Te=S.material;Te.visible&&h.push(S,Me,Te,H,k.z,null)}}else if((S.isMesh||S.isLine||S.isPoints)&&(S.isSkinnedMesh&&S.skeleton.frame!==Se.render.frame&&(S.skeleton.update(),S.skeleton.frame=Se.render.frame),!S.frustumCulled||Q.intersectsObject(S))){z&&k.setFromMatrixPosition(S.matrixWorld).applyMatrix4(pe);const Me=et.update(S),Te=S.material;if(Array.isArray(Te)){const Ce=Me.groups;for(let Oe=0,Le=Ce.length;Oe<Le;Oe++){const Re=Ce[Oe],je=Te[Re.materialIndex];je&&je.visible&&h.push(S,Me,je,H,k.z,Re)}}else Te.visible&&h.push(S,Me,Te,H,k.z,null)}}const ye=S.children;for(let Me=0,Te=ye.length;Me<Te;Me++)Ge(ye[Me],G,H,z)}function tt(S,G,H,z){const X=S.opaque,ye=S.transmissive,Me=S.transparent;d.setupLightsView(H),q===!0&&b.setGlobalState(p.clippingPlanes,H),ye.length>0&&dt(X,G,H),z&&de.viewport(L.copy(z)),X.length>0&&Ht(X,G,H),ye.length>0&&Ht(ye,G,H),Me.length>0&&Ht(Me,G,H),de.buffers.depth.setTest(!0),de.buffers.depth.setMask(!0),de.buffers.color.setMask(!0),de.setPolygonOffset(!1)}function dt(S,G,H){const z=he.isWebGL2;ee===null&&(ee=new On(1024,1024,{generateMipmaps:!0,type:ue.has("EXT_color_buffer_half_float")?Di:In,minFilter:Pi,samples:z&&s===!0?4:0}));const X=p.getRenderTarget();p.setRenderTarget(ee),p.clear();const ye=p.toneMapping;p.toneMapping=rn,Ht(S,G,H),p.toneMapping=ye,Ee.updateMultisampleRenderTarget(ee),Ee.updateRenderTargetMipmap(ee),p.setRenderTarget(X)}function Ht(S,G,H){const z=G.isScene===!0?G.overrideMaterial:null;for(let X=0,ye=S.length;X<ye;X++){const Me=S[X],Te=Me.object,Ce=Me.geometry,Oe=z===null?Me.material:z,Le=Me.group;Te.layers.test(H.layers)&&We(Te,G,H,Ce,Oe,Le)}}function We(S,G,H,z,X,ye){S.onBeforeRender(p,G,H,z,X,ye),S.modelViewMatrix.multiplyMatrices(H.matrixWorldInverse,S.matrixWorld),S.normalMatrix.getNormalMatrix(S.modelViewMatrix),X.onBeforeRender(p,G,H,z,S,ye),X.transparent===!0&&X.side===dn&&X.forceSinglePass===!1?(X.side=At,X.needsUpdate=!0,p.renderBufferDirect(H,G,z,X,S,ye),X.side=xn,X.needsUpdate=!0,p.renderBufferDirect(H,G,z,X,S,ye),X.side=dn):p.renderBufferDirect(H,G,z,X,S,ye),S.onAfterRender(p,G,H,z,X,ye)}function Dt(S,G,H){G.isScene!==!0&&(G=Z);const z=be.get(S),X=d.state.lights,ye=d.state.shadowsArray,Me=X.state.version,Te=Ve.getParameters(S,X.state,ye,G,H),Ce=Ve.getProgramCacheKey(Te);let Oe=z.programs;z.environment=S.isMeshStandardMaterial?G.environment:null,z.fog=G.fog,z.envMap=(S.isMeshStandardMaterial?Je:Ie).get(S.envMap||z.environment),Oe===void 0&&(S.addEventListener("dispose",Ae),Oe=new Map,z.programs=Oe);let Le=Oe.get(Ce);if(Le!==void 0){if(z.currentProgram===Le&&z.lightsStateVersion===Me)return Wt(S,Te),Le}else Te.uniforms=Ve.getUniforms(S),S.onBuild(H,Te,p),S.onBeforeCompile(Te,p),Le=Ve.acquireProgram(Te,Ce),Oe.set(Ce,Le),z.uniforms=Te.uniforms;const Re=z.uniforms;(!S.isShaderMaterial&&!S.isRawShaderMaterial||S.clipping===!0)&&(Re.clippingPlanes=b.uniform),Wt(S,Te),z.needsLights=ll(S),z.lightsStateVersion=Me,z.needsLights&&(Re.ambientLightColor.value=X.state.ambient,Re.lightProbe.value=X.state.probe,Re.directionalLights.value=X.state.directional,Re.directionalLightShadows.value=X.state.directionalShadow,Re.spotLights.value=X.state.spot,Re.spotLightShadows.value=X.state.spotShadow,Re.rectAreaLights.value=X.state.rectArea,Re.ltc_1.value=X.state.rectAreaLTC1,Re.ltc_2.value=X.state.rectAreaLTC2,Re.pointLights.value=X.state.point,Re.pointLightShadows.value=X.state.pointShadow,Re.hemisphereLights.value=X.state.hemi,Re.directionalShadowMap.value=X.state.directionalShadowMap,Re.directionalShadowMatrix.value=X.state.directionalShadowMatrix,Re.spotShadowMap.value=X.state.spotShadowMap,Re.spotLightMatrix.value=X.state.spotLightMatrix,Re.spotLightMap.value=X.state.spotLightMap,Re.pointShadowMap.value=X.state.pointShadowMap,Re.pointShadowMatrix.value=X.state.pointShadowMatrix);const je=Le.getUniforms(),Mt=mr.seqWithValue(je.seq,Re);return z.currentProgram=Le,z.uniformsList=Mt,Le}function Wt(S,G){const H=be.get(S);H.outputEncoding=G.outputEncoding,H.instancing=G.instancing,H.skinning=G.skinning,H.morphTargets=G.morphTargets,H.morphNormals=G.morphNormals,H.morphColors=G.morphColors,H.morphTargetsCount=G.morphTargetsCount,H.numClippingPlanes=G.numClippingPlanes,H.numIntersection=G.numClipIntersection,H.vertexAlphas=G.vertexAlphas,H.vertexTangents=G.vertexTangents,H.toneMapping=G.toneMapping}function al(S,G,H,z,X){G.isScene!==!0&&(G=Z),Ee.resetTextureUnits();const ye=G.fog,Me=z.isMeshStandardMaterial?G.environment:null,Te=_===null?p.outputEncoding:_.isXRRenderTarget===!0?_.texture.encoding:Nn,Ce=(z.isMeshStandardMaterial?Je:Ie).get(z.envMap||Me),Oe=z.vertexColors===!0&&!!H.attributes.color&&H.attributes.color.itemSize===4,Le=!!z.normalMap&&!!H.attributes.tangent,Re=!!H.morphAttributes.position,je=!!H.morphAttributes.normal,Mt=!!H.morphAttributes.color,$t=z.toneMapped?p.toneMapping:rn,vn=H.morphAttributes.position||H.morphAttributes.normal||H.morphAttributes.color,qe=vn!==void 0?vn.length:0,Pe=be.get(z),Lr=d.state.lights;if(q===!0&&(K===!0||S!==w)){const bt=S===w&&z.id===E;b.setState(z,S,bt)}let nt=!1;z.version===Pe.__version?(Pe.needsLights&&Pe.lightsStateVersion!==Lr.state.version||Pe.outputEncoding!==Te||X.isInstancedMesh&&Pe.instancing===!1||!X.isInstancedMesh&&Pe.instancing===!0||X.isSkinnedMesh&&Pe.skinning===!1||!X.isSkinnedMesh&&Pe.skinning===!0||Pe.envMap!==Ce||z.fog===!0&&Pe.fog!==ye||Pe.numClippingPlanes!==void 0&&(Pe.numClippingPlanes!==b.numPlanes||Pe.numIntersection!==b.numIntersection)||Pe.vertexAlphas!==Oe||Pe.vertexTangents!==Le||Pe.morphTargets!==Re||Pe.morphNormals!==je||Pe.morphColors!==Mt||Pe.toneMapping!==$t||he.isWebGL2===!0&&Pe.morphTargetsCount!==qe)&&(nt=!0):(nt=!0,Pe.__version=z.version);let yn=Pe.currentProgram;nt===!0&&(yn=Dt(z,G,X));let Fs=!1,gi=!1,Rr=!1;const ht=yn.getUniforms(),Sn=Pe.uniforms;if(de.useProgram(yn.program)&&(Fs=!0,gi=!0,Rr=!0),z.id!==E&&(E=z.id,gi=!0),Fs||w!==S){if(ht.setValue(B,"projectionMatrix",S.projectionMatrix),he.logarithmicDepthBuffer&&ht.setValue(B,"logDepthBufFC",2/(Math.log(S.far+1)/Math.LN2)),w!==S&&(w=S,gi=!0,Rr=!0),z.isShaderMaterial||z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshStandardMaterial||z.envMap){const bt=ht.map.cameraPosition;bt!==void 0&&bt.setValue(B,k.setFromMatrixPosition(S.matrixWorld))}(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial)&&ht.setValue(B,"isOrthographic",S.isOrthographicCamera===!0),(z.isMeshPhongMaterial||z.isMeshToonMaterial||z.isMeshLambertMaterial||z.isMeshBasicMaterial||z.isMeshStandardMaterial||z.isShaderMaterial||z.isShadowMaterial||X.isSkinnedMesh)&&ht.setValue(B,"viewMatrix",S.matrixWorldInverse)}if(X.isSkinnedMesh){ht.setOptional(B,X,"bindMatrix"),ht.setOptional(B,X,"bindMatrixInverse");const bt=X.skeleton;bt&&(he.floatVertexTextures?(bt.boneTexture===null&&bt.computeBoneTexture(),ht.setValue(B,"boneTexture",bt.boneTexture,Ee),ht.setValue(B,"boneTextureSize",bt.boneTextureSize)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}const Pr=H.morphAttributes;if((Pr.position!==void 0||Pr.normal!==void 0||Pr.color!==void 0&&he.isWebGL2===!0)&&te.update(X,H,yn),(gi||Pe.receiveShadow!==X.receiveShadow)&&(Pe.receiveShadow=X.receiveShadow,ht.setValue(B,"receiveShadow",X.receiveShadow)),z.isMeshGouraudMaterial&&z.envMap!==null&&(Sn.envMap.value=Ce,Sn.flipEnvMap.value=Ce.isCubeTexture&&Ce.isRenderTargetTexture===!1?-1:1),gi&&(ht.setValue(B,"toneMappingExposure",p.toneMappingExposure),Pe.needsLights&&ol(Sn,Rr),ye&&z.fog===!0&&Be.refreshFogUniforms(Sn,ye),Be.refreshMaterialUniforms(Sn,z,D,F,ee),mr.upload(B,Pe.uniformsList,Sn,Ee)),z.isShaderMaterial&&z.uniformsNeedUpdate===!0&&(mr.upload(B,Pe.uniformsList,Sn,Ee),z.uniformsNeedUpdate=!1),z.isSpriteMaterial&&ht.setValue(B,"center",X.center),ht.setValue(B,"modelViewMatrix",X.modelViewMatrix),ht.setValue(B,"normalMatrix",X.normalMatrix),ht.setValue(B,"modelMatrix",X.matrixWorld),z.isShaderMaterial||z.isRawShaderMaterial){const bt=z.uniformsGroups;for(let Dr=0,cl=bt.length;Dr<cl;Dr++)if(he.isWebGL2){const Bs=bt[Dr];O.update(Bs,yn),O.bind(Bs,yn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return yn}function ol(S,G){S.ambientLightColor.needsUpdate=G,S.lightProbe.needsUpdate=G,S.directionalLights.needsUpdate=G,S.directionalLightShadows.needsUpdate=G,S.pointLights.needsUpdate=G,S.pointLightShadows.needsUpdate=G,S.spotLights.needsUpdate=G,S.spotLightShadows.needsUpdate=G,S.rectAreaLights.needsUpdate=G,S.hemisphereLights.needsUpdate=G}function ll(S){return S.isMeshLambertMaterial||S.isMeshToonMaterial||S.isMeshPhongMaterial||S.isMeshStandardMaterial||S.isShadowMaterial||S.isShaderMaterial&&S.lights===!0}this.getActiveCubeFace=function(){return v},this.getActiveMipmapLevel=function(){return M},this.getRenderTarget=function(){return _},this.setRenderTargetTextures=function(S,G,H){be.get(S.texture).__webglTexture=G,be.get(S.depthTexture).__webglTexture=H;const z=be.get(S);z.__hasExternalTextures=!0,z.__hasExternalTextures&&(z.__autoAllocateDepthBuffer=H===void 0,z.__autoAllocateDepthBuffer||ue.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),z.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(S,G){const H=be.get(S);H.__webglFramebuffer=G,H.__useDefaultFramebuffer=G===void 0},this.setRenderTarget=function(S,G=0,H=0){_=S,v=G,M=H;let z=!0,X=null,ye=!1,Me=!1;if(S){const Ce=be.get(S);Ce.__useDefaultFramebuffer!==void 0?(de.bindFramebuffer(36160,null),z=!1):Ce.__webglFramebuffer===void 0?Ee.setupRenderTarget(S):Ce.__hasExternalTextures&&Ee.rebindTextures(S,be.get(S.texture).__webglTexture,be.get(S.depthTexture).__webglTexture);const Oe=S.texture;(Oe.isData3DTexture||Oe.isDataArrayTexture||Oe.isCompressedArrayTexture)&&(Me=!0);const Le=be.get(S).__webglFramebuffer;S.isWebGLCubeRenderTarget?(X=Le[G],ye=!0):he.isWebGL2&&S.samples>0&&Ee.useMultisampledRTT(S)===!1?X=be.get(S).__webglMultisampledFramebuffer:X=Le,L.copy(S.viewport),U.copy(S.scissor),y=S.scissorTest}else L.copy(P).multiplyScalar(D).floor(),U.copy(V).multiplyScalar(D).floor(),y=$;if(de.bindFramebuffer(36160,X)&&he.drawBuffers&&z&&de.drawBuffers(S,X),de.viewport(L),de.scissor(U),de.setScissorTest(y),ye){const Ce=be.get(S.texture);B.framebufferTexture2D(36160,36064,34069+G,Ce.__webglTexture,H)}else if(Me){const Ce=be.get(S.texture),Oe=G||0;B.framebufferTextureLayer(36160,36064,Ce.__webglTexture,H||0,Oe)}E=-1},this.readRenderTargetPixels=function(S,G,H,z,X,ye,Me){if(!(S&&S.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Te=be.get(S).__webglFramebuffer;if(S.isWebGLCubeRenderTarget&&Me!==void 0&&(Te=Te[Me]),Te){de.bindFramebuffer(36160,Te);try{const Ce=S.texture,Oe=Ce.format,Le=Ce.type;if(Oe!==Gt&&xe.convert(Oe)!==B.getParameter(35739)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const Re=Le===Di&&(ue.has("EXT_color_buffer_half_float")||he.isWebGL2&&ue.has("EXT_color_buffer_float"));if(Le!==In&&xe.convert(Le)!==B.getParameter(35738)&&!(Le===Pn&&(he.isWebGL2||ue.has("OES_texture_float")||ue.has("WEBGL_color_buffer_float")))&&!Re){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}G>=0&&G<=S.width-z&&H>=0&&H<=S.height-X&&B.readPixels(G,H,z,X,xe.convert(Oe),xe.convert(Le),ye)}finally{const Ce=_!==null?be.get(_).__webglFramebuffer:null;de.bindFramebuffer(36160,Ce)}}},this.copyFramebufferToTexture=function(S,G,H=0){const z=Math.pow(2,-H),X=Math.floor(G.image.width*z),ye=Math.floor(G.image.height*z);Ee.setTexture2D(G,0),B.copyTexSubImage2D(3553,H,0,0,S.x,S.y,X,ye),de.unbindTexture()},this.copyTextureToTexture=function(S,G,H,z=0){const X=G.image.width,ye=G.image.height,Me=xe.convert(H.format),Te=xe.convert(H.type);Ee.setTexture2D(H,0),B.pixelStorei(37440,H.flipY),B.pixelStorei(37441,H.premultiplyAlpha),B.pixelStorei(3317,H.unpackAlignment),G.isDataTexture?B.texSubImage2D(3553,z,S.x,S.y,X,ye,Me,Te,G.image.data):G.isCompressedTexture?B.compressedTexSubImage2D(3553,z,S.x,S.y,G.mipmaps[0].width,G.mipmaps[0].height,Me,G.mipmaps[0].data):B.texSubImage2D(3553,z,S.x,S.y,Me,Te,G.image),z===0&&H.generateMipmaps&&B.generateMipmap(3553),de.unbindTexture()},this.copyTextureToTexture3D=function(S,G,H,z,X=0){if(p.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const ye=S.max.x-S.min.x+1,Me=S.max.y-S.min.y+1,Te=S.max.z-S.min.z+1,Ce=xe.convert(z.format),Oe=xe.convert(z.type);let Le;if(z.isData3DTexture)Ee.setTexture3D(z,0),Le=32879;else if(z.isDataArrayTexture)Ee.setTexture2DArray(z,0),Le=35866;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}B.pixelStorei(37440,z.flipY),B.pixelStorei(37441,z.premultiplyAlpha),B.pixelStorei(3317,z.unpackAlignment);const Re=B.getParameter(3314),je=B.getParameter(32878),Mt=B.getParameter(3316),$t=B.getParameter(3315),vn=B.getParameter(32877),qe=H.isCompressedTexture?H.mipmaps[0]:H.image;B.pixelStorei(3314,qe.width),B.pixelStorei(32878,qe.height),B.pixelStorei(3316,S.min.x),B.pixelStorei(3315,S.min.y),B.pixelStorei(32877,S.min.z),H.isDataTexture||H.isData3DTexture?B.texSubImage3D(Le,X,G.x,G.y,G.z,ye,Me,Te,Ce,Oe,qe.data):H.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),B.compressedTexSubImage3D(Le,X,G.x,G.y,G.z,ye,Me,Te,Ce,qe.data)):B.texSubImage3D(Le,X,G.x,G.y,G.z,ye,Me,Te,Ce,Oe,qe),B.pixelStorei(3314,Re),B.pixelStorei(32878,je),B.pixelStorei(3316,Mt),B.pixelStorei(3315,$t),B.pixelStorei(32877,vn),X===0&&z.generateMipmaps&&B.generateMipmap(Le),de.unbindTexture()},this.initTexture=function(S){S.isCubeTexture?Ee.setTextureCube(S,0):S.isData3DTexture?Ee.setTexture3D(S,0):S.isDataArrayTexture||S.isCompressedArrayTexture?Ee.setTexture2DArray(S,0):Ee.setTexture2D(S,0),de.unbindTexture()},this.resetState=function(){v=0,M=0,_=null,de.reset(),C.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}Object.defineProperties(Is.prototype,{physicallyCorrectLights:{get:function(){return console.warn("THREE.WebGLRenderer: the property .physicallyCorrectLights has been removed. Set renderer.useLegacyLights instead."),!this.useLegacyLights},set:function(r){console.warn("THREE.WebGLRenderer: the property .physicallyCorrectLights has been removed. Set renderer.useLegacyLights instead."),this.useLegacyLights=!r}}});class Up extends Is{}Up.prototype.isWebGL1Renderer=!0;class Ns{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new ze(e),this.density=t}clone(){return new Ns(this.color,this.density)}toJSON(){return{type:"FogExp2",color:this.color.getHex(),density:this.density}}}class Fp extends $e{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}get autoUpdate(){return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate}set autoUpdate(e){console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate=e}}class Bp{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=bs,this.updateRange={offset:0,count:-1},this.version=0,this.uuid=_n()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let i=0,s=this.stride;i<s;i++)this.array[e+i]=t.array[n+i];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=_n()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=_n()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const pt=new N;class Mr{constructor(e,t,n,i=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=i}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyMatrix4(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.applyNormalMatrix(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)pt.fromBufferAttribute(this,t),pt.transformDirection(e),this.setXYZ(t,pt.x,pt.y,pt.z);return this}setX(e,t){return this.normalized&&(t=Fe(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Fe(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Fe(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Fe(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=hn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=hn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=hn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=hn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=Fe(t,this.array),n=Fe(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Fe(t,this.array),n=Fe(n,this.array),i=Fe(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this}setXYZW(e,t,n,i,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=Fe(t,this.array),n=Fe(n,this.array),i=Fe(i,this.array),s=Fe(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=i,this.data.array[e+3]=s,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[i+s])}return new Lt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new Mr(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let n=0;n<this.count;n++){const i=n*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[i+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}class Os extends Un{constructor(e){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new ze(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}let ei;const Ei=new N,ti=new N,ni=new N,ii=new De,Ti=new De,Jo=new He,sr=new N,Ci=new N,ar=new N,no=new De,ds=new De,io=new De;class Qo extends $e{constructor(e){if(super(),this.isSprite=!0,this.type="Sprite",ei===void 0){ei=new Pt;const t=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),n=new Bp(t,5);ei.setIndex([0,1,2,0,2,3]),ei.setAttribute("position",new Mr(n,3,0,!1)),ei.setAttribute("uv",new Mr(n,2,3,!1))}this.geometry=ei,this.material=e!==void 0?e:new Os,this.center=new De(.5,.5)}raycast(e,t){e.camera===null&&console.error('THREE.Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ti.setFromMatrixScale(this.matrixWorld),Jo.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),ni.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ti.multiplyScalar(-ni.z);const n=this.material.rotation;let i,s;n!==0&&(s=Math.cos(n),i=Math.sin(n));const o=this.center;or(sr.set(-.5,-.5,0),ni,o,ti,i,s),or(Ci.set(.5,-.5,0),ni,o,ti,i,s),or(ar.set(.5,.5,0),ni,o,ti,i,s),no.set(0,0),ds.set(1,0),io.set(1,1);let a=e.ray.intersectTriangle(sr,Ci,ar,!1,Ei);if(a===null&&(or(Ci.set(-.5,.5,0),ni,o,ti,i,s),ds.set(0,1),a=e.ray.intersectTriangle(sr,ar,Ci,!1,Ei),a===null))return;const l=e.ray.origin.distanceTo(Ei);l<e.near||l>e.far||t.push({distance:l,point:Ei.clone(),uv:kt.getUV(Ei,sr,Ci,ar,no,ds,io,new De),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}}function or(r,e,t,n,i,s){ii.subVectors(r,t).addScalar(.5).multiply(n),i!==void 0?(Ti.x=s*ii.x-i*ii.y,Ti.y=i*ii.x+s*ii.y):Ti.copy(ii),r.copy(e),r.x+=Ti.x,r.y+=Ti.y,r.applyMatrix4(Jo)}class el extends Un{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ze(16777215),this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const ro=new N,so=new N,ao=new He,hs=new Ls,lr=new Ui;class Gp extends $e{constructor(e=new Pt,t=new el){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let i=1,s=t.count;i<s;i++)ro.fromBufferAttribute(t,i-1),so.fromBufferAttribute(t,i),n[i]=n[i-1],n[i]+=ro.distanceTo(so);e.setAttribute("lineDistance",new Rt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,s=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),lr.copy(n.boundingSphere),lr.applyMatrix4(i),lr.radius+=s,e.ray.intersectsSphere(lr)===!1)return;ao.copy(i).invert(),hs.copy(e.ray).applyMatrix4(ao);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=new N,u=new N,h=new N,d=new N,m=this.isLineSegments?2:1,g=n.index,f=n.attributes.position;if(g!==null){const v=Math.max(0,o.start),M=Math.min(g.count,o.start+o.count);for(let _=v,E=M-1;_<E;_+=m){const w=g.getX(_),L=g.getX(_+1);if(c.fromBufferAttribute(f,w),u.fromBufferAttribute(f,L),hs.distanceSqToSegment(c,u,d,h)>l)continue;d.applyMatrix4(this.matrixWorld);const y=e.ray.origin.distanceTo(d);y<e.near||y>e.far||t.push({distance:y,point:h.clone().applyMatrix4(this.matrixWorld),index:_,face:null,faceIndex:null,object:this})}}else{const v=Math.max(0,o.start),M=Math.min(f.count,o.start+o.count);for(let _=v,E=M-1;_<E;_+=m){if(c.fromBufferAttribute(f,_),u.fromBufferAttribute(f,_+1),hs.distanceSqToSegment(c,u,d,h)>l)continue;d.applyMatrix4(this.matrixWorld);const L=e.ray.origin.distanceTo(d);L<e.near||L>e.far||t.push({distance:L,point:h.clone().applyMatrix4(this.matrixWorld),index:_,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}const oo=new N,lo=new N;class kp extends Gp{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[];for(let i=0,s=t.count;i<s;i+=2)oo.fromBufferAttribute(t,i),lo.fromBufferAttribute(t,i+1),n[i]=i===0?0:n[i-1],n[i+1]=n[i]+oo.distanceTo(lo);e.setAttribute("lineDistance",new Rt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class tl extends Un{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ze(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const co=new He,Ts=new Ls,cr=new Ui,ur=new N;class Vp extends $e{constructor(e=new Pt,t=new tl){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=e.material,this.geometry=e.geometry,this}raycast(e,t){const n=this.geometry,i=this.matrixWorld,s=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),cr.copy(n.boundingSphere),cr.applyMatrix4(i),cr.radius+=s,e.ray.intersectsSphere(cr)===!1)return;co.copy(i).invert(),Ts.copy(e.ray).applyMatrix4(co);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=n.index,h=n.attributes.position;if(c!==null){const d=Math.max(0,o.start),m=Math.min(c.count,o.start+o.count);for(let g=d,p=m;g<p;g++){const f=c.getX(g);ur.fromBufferAttribute(h,f),uo(ur,f,l,i,e,t,this)}}else{const d=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let g=d,p=m;g<p;g++)ur.fromBufferAttribute(h,g),uo(ur,g,l,i,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const i=t[n[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=i.length;s<o;s++){const a=i[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function uo(r,e,t,n,i,s,o){const a=Ts.distanceSqToPoint(r);if(a<t){const l=new N;Ts.closestPointToPoint(r,l),l.applyMatrix4(n);const c=i.ray.origin.distanceTo(l);if(c<i.near||c>i.far)return;s.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,object:o})}}class zs extends yt{constructor(e,t,n,i,s,o,a,l,c){super(e,t,n,i,s,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}const dr=new N,hr=new N,fs=new N,fr=new kt;class Hp extends Pt{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const i=Math.pow(10,4),s=Math.cos(pr*t),o=e.getIndex(),a=e.getAttribute("position"),l=o?o.count:a.count,c=[0,0,0],u=["a","b","c"],h=new Array(3),d={},m=[];for(let g=0;g<l;g+=3){o?(c[0]=o.getX(g),c[1]=o.getX(g+1),c[2]=o.getX(g+2)):(c[0]=g,c[1]=g+1,c[2]=g+2);const{a:p,b:f,c:v}=fr;if(p.fromBufferAttribute(a,c[0]),f.fromBufferAttribute(a,c[1]),v.fromBufferAttribute(a,c[2]),fr.getNormal(fs),h[0]=`${Math.round(p.x*i)},${Math.round(p.y*i)},${Math.round(p.z*i)}`,h[1]=`${Math.round(f.x*i)},${Math.round(f.y*i)},${Math.round(f.z*i)}`,h[2]=`${Math.round(v.x*i)},${Math.round(v.y*i)},${Math.round(v.z*i)}`,!(h[0]===h[1]||h[1]===h[2]||h[2]===h[0]))for(let M=0;M<3;M++){const _=(M+1)%3,E=h[M],w=h[_],L=fr[u[M]],U=fr[u[_]],y=`${E}_${w}`,T=`${w}_${E}`;T in d&&d[T]?(fs.dot(d[T].normal)<=s&&(m.push(L.x,L.y,L.z),m.push(U.x,U.y,U.z)),d[T]=null):y in d||(d[y]={index0:c[M],index1:c[_],normal:fs.clone()})}}for(const g in d)if(d[g]){const{index0:p,index1:f}=d[g];dr.fromBufferAttribute(a,p),hr.fromBufferAttribute(a,f),m.push(dr.x,dr.y,dr.z),m.push(hr.x,hr.y,hr.z)}this.setAttribute("position",new Rt(m,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class Us extends Pt{constructor(e=1,t=32,n=16,i=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:i,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new N,d=new N,m=[],g=[],p=[],f=[];for(let v=0;v<=n;v++){const M=[],_=v/n;let E=0;v==0&&o==0?E=.5/t:v==n&&l==Math.PI&&(E=-.5/t);for(let w=0;w<=t;w++){const L=w/t;h.x=-e*Math.cos(i+L*s)*Math.sin(o+_*a),h.y=e*Math.cos(o+_*a),h.z=e*Math.sin(i+L*s)*Math.sin(o+_*a),g.push(h.x,h.y,h.z),d.copy(h).normalize(),p.push(d.x,d.y,d.z),f.push(L+E,1-_),M.push(c++)}u.push(M)}for(let v=0;v<n;v++)for(let M=0;M<t;M++){const _=u[v][M+1],E=u[v][M],w=u[v+1][M],L=u[v+1][M+1];(v!==0||o>0)&&m.push(_,E,L),(v!==n-1||l<Math.PI)&&m.push(E,w,L)}this.setIndex(m),this.setAttribute("position",new Rt(g,3)),this.setAttribute("normal",new Rt(p,3)),this.setAttribute("uv",new Rt(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Us(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class nl extends $e{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ze(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}const ps=new He,ho=new N,fo=new N;class Wp{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new De(512,512),this.map=null,this.mapPass=null,this.matrix=new He,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Rs,this._frameExtents=new De(1,1),this._viewportCount=1,this._viewports=[new st(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,n=this.matrix;ho.setFromMatrixPosition(e.matrixWorld),t.position.copy(ho),fo.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(fo),t.updateMatrixWorld(),ps.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(ps),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(ps)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}class jp extends Wp{constructor(){super(new Xo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class qp extends nl{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy($e.DEFAULT_UP),this.updateMatrix(),this.target=new $e,this.shadow=new jp}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}}class Xp extends nl{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:As}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=As);const po={type:"change"},ms={type:"start"},mo={type:"end"};class Yp extends fl{constructor(e,t){super(),this.object=e,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new sn,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Fn.ROTATE,MIDDLE:Fn.DOLLY,RIGHT:Fn.PAN},this.touches={ONE:Bn.ROTATE,TWO:Bn.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(C){C.addEventListener("keydown",ut),this._domElementKeyEvents=C},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",ut),this._domElementKeyEvents=null},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(po),n.update(),s=i.NONE},this.update=function(){const C=new sn,O=new ks().setFromUnitVectors(e.up,new sn(0,1,0)),oe=O.clone().invert(),se=new sn,me=new ks,_e=2*Math.PI;return function(){const Ae=n.object.position;C.copy(Ae).sub(n.target),C.applyQuaternion(O),a.setFromVector3(C),n.autoRotate&&s===i.NONE&&T(U()),n.enableDamping?(a.theta+=l.theta*n.dampingFactor,a.phi+=l.phi*n.dampingFactor):(a.theta+=l.theta,a.phi+=l.phi);let Ne=n.minAzimuthAngle,Ue=n.maxAzimuthAngle;return isFinite(Ne)&&isFinite(Ue)&&(Ne<-Math.PI?Ne+=_e:Ne>Math.PI&&(Ne-=_e),Ue<-Math.PI?Ue+=_e:Ue>Math.PI&&(Ue-=_e),Ne<=Ue?a.theta=Math.max(Ne,Math.min(Ue,a.theta)):a.theta=a.theta>(Ne+Ue)/2?Math.max(Ne,a.theta):Math.min(Ue,a.theta)),a.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,a.phi)),a.makeSafe(),a.radius*=c,a.radius=Math.max(n.minDistance,Math.min(n.maxDistance,a.radius)),n.enableDamping===!0?n.target.addScaledVector(u,n.dampingFactor):n.target.add(u),C.setFromSpherical(a),C.applyQuaternion(oe),Ae.copy(n.target).add(C),n.object.lookAt(n.target),n.enableDamping===!0?(l.theta*=1-n.dampingFactor,l.phi*=1-n.dampingFactor,u.multiplyScalar(1-n.dampingFactor)):(l.set(0,0,0),u.set(0,0,0)),c=1,h||se.distanceToSquared(n.object.position)>o||8*(1-me.dot(n.object.quaternion))>o?(n.dispatchEvent(po),se.copy(n.object.position),me.copy(n.object.quaternion),h=!1,!0):!1}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",W),n.domElement.removeEventListener("pointerdown",Je),n.domElement.removeEventListener("pointercancel",et),n.domElement.removeEventListener("wheel",St),n.domElement.removeEventListener("pointermove",ct),n.domElement.removeEventListener("pointerup",Qe),n._domElementKeyEvents!==null&&(n._domElementKeyEvents.removeEventListener("keydown",ut),n._domElementKeyEvents=null)};const n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let s=i.NONE;const o=1e-6,a=new Gs,l=new Gs;let c=1;const u=new sn;let h=!1;const d=new jt,m=new jt,g=new jt,p=new jt,f=new jt,v=new jt,M=new jt,_=new jt,E=new jt,w=[],L={};function U(){return 2*Math.PI/60/60*n.autoRotateSpeed}function y(){return Math.pow(.95,n.zoomSpeed)}function T(C){l.theta-=C}function F(C){l.phi-=C}const D=function(){const C=new sn;return function(oe,se){C.setFromMatrixColumn(se,0),C.multiplyScalar(-oe),u.add(C)}}(),Y=function(){const C=new sn;return function(oe,se){n.screenSpacePanning===!0?C.setFromMatrixColumn(se,1):(C.setFromMatrixColumn(se,0),C.crossVectors(n.object.up,C)),C.multiplyScalar(oe),u.add(C)}}(),I=function(){const C=new sn;return function(oe,se){const me=n.domElement;if(n.object.isPerspectiveCamera){const _e=n.object.position;C.copy(_e).sub(n.target);let ge=C.length();ge*=Math.tan(n.object.fov/2*Math.PI/180),D(2*oe*ge/me.clientHeight,n.object.matrix),Y(2*se*ge/me.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(D(oe*(n.object.right-n.object.left)/n.object.zoom/me.clientWidth,n.object.matrix),Y(se*(n.object.top-n.object.bottom)/n.object.zoom/me.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function P(C){n.object.isPerspectiveCamera?c/=C:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom*C)),n.object.updateProjectionMatrix(),h=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function V(C){n.object.isPerspectiveCamera?c*=C:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/C)),n.object.updateProjectionMatrix(),h=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function $(C){d.set(C.clientX,C.clientY)}function Q(C){M.set(C.clientX,C.clientY)}function q(C){p.set(C.clientX,C.clientY)}function K(C){m.set(C.clientX,C.clientY),g.subVectors(m,d).multiplyScalar(n.rotateSpeed);const O=n.domElement;T(2*Math.PI*g.x/O.clientHeight),F(2*Math.PI*g.y/O.clientHeight),d.copy(m),n.update()}function ee(C){_.set(C.clientX,C.clientY),E.subVectors(_,M),E.y>0?P(y()):E.y<0&&V(y()),M.copy(_),n.update()}function pe(C){f.set(C.clientX,C.clientY),v.subVectors(f,p).multiplyScalar(n.panSpeed),I(v.x,v.y),p.copy(f),n.update()}function k(C){C.deltaY<0?V(y()):C.deltaY>0&&P(y()),n.update()}function Z(C){let O=!1;switch(C.code){case n.keys.UP:C.ctrlKey||C.metaKey||C.shiftKey?F(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):I(0,n.keyPanSpeed),O=!0;break;case n.keys.BOTTOM:C.ctrlKey||C.metaKey||C.shiftKey?F(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):I(0,-n.keyPanSpeed),O=!0;break;case n.keys.LEFT:C.ctrlKey||C.metaKey||C.shiftKey?T(2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):I(n.keyPanSpeed,0),O=!0;break;case n.keys.RIGHT:C.ctrlKey||C.metaKey||C.shiftKey?T(-2*Math.PI*n.rotateSpeed/n.domElement.clientHeight):I(-n.keyPanSpeed,0),O=!0;break}O&&(C.preventDefault(),n.update())}function re(){if(w.length===1)d.set(w[0].pageX,w[0].pageY);else{const C=.5*(w[0].pageX+w[1].pageX),O=.5*(w[0].pageY+w[1].pageY);d.set(C,O)}}function B(){if(w.length===1)p.set(w[0].pageX,w[0].pageY);else{const C=.5*(w[0].pageX+w[1].pageX),O=.5*(w[0].pageY+w[1].pageY);p.set(C,O)}}function ce(){const C=w[0].pageX-w[1].pageX,O=w[0].pageY-w[1].pageY,oe=Math.sqrt(C*C+O*O);M.set(0,oe)}function ue(){n.enableZoom&&ce(),n.enablePan&&B()}function he(){n.enableZoom&&ce(),n.enableRotate&&re()}function de(C){if(w.length==1)m.set(C.pageX,C.pageY);else{const oe=xe(C),se=.5*(C.pageX+oe.x),me=.5*(C.pageY+oe.y);m.set(se,me)}g.subVectors(m,d).multiplyScalar(n.rotateSpeed);const O=n.domElement;T(2*Math.PI*g.x/O.clientHeight),F(2*Math.PI*g.y/O.clientHeight),d.copy(m)}function Se(C){if(w.length===1)f.set(C.pageX,C.pageY);else{const O=xe(C),oe=.5*(C.pageX+O.x),se=.5*(C.pageY+O.y);f.set(oe,se)}v.subVectors(f,p).multiplyScalar(n.panSpeed),I(v.x,v.y),p.copy(f)}function be(C){const O=xe(C),oe=C.pageX-O.x,se=C.pageY-O.y,me=Math.sqrt(oe*oe+se*se);_.set(0,me),E.set(0,Math.pow(_.y/M.y,n.zoomSpeed)),P(E.y),M.copy(_)}function Ee(C){n.enableZoom&&be(C),n.enablePan&&Se(C)}function Ie(C){n.enableZoom&&be(C),n.enableRotate&&de(C)}function Je(C){n.enabled!==!1&&(w.length===0&&(n.domElement.setPointerCapture(C.pointerId),n.domElement.addEventListener("pointermove",ct),n.domElement.addEventListener("pointerup",Qe)),te(C),C.pointerType==="touch"?b(C):Ve(C))}function ct(C){n.enabled!==!1&&(C.pointerType==="touch"?x(C):Be(C))}function Qe(C){ne(C),w.length===0&&(n.domElement.releasePointerCapture(C.pointerId),n.domElement.removeEventListener("pointermove",ct),n.domElement.removeEventListener("pointerup",Qe)),n.dispatchEvent(mo),s=i.NONE}function et(C){ne(C)}function Ve(C){let O;switch(C.button){case 0:O=n.mouseButtons.LEFT;break;case 1:O=n.mouseButtons.MIDDLE;break;case 2:O=n.mouseButtons.RIGHT;break;default:O=-1}switch(O){case Fn.DOLLY:if(n.enableZoom===!1)return;Q(C),s=i.DOLLY;break;case Fn.ROTATE:if(C.ctrlKey||C.metaKey||C.shiftKey){if(n.enablePan===!1)return;q(C),s=i.PAN}else{if(n.enableRotate===!1)return;$(C),s=i.ROTATE}break;case Fn.PAN:if(C.ctrlKey||C.metaKey||C.shiftKey){if(n.enableRotate===!1)return;$(C),s=i.ROTATE}else{if(n.enablePan===!1)return;q(C),s=i.PAN}break;default:s=i.NONE}s!==i.NONE&&n.dispatchEvent(ms)}function Be(C){switch(s){case i.ROTATE:if(n.enableRotate===!1)return;K(C);break;case i.DOLLY:if(n.enableZoom===!1)return;ee(C);break;case i.PAN:if(n.enablePan===!1)return;pe(C);break}}function St(C){n.enabled===!1||n.enableZoom===!1||s!==i.NONE||(C.preventDefault(),n.dispatchEvent(ms),k(C),n.dispatchEvent(mo))}function ut(C){n.enabled===!1||n.enablePan===!1||Z(C)}function b(C){switch(ae(C),w.length){case 1:switch(n.touches.ONE){case Bn.ROTATE:if(n.enableRotate===!1)return;re(),s=i.TOUCH_ROTATE;break;case Bn.PAN:if(n.enablePan===!1)return;B(),s=i.TOUCH_PAN;break;default:s=i.NONE}break;case 2:switch(n.touches.TWO){case Bn.DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;ue(),s=i.TOUCH_DOLLY_PAN;break;case Bn.DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;he(),s=i.TOUCH_DOLLY_ROTATE;break;default:s=i.NONE}break;default:s=i.NONE}s!==i.NONE&&n.dispatchEvent(ms)}function x(C){switch(ae(C),s){case i.TOUCH_ROTATE:if(n.enableRotate===!1)return;de(C),n.update();break;case i.TOUCH_PAN:if(n.enablePan===!1)return;Se(C),n.update();break;case i.TOUCH_DOLLY_PAN:if(n.enableZoom===!1&&n.enablePan===!1)return;Ee(C),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(n.enableZoom===!1&&n.enableRotate===!1)return;Ie(C),n.update();break;default:s=i.NONE}}function W(C){n.enabled!==!1&&C.preventDefault()}function te(C){w.push(C)}function ne(C){delete L[C.pointerId];for(let O=0;O<w.length;O++)if(w[O].pointerId==C.pointerId){w.splice(O,1);return}}function ae(C){let O=L[C.pointerId];O===void 0&&(O=new jt,L[C.pointerId]=O),O.set(C.pageX,C.pageY)}function xe(C){const O=C.pointerId===w[0].pointerId?w[1]:w[0];return L[O.pointerId]}n.domElement.addEventListener("contextmenu",W),n.domElement.addEventListener("pointerdown",Je),n.domElement.addEventListener("pointercancel",et),n.domElement.addEventListener("wheel",St,{passive:!1}),this.update()}}let gs=null;const go=new Map;function $p(r){const e=r.charAt(0).toUpperCase();return wo[e]||rt.defaultStarColor}function Kp(){const r=document.createElement("canvas");r.width=64,r.height=64;const e=r.getContext("2d"),t=e.createRadialGradient(32,32,0,32,32,32);return t.addColorStop(0,"rgba(255, 255, 255, 1.0)"),t.addColorStop(.2,"rgba(255, 255, 255, 0.8)"),t.addColorStop(.4,"rgba(255, 255, 255, 0.4)"),t.addColorStop(.7,"rgba(255, 255, 255, 0.1)"),t.addColorStop(1,"rgba(255, 255, 255, 0)"),e.fillStyle=t,e.fillRect(0,0,64,64),new zs(r)}function Zp(r,e=18){const t=document.createElement("canvas"),n=t.getContext("2d");n.font=`${e}px 'Courier New', monospace`;const s=n.measureText(r).width,o=e*1.4;t.width=s+20,t.height=o+10,n.font=`${e}px 'Courier New', monospace`,n.textAlign="center",n.textBaseline="middle",n.fillStyle="#00FF88",n.shadowColor="#00FF88",n.shadowBlur=10,n.fillText(r,t.width/2,t.height/2);const a=new zs(t);a.needsUpdate=!0;const l=new Os({map:a,transparent:!0,depthTest:!1,depthWrite:!1}),c=new Qo(l),u=e*2;return c.scale.set(u*(t.width/t.height),u,1),c}function Jp(r,e){const t=[];return gs||(gs=Kp()),e.forEach(n=>{const i=$p(n.type);let s=go.get(i);s||(s=new Os({map:gs,color:i,transparent:!0,blending:yr,depthWrite:!1,sizeAttenuation:!0}),go.set(i,s));const o=new Qo(s);o.scale.set(rt.starSize,rt.starSize,1),o.position.set(n.x,n.y,n.z),r.add(o);const a=Zp(n.name,bl.maxFontSize);a.position.set(n.x,n.y+15,n.z),r.add(a);const l={data:n,sprite:o,label:a,selectionRing:null,position:o.position,originalColor:i};t.push(l)}),console.log(`Created ${t.length} star systems`),t}const Ni=[{id:0,x:0,y:0,z:0,name:"Sol",type:"G2",wh:8,st:6,r:1},{id:1,x:-23.1,y:-19.18,z:-53.76,name:"Alpha Centauri A",type:"G2",wh:6,st:9,r:1},{id:2,x:-23.1,y:-19.18,z:-53.76,name:"Alpha Centauri B",type:"K0",wh:0,st:0,r:0},{id:3,x:-21.56,y:-16.38,z:-52.5,name:"Proxima Centauri C",type:"M5.5",wh:0,st:0,r:0},{id:4,x:-.98,y:-82.88,z:6.86,name:"Barnard's Star",type:"M5",wh:3,st:1,r:1},{id:5,x:-104.16,y:29.82,z:13.3,name:"Wolf 359",type:"M6",wh:4,st:6,r:1},{id:6,x:-91.28,y:23.1,z:68.32,name:"Lalande 21185",type:"M2",wh:1,st:8,r:1},{id:7,x:-22.54,y:113.12,z:-34.58,name:"Sirius A",type:"A1",wh:4,st:3,r:1},{id:8,x:-22.54,y:113.12,z:-34.58,name:"Sirius B",type:"DA2",wh:0,st:0,r:0},{id:9,x:105.56,y:48.72,z:-37.66,name:"L 726-8 A",type:"M5.5",wh:5,st:2,r:1},{id:10,x:105.56,y:48.72,z:-37.66,name:"L 726-8 B",type:"M5.5",wh:0,st:0,r:0},{id:11,x:26.46,y:-121.24,z:-54.88,name:"Ross 154",type:"M4.5",wh:4,st:4,r:1},{id:12,x:103.32,y:-8.54,z:100.8,name:"Ross 248",type:"M6",wh:1,st:2,r:1},{id:13,x:87.22,y:115.92,z:-24.22,name:"Epsilon Eridani",type:"K2",wh:4,st:5,r:1},{id:14,x:118.3,y:-28.84,z:-87.92,name:"Lacaille 9352",type:"M2",wh:2,st:5,r:1},{id:15,x:-152.18,y:8.54,z:2.1,name:"Ross 128",type:"M4.5",wh:3,st:9,r:1},{id:16,x:140.14,y:-52.36,z:-40.88,name:"L 789-6 A",type:"M5.5",wh:2,st:4,r:1},{id:17,x:140.14,y:-52.36,z:-40.88,name:"L 789-6 B",type:"M5",wh:0,st:0,r:0},{id:18,x:140.14,y:-52.36,z:-40.88,name:"L 789-6 C",type:"M7",wh:0,st:0,r:0},{id:19,x:-66.64,y:144.48,z:14.56,name:"Procyon A",type:"F5",wh:1,st:7,r:1},{id:20,x:-66.64,y:144.48,z:14.56,name:"Procyon B",type:"DA",wh:0,st:0,r:0},{id:21,x:90.44,y:-85.68,z:99.96,name:"61 Cygni A",type:"K5",wh:2,st:5,r:0},{id:22,x:90.44,y:-85.68,z:99.96,name:"61 Cygni B",type:"K7",wh:0,st:0,r:0},{id:23,x:14.98,y:-80.78,z:140.14,name:"Struve 2398 A",type:"M4",wh:3,st:3,r:1},{id:24,x:14.98,y:-80.78,z:140.14,name:"Struve 2398 B",type:"M5",wh:0,st:0,r:0},{id:25,x:116.76,y:9.24,z:113.26,name:"Groombridge 34 A",type:"M2",wh:3,st:5,r:0},{id:26,x:116.76,y:9.24,z:113.26,name:"Groombridge 34 B",type:"M6",wh:0,st:0,r:0},{id:27,x:-89.6,y:117.6,z:74.62,name:"G51-15",type:"M6.5",wh:3,st:8,r:1},{id:28,x:79.24,y:-44.24,z:-138.6,name:"Epsilon Indi A",type:"K4",wh:3,st:1,r:0},{id:29,x:79.38,y:-43.96,z:-138.6,name:"Epsilon Indi B",type:"T1",wh:0,st:0,r:0},{id:30,x:79.38,y:-43.96,z:-138.6,name:"Epsilon Indi C",type:"T6",wh:0,st:0,r:0},{id:31,x:143.92,y:70.28,z:-45.78,name:"Tau Ceti",type:"G8",wh:3,st:2,r:1},{id:32,x:70.7,y:97.44,z:-118.44,name:"L 372-58",type:"M5.5",wh:3,st:1,r:1},{id:33,x:154.28,y:50.26,z:-49.56,name:"L 725-32",type:"M5",wh:1,st:4,r:1},{id:34,x:-64.12,y:160.44,z:15.82,name:"Luyten's Star",type:"M3.5",wh:2,st:5,r:1},{id:35,x:122.78,y:115.5,z:51.24,name:"SO 0253+1652",type:"M6.5",wh:3,st:3,r:1},{id:36,x:26.74,y:123.62,z:-126.56,name:"Kapteyn's Star",type:"M1",wh:2,st:2,r:1},{id:37,x:15.4,y:-77.42,z:-161.56,name:"SCR 1845-6357 A",type:"M8.5",wh:3,st:1,r:0},{id:38,x:15.4,y:-77.42,z:-161.56,name:"SCR 1845-6357 B",type:"T5.5",wh:0,st:0,r:0},{id:39,x:106.26,y:-91.56,z:-113.12,name:"Lacaille 8760",type:"M0",wh:1,st:4,r:1},{id:40,x:90.02,y:-38.22,z:154.7,name:"Kruger 60 A",type:"M3",wh:2,st:9,r:0},{id:41,x:90.02,y:-38.22,z:154.7,name:"Kruger 60 B",type:"M6",wh:0,st:0,r:0},{id:42,x:-134.4,y:43.68,z:-118.3,name:"DENIS 1048-39",type:"M9",wh:1,st:13,r:1},{id:43,x:-23.8,y:186.34,z:-9.24,name:"Ross 614 A",type:"M4.5",wh:0,st:9,r:0},{id:44,x:-23.8,y:186.34,z:-9.24,name:"Ross 614 B",type:"M7",wh:0,st:0,r:0},{id:45,x:-72.66,y:-175.56,z:-42.7,name:"Wolf 1061",type:"M3.5",wh:1,st:5,r:1},{id:46,x:-192.22,y:-27.86,z:30.8,name:"Wolf 424 A",type:"M5.5",wh:3,st:9,r:1},{id:47,x:-192.22,y:-27.86,z:30.8,name:"Wolf 424 B",type:"M7",wh:0,st:0,r:0},{id:48,x:158.2,y:3.5,z:-120.82,name:"CD-37 15492",type:"M4",wh:1,st:4,r:1},{id:49,x:195.72,y:42.56,z:18.9,name:"van Maanen's Star",type:"DZ7",wh:1,st:4,r:1},{id:50,x:172.06,y:99.4,z:46.06,name:"L 1159-16",type:"M8",wh:1,st:8,r:1},{id:51,x:-93.1,y:32.06,z:-179.06,name:"L 143-23",type:"M5.5",wh:2,st:10,r:1},{id:52,x:-192.64,y:62.58,z:-40.6,name:"LP 731-58",type:"M6.5",wh:2,st:14,r:1},{id:53,x:-7.98,y:-75.88,z:192.22,name:"BD+68 946",type:"M3.5",wh:2,st:8,r:1},{id:54,x:-19.6,y:-140.14,z:-151.34,name:"CD-46 11540",type:"M3",wh:1,st:6,r:0},{id:55,x:-89.6,y:5.88,z:-190.96,name:"L 145-141",type:"DQ6",wh:2,st:10,r:1},{id:56,x:212.66,y:5.74,z:-28.14,name:"G158-27",type:"M5.5",wh:2,st:6,r:1},{id:57,x:199.36,y:-59.92,z:-52.92,name:"Ross 780",type:"M5",wh:2,st:6,r:1},{id:58,x:72.94,y:-135.52,z:150.78,name:"G208-44 A",type:"M5.5",wh:1,st:7,r:0},{id:59,x:72.94,y:-135.52,z:150.78,name:"G208-44 B",type:"M6",wh:0,st:0,r:0},{id:60,x:72.94,y:-135.52,z:150.78,name:"G208-44 C",type:"M8",wh:0,st:0,r:0},{id:61,x:-155.4,y:37.94,z:152.04,name:"Lalande 21258 A",type:"M2",wh:2,st:9,r:0},{id:62,x:-155.4,y:37.94,z:151.9,name:"Lalande 21258 B",type:"M6",wh:0,st:0,r:0},{id:63,x:-128.66,y:66.22,z:168.98,name:"Groombridge 1618",type:"K7",wh:2,st:9,r:1},{id:64,x:110.32,y:105.56,z:-163.8,name:"DENIS 0255-47",type:"L8",wh:1,st:3,r:1},{id:65,x:-190.54,y:89.74,z:76.16,name:"BD+20 2465",type:"M4.5",wh:2,st:10,r:1},{id:66,x:118.44,y:-88.34,z:-170.1,name:"L 354-89",type:"M1",wh:1,st:7,r:0},{id:67,x:106.54,y:150.92,z:-131.46,name:"LP 944-20",type:"M9",wh:1,st:4,r:1},{id:68,x:-16.52,y:-163.94,z:-160.86,name:"CD-44 11909",type:"M3.5",wh:2,st:6,r:0},{id:69,x:100.94,y:204.68,z:-30.66,name:"Omicron² Eridani A",type:"K1",wh:1,st:10,r:0},{id:70,x:100.94,y:204.68,z:-30.66,name:"Omicron² Eridani B",type:"DA4",wh:0,st:0,r:0},{id:71,x:100.94,y:204.68,z:-30.66,name:"Omicron² Eridani C",type:"M4.5",wh:0,st:0,r:0},{id:72,x:156.38,y:-52.22,z:161.14,name:"BD+43 4305",type:"M4.5",wh:1,st:2,r:0},{id:73,x:5.18,y:-231.98,z:10.08,name:"70 Ophiuchi A",type:"K0",wh:2,st:8,r:1},{id:74,x:5.18,y:-231.98,z:10.08,name:"70 Ophiuchi B",type:"K5",wh:0,st:0,r:0},{id:75,x:107.24,y:-205.66,z:36.12,name:"Altair",type:"A7",wh:1,st:9,r:1},{id:76,x:-157.5,y:160.16,z:80.78,name:"G9-38 A",type:"M5.5",wh:1,st:7,r:1},{id:77,x:-157.5,y:160.16,z:80.78,name:"G9-38 B",type:"M5.5",wh:0,st:0,r:0},{id:78,x:232.12,y:15.26,z:-67.34,name:"L 722-22 A",type:"M4",wh:1,st:8,r:1},{id:79,x:232.12,y:15.26,z:-67.34,name:"L 722-22 B",type:"M6",wh:0,st:0,r:0},{id:80,x:0,y:244.86,z:11.48,name:"G99-49",type:"M4",wh:1,st:3,r:0},{id:81,x:-48.3,y:2.66,z:241.5,name:"G254-29",type:"M4",wh:1,st:6,r:0},{id:82,x:-214.9,y:-106.12,z:63.7,name:"Lalande 25372",type:"M4",wh:1,st:10,r:1},{id:83,x:62.16,y:240.1,z:-30.24,name:"LP 656-38",type:"M3.5",wh:1,st:4,r:0},{id:84,x:163.66,y:-175.28,z:-73.22,name:"LP 816-60",type:"M5",wh:1,st:6,r:0},{id:85,x:49.14,y:120.12,z:215.74,name:"Stein 2051 A",type:"M4",wh:1,st:8,r:0},{id:86,x:49.14,y:120.12,z:215.74,name:"Stein 2051 B",type:"DC5",wh:0,st:0,r:0},{id:87,x:-49.28,y:204.68,z:138.18,name:"Wolf 294",type:"M4",wh:1,st:7,r:0},{id:88,x:33.04,y:-214.48,z:140.84,name:"2MASS 1835+32",type:"M8.5",wh:1,st:11,r:0},{id:89,x:32.62,y:257.18,z:-16.66,name:"Wolf 1453",type:"M1.5",wh:1,st:7,r:0},{id:90,x:114.24,y:231.7,z:-43.54,name:"2MASS 0415-09",type:"T8.5",wh:1,st:10,r:0},{id:91,x:35.84,y:-84.28,z:246.96,name:"Sigma Draconis",type:"K0",wh:1,st:11,r:1},{id:92,x:-10.78,y:244.44,z:-98.14,name:"L 668-21 A",type:"M1",wh:1,st:8,r:1},{id:93,x:-10.78,y:244.44,z:-98.14,name:"L 668-21 B",type:"T6",wh:0,st:0,r:0},{id:94,x:20.16,y:257.32,z:57.12,name:"Ross 47",type:"M4",wh:1,st:11,r:0},{id:95,x:-8.68,y:-142.94,z:-223.3,name:"L 205-128",type:"M3.5",wh:0,st:4,r:0},{id:96,x:87.08,y:-252.56,z:24.22,name:"Wolf 1055 A",type:"M3.5",wh:0,st:5,r:0},{id:97,x:88.06,y:-252.28,z:24.08,name:"Wolf 1055 B",type:"M8",wh:0,st:0,r:0},{id:98,x:-136.22,y:209.58,z:-98.7,name:"L 674-15",type:"M4",wh:1,st:8,r:0},{id:99,x:-179.76,y:-175.28,z:-98.42,name:"Lalande 27173 A",type:"K5",wh:1,st:7,r:0},{id:100,x:-179.76,y:-175.28,z:-98.42,name:"Lalande 27173 B",type:"M1",wh:0,st:0,r:0},{id:101,x:-179.76,y:-175.28,z:-98.42,name:"Lalande 27173 C",type:"M3",wh:0,st:0,r:0},{id:102,x:-179.9,y:-175.28,z:-98.28,name:"Lalande 27173 D",type:"T8",wh:0,st:0,r:0},{id:103,x:64.82,y:-177.8,z:-192.92,name:"L 347-14",type:"M4.5",wh:1,st:9,r:0},{id:104,x:-118.72,y:242.9,z:16.8,name:"Ross 882",type:"M4.5",wh:0,st:9,r:0},{id:105,x:-122.5,y:-162.54,z:-178.78,name:"CD-40 9712",type:"M3",wh:1,st:10,r:1},{id:106,x:141.54,y:30.8,z:230.16,name:"Eta Cassiopeiae A",type:"G0",wh:0,st:7,r:0},{id:107,x:141.54,y:30.8,z:230.16,name:"Eta Cassiopeiae B",type:"K7",wh:0,st:0,r:0},{id:108,x:272.02,y:-13.02,z:11.48,name:"Lalande 46650",type:"M2",wh:0,st:9,r:0},{id:109,x:-47.6,y:-239.68,z:-122.36,name:"36 Ophiuchi A",type:"K1",wh:1,st:7,r:0},{id:110,x:-47.6,y:-239.68,z:-122.36,name:"36 Ophiuchi B",type:"K1",wh:0,st:0,r:0},{id:111,x:-46.48,y:-239.4,z:-121.8,name:"36 Ophiuchi C",type:"K5",wh:0,st:0,r:0},{id:112,x:120.82,y:-187.74,z:-162.82,name:"CD-36 13940 A",type:"K3",wh:0,st:9,r:0},{id:113,x:120.82,y:-187.74,z:-162.82,name:"CD-36 13940 B",type:"M3.5",wh:0,st:0,r:0},{id:114,x:130.48,y:154.42,z:-189,name:"82 Eridani",type:"G5",wh:0,st:6,r:0},{id:115,x:59.78,y:-95.48,z:-255.08,name:"Delta Pavonis",type:"G5",wh:0,st:8,r:0},{id:116,x:-213.36,y:-169.82,z:-60.48,name:"Wolf 1481",type:"M3",wh:0,st:9,r:0}];function Qp(){try{const r=document.createElement("canvas");if(!(r.getContext("webgl")||r.getContext("experimental-webgl")))throw new Error("WebGL not supported");const t=new Fp;t.background=new ze(rt.sceneBackground),t.fog=new Ns(rt.sceneBackground,rt.fogDensity);const n=new Ot(60,window.innerWidth/window.innerHeight,1,1e4);n.position.set(500,500,500),n.lookAt(0,0,0);const i=new Is({antialias:!0});i.setSize(window.innerWidth,window.innerHeight),i.setPixelRatio(window.devicePixelRatio);const s=new Xp(rt.ambientLightColor,rt.ambientLightIntensity);t.add(s);const o=new qp(rt.directionalLightColor,rt.directionalLightIntensity);o.position.set(1,1,1).normalize(),t.add(o);const a=em(n,i);console.log("Scene initialized successfully");const l=im(t),c=nm(t),u=Jp(t,Ni);return{scene:t,camera:n,renderer:i,controls:a,lights:{ambientLight:s,directionalLight:o},starfield:l,sectorBoundary:c,stars:u}}catch(r){throw console.error("Failed to initialize Three.js scene:",r),r}}function em(r,e){const t=new Yp(r,e.domElement);return t.mouseButtons={LEFT:Ir.ROTATE,MIDDLE:Ir.DOLLY,RIGHT:Ir.PAN},t.enableDamping=!0,t.dampingFactor=rt.dampingFactor,t.rotateSpeed=1,t.panSpeed=1,t.zoomSpeed=rt.zoomSpeed,t.minDistance=50,t.maxDistance=2e3,t.enableRotate=!0,t.enablePan=!0,t.enableZoom=!0,t.target.set(0,0,0),t.update(),console.log("Camera controls initialized with OrbitControls"),t}function tm(r,e){r.aspect=window.innerWidth/window.innerHeight,r.updateProjectionMatrix(),e.setSize(window.innerWidth,window.innerHeight)}function nm(r){const e=new Us(rt.sectorBoundaryRadius,32,32),t=new Hp(e);e.dispose();const n=new el({color:rt.sectorBoundaryColor,transparent:!0,opacity:.5}),i=new kp(t,n);return i.position.set(0,0,0),i.visible=!0,r.add(i),console.log(`Sector boundary created with radius ${rt.sectorBoundaryRadius}`),i}function im(r){const e=new Pt,t=rt.starfieldCount,n=new Float32Array(t*3),i=new Float32Array(t*3),s=rt.starfieldMinRadius,o=rt.starfieldMaxRadius,a=["O","B","A","F","G","K","M"],l=[.02,.08,.15,.2,.25,.2,.1];for(let d=0;d<t;d++){const m=Math.random()*Math.PI*2,g=Math.acos(2*Math.random()-1),p=s+Math.random()*(o-s),f=p*Math.sin(g)*Math.cos(m),v=p*Math.sin(g)*Math.sin(m),M=p*Math.cos(g);n[d*3]=f,n[d*3+1]=v,n[d*3+2]=M;const _=Math.random();let E=0,w="G";for(let D=0;D<a.length;D++)if(E+=l[D],_<E){w=a[D];break}const L=wo[w],U=.6+Math.random()*.4,y=(L>>16&255)/255*U,T=(L>>8&255)/255*U,F=(L&255)/255*U;i[d*3]=y,i[d*3+1]=T,i[d*3+2]=F}e.setAttribute("position",new Lt(n,3)),e.setAttribute("color",new Lt(i,3));const c=rm(),u=new tl({size:4,map:c,sizeAttenuation:!1,vertexColors:!0,transparent:!0,opacity:1,blending:yr,depthWrite:!1}),h=new Vp(e,u);return r.add(h),console.log(`Created starfield background with ${t} stars`),h}function rm(){const r=document.createElement("canvas");r.width=64,r.height=64;const e=r.getContext("2d"),t=32,n=32,i=e.createRadialGradient(t,n,0,t,n,32);i.addColorStop(0,"rgba(255, 255, 255, 1.0)"),i.addColorStop(.2,"rgba(255, 255, 255, 0.8)"),i.addColorStop(.4,"rgba(255, 255, 255, 0.4)"),i.addColorStop(.7,"rgba(255, 255, 255, 0.1)"),i.addColorStop(1,"rgba(255, 255, 255, 0)"),e.fillStyle=i,e.fillRect(0,0,64,64);const s=new zs(r);return s.needsUpdate=!0,s}function sm(){const r=vt.useRef(null),e=vt.useRef(null);return vt.useEffect(()=>{if(!r.current||e.current)return;let t,n,i,s,o,a;try{let l=function(){a=requestAnimationFrame(l),s.update(),i.render(t,n)};const c=Qp();t=c.scene,n=c.camera,i=c.renderer,s=c.controls,o=c.lights,r.current.appendChild(i.domElement),e.current={scene:t,camera:n,renderer:i,controls:s,lights:o},l();const u=()=>{tm(n,i)};return window.addEventListener("resize",u),()=>{a&&cancelAnimationFrame(a),window.removeEventListener("resize",u),i&&(r.current&&i.domElement&&r.current.contains(i.domElement)&&r.current.removeChild(i.domElement),i.dispose()),t&&t.traverse(h=>{h.geometry&&h.geometry.dispose(),h.material&&(Array.isArray(h.material)?h.material.forEach(d=>{d.map&&d.map.dispose(),d.dispose()}):(h.material.map&&h.material.map.dispose(),h.material.dispose()))}),e.current=null}}catch(l){throw console.error("Failed to initialize Three.js scene:",l),l}},[]),A.jsx("div",{ref:r,className:"starmap-container",style:{position:"absolute",top:0,left:0,width:"100%",height:"100%",zIndex:0}})}const il=vt.createContext(null);function am({gameStateManager:r,children:e}){return r?A.jsx(il.Provider,{value:r,children:e}):A.jsx("div",{className:"game-loading",children:A.jsx("p",{children:"Loading game..."})})}function mi(){const r=vt.useContext(il);if(!r)throw new Error("useGameState must be used within GameProvider");return r}function xt(r){const e=mi(),[t,n]=vt.useState(()=>{const i=e.getState();return om(r,i)});return vt.useEffect(()=>{const i=s=>{n(s)};return e.subscribe(r,i),()=>{e.unsubscribe(r,i)}},[e,r]),t}function om(r,e){if(!e)throw new Error("extractStateForEvent called with null state - GameStateManager not initialized");if(!e.player)throw new Error("Invalid game state: player object missing");if(!e.ship)throw new Error("Invalid game state: ship object missing");if(!e.world)throw new Error("Invalid game state: world object missing");return{creditsChanged:e.player.credits,debtChanged:e.player.debt,fuelChanged:e.ship.fuel,locationChanged:e.player.currentSystem,timeChanged:e.player.daysElapsed,cargoChanged:e.ship.cargo,shipConditionChanged:{hull:e.ship.hull,engine:e.ship.engine,lifeSupport:e.ship.lifeSupport},priceKnowledgeChanged:e.world.priceKnowledge,activeEventsChanged:e.world.activeEvents,shipNameChanged:e.ship.name,conditionWarning:null}[r]??null}function lm(){const r=xt("creditsChanged"),e=xt("debtChanged");return A.jsxs("div",{className:"hud-section hud-finances",children:[A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Credits:"}),A.jsx("span",{className:"hud-value",children:r.toLocaleString()})]}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Debt:"}),A.jsx("span",{className:"hud-value",children:e.toLocaleString()})]})]})}function cm(){const r=xt("timeChanged");return A.jsx("div",{className:"hud-section hud-time",children:A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Days:"}),A.jsx("span",{className:"hud-value",children:r})]})})}function um(){const r=mi(),e=xt("shipNameChanged"),t=xt("fuelChanged"),n=xt("shipConditionChanged"),i=xt("cargoChanged"),s=n.hull,o=n.engine,a=n.lifeSupport,l=i.reduce((h,d)=>h+d.qty,0),u=r.getShip().cargoCapacity;return A.jsxs("div",{className:"hud-section hud-ship",children:[A.jsx("div",{className:"hud-row hud-ship-name-row",children:A.jsx("span",{id:"hud-ship-name",className:"hud-ship-name",children:e})}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Fuel:"}),A.jsxs("div",{className:"fuel-bar-container condition-bar-container",children:[A.jsx("div",{className:"fuel-bar condition-bar",style:{width:`${t}%`}}),A.jsxs("span",{className:"condition-text",children:[t.toFixed(1),"%"]})]})]}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Hull:"}),A.jsxs("div",{className:"hull-bar-container condition-bar-container",children:[A.jsx("div",{className:"hull-bar condition-bar",style:{width:`${s}%`}}),A.jsxs("span",{className:"condition-text",children:[s.toFixed(1),"%"]})]})]}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Engine:"}),A.jsxs("div",{className:"engine-bar-container condition-bar-container",children:[A.jsx("div",{className:"engine-bar condition-bar",style:{width:`${o}%`}}),A.jsxs("span",{className:"condition-text",children:[o.toFixed(1),"%"]})]})]}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Life Support:"}),A.jsxs("div",{className:"life-support-bar-container condition-bar-container",children:[A.jsx("div",{className:"life-support-bar condition-bar",style:{width:`${a}%`}}),A.jsxs("span",{className:"condition-text",children:[a.toFixed(1),"%"]})]})]}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Cargo:"}),A.jsxs("span",{id:"hud-cargo",className:"hud-value",children:[l,"/",u]})]})]})}function dm(){const r=xt("locationChanged"),e=Ni.find(n=>n.id===r);if(!e)throw new Error(`Invalid game state: current system ID ${r} not found in star data`);const t=wr(e);return A.jsxs("div",{className:"hud-section hud-location",children:[A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"System:"}),A.jsx("span",{id:"hud-system",className:"hud-value",children:e.name})]}),A.jsxs("div",{className:"hud-row",children:[A.jsx("span",{className:"hud-label",children:"Distance from Sol:"}),A.jsxs("span",{id:"hud-distance",className:"hud-value",children:[t.toFixed(1)," LY"]})]})]})}function hm({onDock:r}){const e=mi(),t=xt("locationChanged"),i=e.starData.find(l=>l.id===t);if(!i)throw new Error(`Invalid game state: current system ID ${t} not found in star data`);const s=i.st>0,o=()=>{},a=()=>{s&&r&&r()};return A.jsxs("div",{className:"hud-section hud-quick-access",children:[A.jsx("div",{className:"hud-quick-access-label",children:"Quick Access:"}),A.jsxs("div",{className:"hud-quick-access-buttons",children:[A.jsx("button",{className:"quick-access-btn",onClick:o,children:"System Info"}),A.jsx("button",{className:"quick-access-btn",onClick:a,disabled:!s,children:"Dock"})]})]})}function fm({onDock:r}){return A.jsxs("div",{id:"game-hud",className:"visible",children:[A.jsx(lm,{}),A.jsx(cm,{}),A.jsx(um,{}),A.jsx(dm,{}),A.jsx(hm,{onDock:r})]})}function pm({onOpenPanel:r,onUndock:e}){const t=xt("locationChanged"),n=Ni.find(s=>s.id===t);if(!n)throw new Error(`Invalid game state: current system ID ${t} not found in star data`);const i=wr(n);return A.jsxs("div",{id:"station-interface",className:"visible",children:[A.jsx("button",{className:"close-btn",onClick:e,children:"×"}),A.jsxs("h2",{children:[n.name," Station"]}),A.jsxs("div",{className:"station-info",children:[A.jsxs("div",{className:"info-row",children:[A.jsx("span",{className:"label",children:"System:"}),A.jsx("span",{children:n.name})]}),A.jsxs("div",{className:"info-row",children:[A.jsx("span",{className:"label",children:"Distance from Sol:"}),A.jsxs("span",{children:[i.toFixed(1)," LY"]})]})]}),A.jsxs("div",{className:"station-actions",children:[A.jsx("button",{className:"station-btn",onClick:()=>r("trade"),children:"Trade"}),A.jsx("button",{className:"station-btn",onClick:()=>r("refuel"),children:"Refuel"}),A.jsx("button",{className:"station-btn",onClick:()=>r("repair"),children:"Repairs"}),A.jsx("button",{className:"station-btn",onClick:()=>r("info-broker"),children:"Info Broker"}),A.jsx("button",{className:"station-btn",onClick:()=>r("upgrades"),children:"Upgrades"}),A.jsx("button",{className:"station-btn",onClick:()=>r("cargo-manifest"),children:"Cargo Manifest"}),A.jsx("button",{className:"station-btn",onClick:()=>r("ship-status"),children:"Ship Status"}),A.jsx("button",{className:"station-btn",onClick:e,children:"Undock"})]})]})}function rl(){const r=mi();return vt.useMemo(()=>({jump:t=>r.navigationSystem.jump(t),buyGood:(t,n,i)=>r.buyGood(t,n,i),sellGood:(t,n,i)=>r.sellGood(t,n,i),refuel:t=>r.refuel(t),repair:(t,n)=>r.repairShipSystem(t,n),purchaseUpgrade:t=>r.purchaseUpgrade(t),purchaseIntelligence:t=>r.purchaseIntelligence(t),dock:()=>r.dock(),undock:()=>r.undock(),saveGame:()=>r.saveGame(),newGame:()=>r.initNewGame(),updateShipName:t=>{r.updateShipName(t)},moveToHiddenCargo:(t,n)=>r.moveToHiddenCargo(t,n),moveToRegularCargo:(t,n)=>r.moveToRegularCargo(t,n)}),[r])}function _s(r){return r.charAt(0).toUpperCase()+r.slice(1)}function mm(r,e,t,n){if(!r||typeof r!="string")return{valid:!1,reason:"Invalid good type"};if(!t||t<=0)return{valid:!1,reason:"Price must be positive"};if(!n||!n.player||!n.ship)return{valid:!1,reason:"Invalid game state"};const i=t*e;if(n.player.credits<i)return{valid:!1,reason:"Insufficient credits for purchase"};const s=n.ship.cargo.reduce((a,l)=>a+l.qty,0);return n.ship.cargoCapacity-s<e?{valid:!1,reason:"Insufficient cargo capacity"}:{valid:!0,reason:""}}function gm(r,e){if(!r||r<=0||!e||!e.player||!e.ship)return 0;const t=Math.floor(e.player.credits/r),n=e.ship.cargo.reduce((s,o)=>s+o.qty,0),i=e.ship.cargoCapacity-n;return Math.min(t,i)}function _o(r,e){if(!r||!r.buyPrice||!e)return{margin:0,percentage:0,direction:"neutral"};const t=e-r.buyPrice,n=(t/r.buyPrice*100).toFixed(1);let i="neutral";return t>0?i="positive":t<0&&(i="negative"),{margin:t,percentage:n,direction:i}}function xo(r,e){if(e===void 0||r===void 0)return"";const t=r-e;return t===0?"today":t===1?"1 day ago":`${t} days ago`}function _m({onClose:r}){const e=mi(),t=xt("cargoChanged"),n=xt("creditsChanged"),{buyGood:i,sellGood:s,moveToHiddenCargo:o,moveToRegularCargo:a}=rl(),l=e.getState(),c=l.player.currentSystem,u=e.starData.find(D=>D.id===c);if(!u)throw new Error(`Invalid game state: current system ID ${c} not found in star data`);const h=t.reduce((D,Y)=>D+Y.qty,0),d=l.ship.cargoCapacity,m=d-h,g=l.ship.upgrades&&l.ship.upgrades.includes("smuggler_panels"),p=l.ship.hiddenCargo||[],f=p.reduce((D,Y)=>D+Y.qty,0),v=l.ship.hiddenCargoCapacity||ve.UPGRADES.smuggler_panels.effects.hiddenCargoCapacity,[M,_]=vt.useState(!1),E=l.player.daysElapsed,w=l.world.activeEvents||[],L=l.world.marketConditions||{},U=(D,Y,I)=>{const P=i(D,Y,I);if(!P.success)throw new Error(`Purchase failed: ${P.reason}`)},y=(D,Y,I)=>{const P=s(D,Y,I);if(!P.success)throw new Error(`Sale failed: ${P.reason}`)},T=(D,Y)=>{const I=o(D,Y);if(!I.success)throw new Error(`Transfer failed: ${I.reason}`)},F=(D,Y)=>{const I=a(D,Y);if(!I.success)throw new Error(`Transfer failed: ${I.reason}`)};return A.jsxs("div",{id:"trade-panel",className:"visible",children:[A.jsx("button",{className:"close-btn",onClick:r,children:"×"}),A.jsxs("h2",{children:["Trade - ",A.jsx("span",{id:"trade-system-name",children:u.name})]}),A.jsxs("div",{className:"trade-content",children:[A.jsxs("div",{className:"trade-section",children:[A.jsx("h3",{children:"Market Goods"}),A.jsx("div",{id:"market-goods",className:"goods-list",children:Vt.map(D=>{const Y=Ye.calculatePrice(D,u,E,w,L),I=gm(Y,l),P=mm(D,1,Y,l);return A.jsxs("div",{className:"good-item",children:[A.jsxs("div",{className:"good-info",children:[A.jsx("div",{className:"good-name",children:_s(D)}),A.jsxs("div",{className:"good-price",children:[Y," cr/unit"]})]}),A.jsxs("div",{className:"good-actions",children:[A.jsx("button",{className:"buy-btn",disabled:n<Y||m<1,onClick:()=>U(D,1,Y),children:"Buy 1"}),A.jsxs("button",{className:"buy-btn",disabled:n<Y*Bi.QUICK_BUY_QUANTITY||m<Bi.QUICK_BUY_QUANTITY,onClick:()=>U(D,Bi.QUICK_BUY_QUANTITY,Y),children:["Buy ",Bi.QUICK_BUY_QUANTITY]}),A.jsx("button",{className:"buy-btn",disabled:I<1,onClick:()=>U(D,I,Y),children:"Buy Max"})]}),A.jsx("div",{className:`validation-message ${P.valid?"":"error"}`,children:!P.valid&&P.reason})]},D)})})]}),A.jsxs("div",{className:"trade-section",children:[A.jsx("h3",{children:"Your Cargo"}),A.jsxs("div",{className:"cargo-capacity-display",children:[A.jsx("span",{className:"capacity-label",children:"Capacity:"}),A.jsx("span",{id:"trade-cargo-used",children:h})," /",A.jsx("span",{id:"trade-cargo-capacity",children:d}),A.jsxs("span",{className:"capacity-remaining",children:["(",A.jsx("span",{id:"trade-cargo-remaining",children:m})," ","remaining)"]})]}),A.jsx("div",{id:"cargo-stacks",className:"cargo-list",children:t.length===0?A.jsx("div",{className:"cargo-empty",children:"No cargo"}):t.map((D,Y)=>{const I=Ye.calculatePrice(D.good,u,E,w,L),P=_o(D,I);let V=`Qty: ${D.qty} | Bought at: ${D.buyPrice} cr/unit`;if(D.buySystem!==void 0&&D.buyDate!==void 0){const Q=e.starData.find(K=>K.id===D.buySystem);if(!Q)throw new Error(`Invalid cargo stack: purchase system ID ${D.buySystem} not found in star data`);const q=xo(E,D.buyDate);V+=` in ${Q.name} (${q})`}let $="";return P.direction==="positive"?$=`Sell at: ${I} cr/unit | Profit: +${P.margin} cr/unit (+${P.percentage}%)`:P.direction==="negative"?$=`Sell at: ${I} cr/unit | Loss: ${P.margin} cr/unit (${P.percentage}%)`:$=`Sell at: ${I} cr/unit | Break even`,A.jsxs("div",{className:"cargo-stack",children:[A.jsxs("div",{className:"stack-info",children:[A.jsx("div",{className:"stack-name",children:_s(D.good)}),A.jsx("div",{className:"stack-details",children:V}),A.jsx("div",{className:`stack-profit ${P.direction}`,children:$})]}),A.jsxs("div",{className:"stack-actions",children:[A.jsx("button",{className:"sell-btn",disabled:D.qty<1,onClick:()=>y(Y,1,I),children:"Sell 1"}),A.jsxs("button",{className:"sell-btn",onClick:()=>y(Y,D.qty,I),children:["Sell All (",D.qty,")"]}),g&&A.jsx("button",{className:"transfer-btn",onClick:()=>T(D.good,D.qty),children:"Move to Hidden"})]})]},Y)})})]}),g&&A.jsxs("div",{id:"hidden-cargo-section",className:"trade-section hidden-cargo-section",children:[A.jsxs("div",{className:"hidden-cargo-header",children:[A.jsx("h3",{children:"Hidden Cargo"}),A.jsx("button",{id:"toggle-hidden-cargo-btn",className:"toggle-hidden-cargo-btn",onClick:()=>_(!M),children:M?"Show":"Hide"})]}),A.jsxs("div",{id:"hidden-cargo-content",className:`hidden-cargo-content ${M?"collapsed":""}`,children:[A.jsxs("div",{className:"cargo-capacity-display",children:[A.jsx("span",{className:"capacity-label",children:"Hidden Capacity:"}),A.jsx("span",{id:"hidden-cargo-used",children:f})," /",A.jsx("span",{id:"hidden-cargo-capacity",children:v}),A.jsx("span",{className:"capacity-units",children:"units"})]}),A.jsx("div",{id:"hidden-cargo-stacks",className:"cargo-list",children:p.length===0?A.jsx("div",{className:"cargo-empty",children:"No hidden cargo"}):p.map((D,Y)=>{const I=Ye.calculatePrice(D.good,u,E,w,L),P=_o(D,I);let V=`Qty: ${D.qty} | Bought at: ${D.buyPrice} cr/unit`;if(D.buySystem!==void 0&&D.buyDate!==void 0){const Q=e.starData.find(K=>K.id===D.buySystem);if(!Q)throw new Error(`Invalid hidden cargo stack: purchase system ID ${D.buySystem} not found in star data`);const q=xo(E,D.buyDate);V+=` in ${Q.name} (${q})`}let $="";return P.direction==="positive"?$=`Sell at: ${I} cr/unit | Profit: +${P.margin} cr/unit (+${P.percentage}%)`:P.direction==="negative"?$=`Sell at: ${I} cr/unit | Loss: ${P.margin} cr/unit (${P.percentage}%)`:$=`Sell at: ${I} cr/unit | Break even`,A.jsxs("div",{className:"cargo-stack",children:[A.jsxs("div",{className:"stack-info",children:[A.jsx("div",{className:"stack-name",children:_s(D.good)}),A.jsx("div",{className:"stack-details",children:V}),A.jsx("div",{className:`stack-profit ${P.direction}`,children:$})]}),A.jsx("div",{className:"stack-actions",children:A.jsx("button",{className:"transfer-btn",onClick:()=>F(D.good,D.qty),children:"Move to Regular"})})]},Y)})})]})]})]})]})}function xm(r,e){return r*e}function vm(r,e){return e<=0?0:Math.floor(r/e)}function ym(r,e=ve.CONDITION_BOUNDS.MAX){return Math.floor(e-r)}function Sm(r,e,t,n=ve.CONDITION_BOUNDS.MAX){const i=vm(e,t),s=ym(r,n);return Math.max(0,Math.min(i,s))}function Mm({onClose:r}){const[e,t]=vt.useState(0),n=mi(),i=xt("fuelChanged"),s=xt("creditsChanged"),{refuel:o}=rl(),l=n.getState().player.currentSystem,c=n.getFuelPrice(l),u=xm(e,c),h=Sm(i,s,c),d=n.validateRefuel(i,e,s,c);vt.useEffect(()=>{const M=Math.min(10,h);t(M>0?M:0)},[]);const m=M=>{t(Number(M.target.value))},g=()=>{t(h)},p=()=>{d.valid&&e>0&&(o(e),t(0))};let f="",v="validation-message";return e<=0?(f="Enter an amount to refuel",v="validation-message info"):d.valid||(f=d.reason,v="validation-message error"),A.jsxs("div",{className:"refuel-panel panel",children:[A.jsxs("div",{className:"panel-header",children:[A.jsx("h2",{children:"Refuel"}),A.jsx("button",{className:"close-btn",onClick:r,children:"×"})]}),A.jsxs("div",{className:"panel-content",children:[A.jsxs("div",{className:"refuel-info",children:[A.jsxs("div",{className:"info-row",children:[A.jsx("span",{className:"label",children:"Current Fuel:"}),A.jsxs("span",{className:"value",children:[Math.round(i),"%"]})]}),A.jsxs("div",{className:"info-row",children:[A.jsx("span",{className:"label",children:"Price per %:"}),A.jsxs("span",{className:"value",children:[c," cr"]})]})]}),A.jsxs("div",{className:"refuel-controls",children:[A.jsxs("div",{className:"slider-container",children:[A.jsx("label",{htmlFor:"refuel-amount",children:"Amount to refuel:"}),A.jsxs("div",{className:"slider-with-max",children:[A.jsx("input",{id:"refuel-amount",type:"range",min:"0",max:h,value:e,onChange:m,className:"refuel-slider"}),A.jsx("button",{type:"button",className:"max-btn",onClick:g,children:"Max"})]}),A.jsxs("div",{className:"slider-value",children:[e,"%"]})]}),A.jsxs("div",{className:"cost-display",children:[A.jsx("span",{className:"label",children:"Total Cost:"}),A.jsxs("span",{className:"value",children:[u," cr"]})]}),f&&A.jsx("div",{className:v,children:f})]}),A.jsxs("div",{className:"panel-actions",children:[A.jsx("button",{className:"btn-primary",onClick:p,disabled:!d.valid||e<=0,children:"Confirm Refuel"}),A.jsx("button",{className:"btn-secondary",onClick:r,children:"Cancel"})]})]})]})}function bm({activePanel:r,onClose:e}){const t=()=>{switch(r){case"trade":return A.jsx(_m,{onClose:e});case"refuel":return A.jsx(Mm,{onClose:e});case"repair":return A.jsxs("div",{className:"panel-placeholder",children:[A.jsx("h2",{children:"Repair Panel"}),A.jsx("p",{children:"RepairPanel will be implemented in task 12"})]});case"upgrades":return A.jsxs("div",{className:"panel-placeholder",children:[A.jsx("h2",{children:"Upgrades Panel"}),A.jsx("p",{children:"UpgradesPanel will be implemented in task 13"})]});case"info-broker":return A.jsxs("div",{className:"panel-placeholder",children:[A.jsx("h2",{children:"Info Broker Panel"}),A.jsx("p",{children:"InfoBrokerPanel will be implemented in task 14"})]});case"cargo-manifest":return A.jsxs("div",{className:"panel-placeholder",children:[A.jsx("h2",{children:"Cargo Manifest Panel"}),A.jsx("p",{children:"CargoManifestPanel will be implemented in task 15"})]});case"ship-status":return A.jsxs("div",{className:"panel-placeholder",children:[A.jsx("h2",{children:"Ship Status Panel"}),A.jsx("p",{children:"ShipStatusPanel will be implemented in task 16"})]});default:return null}};return A.jsx("div",{className:"panel-container",children:t()})}const En={ORBIT:"ORBIT",STATION:"STATION",PANEL:"PANEL"};function wm(){const[r,e]=vt.useState(En.ORBIT),[t,n]=vt.useState(null),i=()=>{e(En.STATION)},s=()=>{e(En.ORBIT),n(null)},o=l=>{n(l),e(En.PANEL)},a=()=>{e(En.STATION),n(null)};return A.jsx(Ws,{children:A.jsxs("div",{className:"app-container",children:[A.jsx(Ws,{children:A.jsx(sm,{})}),A.jsx(fm,{onDock:i}),r===En.STATION&&A.jsx(pm,{onOpenPanel:o,onUndock:s}),r===En.PANEL&&A.jsx(bm,{activePanel:t,onClose:a})]})})}const vo=[[0,1],[0,4],[0,7],[0,9],[0,11],[0,12],[0,16],[0,19],[1,13],[4,23],[4,73],[5,6],[5,7],[5,27],[5,65],[7,34],[7,36],[9,13],[9,14],[9,31],[9,33],[11,1],[11,39],[11,45],[13,35],[14,48],[15,1],[15,42],[15,46],[16,57],[21,25],[21,58],[23,53],[23,91],[25,40],[25,72],[27,34],[27,65],[28,37],[28,54],[28,66],[31,13],[31,56],[32,36],[32,64],[32,67],[35,92],[37,68],[37,103],[40,81],[46,52],[46,82],[49,56],[50,35],[51,1],[51,55],[52,76],[53,63],[55,105],[57,78],[61,85],[61,87],[63,1],[68,109],[69,90],[73,75],[80,89],[83,94],[84,88],[98,99]];function Em(){const r=new Cs(Ni,vo),e=new Il(Ni,vo,r);let t=null;try{t=Eo(!1)}catch(n){console.error("Failed to load saved game:",n)}return t?(e.state=t,console.log("Game loaded from save")):(e.initNewGame(),console.log("New game initialized")),e}function Tm(r){console.error("Failed to initialize game:",r),gr.createRoot(document.getElementById("root")).render(A.jsxs("div",{style:{padding:"40px",fontFamily:"sans-serif",maxWidth:"600px",margin:"0 auto"},children:[A.jsx("h1",{children:"Failed to Load Game"}),A.jsx("p",{children:"The game failed to initialize. This could be due to corrupted save data or a browser compatibility issue."}),A.jsx("p",{style:{color:"#c00",fontFamily:"monospace",fontSize:"14px"},children:r.message}),A.jsx("button",{onClick:()=>{confirm("This will delete your saved game and start fresh. Continue?")&&(localStorage.clear(),window.location.reload())},style:{padding:"10px 20px",fontSize:"16px",cursor:"pointer",marginRight:"10px"},children:"Clear Save and Restart"}),A.jsx("button",{onClick:()=>window.location.reload(),style:{padding:"10px 20px",fontSize:"16px",cursor:"pointer"},children:"Retry"})]}))}let sl;try{sl=Em()}catch(r){throw Tm(r),r}gr.createRoot(document.getElementById("root")).render(A.jsx(yo.StrictMode,{children:A.jsx(am,{gameStateManager:sl,children:A.jsx(wm,{})})}));
//# sourceMappingURL=index-Js6xd9PW.js.map
