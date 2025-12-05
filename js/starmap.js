// Import Three.js and OrbitControls as ES modules
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameStateManager } from './game-state.js';
import { UIManager } from './game-ui.js';
import { SPECTRAL_COLORS } from './game-constants.js';

// Make THREE available globally for debugging
window.THREE = THREE;

// Star System Data
const STAR_DATA = [
    { "id": 0, "x": 0, "y": 0, "z": 0, "name": "Sol", "type": "G2", "wh": 8, "st": 6, "r": 1 },
    { "id": 1, "x": -23.1, "y": -19.18, "z": -53.76, "name": "Alpha Centauri A", "type": "G2", "wh": 6, "st": 9, "r": 1 },
    { "id": 2, "x": -23.1, "y": -19.18, "z": -53.76, "name": "Alpha Centauri B", "type": "K0", "wh": 0, "st": 0, "r": 0 },
    { "id": 3, "x": -21.56, "y": -16.38, "z": -52.5, "name": "Proxima Centauri C", "type": "M5.5", "wh": 0, "st": 0, "r": 0 },
    { "id": 4, "x": -0.98, "y": -82.88, "z": 6.86, "name": "Barnard's Star", "type": "M5", "wh": 3, "st": 1, "r": 1 },
    { "id": 5, "x": -104.16, "y": 29.82, "z": 13.3, "name": "Wolf 359", "type": "M6", "wh": 4, "st": 6, "r": 1 },
    { "id": 6, "x": -91.28, "y": 23.1, "z": 68.32, "name": "Lalande 21185", "type": "M2", "wh": 1, "st": 8, "r": 1 },
    { "id": 7, "x": -22.54, "y": 113.12, "z": -34.58, "name": "Sirius A", "type": "A1", "wh": 4, "st": 3, "r": 1 },
    { "id": 8, "x": -22.54, "y": 113.12, "z": -34.58, "name": "Sirius B", "type": "DA2", "wh": 0, "st": 0, "r": 0 },
    { "id": 9, "x": 105.56, "y": 48.72, "z": -37.66, "name": "L 726-8 A", "type": "M5.5", "wh": 5, "st": 2, "r": 1 },
    { "id": 10, "x": 105.56, "y": 48.72, "z": -37.66, "name": "L 726-8 B", "type": "M5.5", "wh": 0, "st": 0, "r": 0 },
    { "id": 11, "x": 26.46, "y": -121.24, "z": -54.88, "name": "Ross 154", "type": "M4.5", "wh": 4, "st": 4, "r": 1 },
    { "id": 12, "x": 103.32, "y": -8.54, "z": 100.8, "name": "Ross 248", "type": "M6", "wh": 1, "st": 2, "r": 1 },
    { "id": 13, "x": 87.22, "y": 115.92, "z": -24.22, "name": "Epsilon Eridani", "type": "K2", "wh": 4, "st": 5, "r": 1 },
    { "id": 14, "x": 118.3, "y": -28.84, "z": -87.92, "name": "Lacaille 9352", "type": "M2", "wh": 2, "st": 5, "r": 1 },
    { "id": 15, "x": -152.18, "y": 8.54, "z": 2.1, "name": "Ross 128", "type": "M4.5", "wh": 3, "st": 9, "r": 1 },
    { "id": 16, "x": 140.14, "y": -52.36, "z": -40.88, "name": "L 789-6 A", "type": "M5.5", "wh": 2, "st": 4, "r": 1 },
    { "id": 17, "x": 140.14, "y": -52.36, "z": -40.88, "name": "L 789-6 B", "type": "M5", "wh": 0, "st": 0, "r": 0 },
    { "id": 18, "x": 140.14, "y": -52.36, "z": -40.88, "name": "L 789-6 C", "type": "M7", "wh": 0, "st": 0, "r": 0 },
    { "id": 19, "x": -66.64, "y": 144.48, "z": 14.56, "name": "Procyon A", "type": "F5", "wh": 1, "st": 7, "r": 1 },
    { "id": 20, "x": -66.64, "y": 144.48, "z": 14.56, "name": "Procyon B", "type": "DA", "wh": 0, "st": 0, "r": 0 },
    { "id": 21, "x": 90.44, "y": -85.68, "z": 99.96, "name": "61 Cygni A", "type": "K5", "wh": 2, "st": 5, "r": 0 },
    { "id": 22, "x": 90.44, "y": -85.68, "z": 99.96, "name": "61 Cygni B", "type": "K7", "wh": 0, "st": 0, "r": 0 },
    { "id": 23, "x": 14.98, "y": -80.78, "z": 140.14, "name": "Struve 2398 A", "type": "M4", "wh": 3, "st": 3, "r": 1 },
    { "id": 24, "x": 14.98, "y": -80.78, "z": 140.14, "name": "Struve 2398 B", "type": "M5", "wh": 0, "st": 0, "r": 0 },
    { "id": 25, "x": 116.76, "y": 9.24, "z": 113.26, "name": "Groombridge 34 A", "type": "M2", "wh": 3, "st": 5, "r": 0 },
    { "id": 26, "x": 116.76, "y": 9.24, "z": 113.26, "name": "Groombridge 34 B", "type": "M6", "wh": 0, "st": 0, "r": 0 },
    { "id": 27, "x": -89.6, "y": 117.6, "z": 74.62, "name": "G51-15", "type": "M6.5", "wh": 3, "st": 8, "r": 1 },
    { "id": 28, "x": 79.24, "y": -44.24, "z": -138.6, "name": "Epsilon Indi A", "type": "K4", "wh": 3, "st": 1, "r": 0 },
    { "id": 29, "x": 79.38, "y": -43.96, "z": -138.6, "name": "Epsilon Indi B", "type": "T1", "wh": 0, "st": 0, "r": 0 },
    { "id": 30, "x": 79.38, "y": -43.96, "z": -138.6, "name": "Epsilon Indi C", "type": "T6", "wh": 0, "st": 0, "r": 0 },
    { "id": 31, "x": 143.92, "y": 70.28, "z": -45.78, "name": "Tau Ceti", "type": "G8", "wh": 3, "st": 2, "r": 1 },
    { "id": 32, "x": 70.7, "y": 97.44, "z": -118.44, "name": "L 372-58", "type": "M5.5", "wh": 3, "st": 1, "r": 1 },
    { "id": 33, "x": 154.28, "y": 50.26, "z": -49.56, "name": "L 725-32", "type": "M5", "wh": 1, "st": 4, "r": 1 },
    { "id": 34, "x": -64.12, "y": 160.44, "z": 15.82, "name": "Luyten's Star", "type": "M3.5", "wh": 2, "st": 5, "r": 1 },
    { "id": 35, "x": 122.78, "y": 115.5, "z": 51.24, "name": "SO 0253+1652", "type": "M6.5", "wh": 3, "st": 3, "r": 1 },
    { "id": 36, "x": 26.74, "y": 123.62, "z": -126.56, "name": "Kapteyn's Star", "type": "M1", "wh": 2, "st": 2, "r": 1 },
    { "id": 37, "x": 15.4, "y": -77.42, "z": -161.56, "name": "SCR 1845-6357 A", "type": "M8.5", "wh": 3, "st": 1, "r": 0 },
    { "id": 38, "x": 15.4, "y": -77.42, "z": -161.56, "name": "SCR 1845-6357 B", "type": "T5.5", "wh": 0, "st": 0, "r": 0 },
    { "id": 39, "x": 106.26, "y": -91.56, "z": -113.12, "name": "Lacaille 8760", "type": "M0", "wh": 1, "st": 4, "r": 1 },
    { "id": 40, "x": 90.02, "y": -38.22, "z": 154.7, "name": "Kruger 60 A", "type": "M3", "wh": 2, "st": 9, "r": 0 },
    { "id": 41, "x": 90.02, "y": -38.22, "z": 154.7, "name": "Kruger 60 B", "type": "M6", "wh": 0, "st": 0, "r": 0 },
    { "id": 42, "x": -134.4, "y": 43.68, "z": -118.3, "name": "DENIS 1048-39", "type": "M9", "wh": 1, "st": 13, "r": 1 },
    { "id": 43, "x": -23.8, "y": 186.34, "z": -9.24, "name": "Ross 614 A", "type": "M4.5", "wh": 0, "st": 9, "r": 0 },
    { "id": 44, "x": -23.8, "y": 186.34, "z": -9.24, "name": "Ross 614 B", "type": "M7", "wh": 0, "st": 0, "r": 0 },
    { "id": 45, "x": -72.66, "y": -175.56, "z": -42.7, "name": "Wolf 1061", "type": "M3.5", "wh": 1, "st": 5, "r": 1 },
    { "id": 46, "x": -192.22, "y": -27.86, "z": 30.8, "name": "Wolf 424 A", "type": "M5.5", "wh": 3, "st": 9, "r": 1 },
    { "id": 47, "x": -192.22, "y": -27.86, "z": 30.8, "name": "Wolf 424 B", "type": "M7", "wh": 0, "st": 0, "r": 0 },
    { "id": 48, "x": 158.2, "y": 3.5, "z": -120.82, "name": "CD-37 15492", "type": "M4", "wh": 1, "st": 4, "r": 1 },
    { "id": 49, "x": 195.72, "y": 42.56, "z": 18.9, "name": "van Maanen's Star", "type": "DZ7", "wh": 1, "st": 4, "r": 1 },
    { "id": 50, "x": 172.06, "y": 99.4, "z": 46.06, "name": "L 1159-16", "type": "M8", "wh": 1, "st": 8, "r": 1 },
    { "id": 51, "x": -93.1, "y": 32.06, "z": -179.06, "name": "L 143-23", "type": "M5.5", "wh": 2, "st": 10, "r": 1 },
    { "id": 52, "x": -192.64, "y": 62.58, "z": -40.6, "name": "LP 731-58", "type": "M6.5", "wh": 2, "st": 14, "r": 1 },
    { "id": 53, "x": -7.98, "y": -75.88, "z": 192.22, "name": "BD+68 946", "type": "M3.5", "wh": 2, "st": 8, "r": 1 },
    { "id": 54, "x": -19.6, "y": -140.14, "z": -151.34, "name": "CD-46 11540", "type": "M3", "wh": 1, "st": 6, "r": 0 },
    { "id": 55, "x": -89.6, "y": 5.88, "z": -190.96, "name": "L 145-141", "type": "DQ6", "wh": 2, "st": 10, "r": 1 },
    { "id": 56, "x": 212.66, "y": 5.74, "z": -28.14, "name": "G158-27", "type": "M5.5", "wh": 2, "st": 6, "r": 1 },
    { "id": 57, "x": 199.36, "y": -59.92, "z": -52.92, "name": "Ross 780", "type": "M5", "wh": 2, "st": 6, "r": 1 },
    { "id": 58, "x": 72.94, "y": -135.52, "z": 150.78, "name": "G208-44 A", "type": "M5.5", "wh": 1, "st": 7, "r": 0 },
    { "id": 59, "x": 72.94, "y": -135.52, "z": 150.78, "name": "G208-44 B", "type": "M6", "wh": 0, "st": 0, "r": 0 },
    { "id": 60, "x": 72.94, "y": -135.52, "z": 150.78, "name": "G208-44 C", "type": "M8", "wh": 0, "st": 0, "r": 0 },
    { "id": 61, "x": -155.4, "y": 37.94, "z": 152.04, "name": "Lalande 21258 A", "type": "M2", "wh": 2, "st": 9, "r": 0 },
    { "id": 62, "x": -155.4, "y": 37.94, "z": 151.9, "name": "Lalande 21258 B", "type": "M6", "wh": 0, "st": 0, "r": 0 },
    { "id": 63, "x": -128.66, "y": 66.22, "z": 168.98, "name": "Groombridge 1618", "type": "K7", "wh": 2, "st": 9, "r": 1 },
    { "id": 64, "x": 110.32, "y": 105.56, "z": -163.8, "name": "DENIS 0255-47", "type": "L8", "wh": 1, "st": 3, "r": 1 },
    { "id": 65, "x": -190.54, "y": 89.74, "z": 76.16, "name": "BD+20 2465", "type": "M4.5", "wh": 2, "st": 10, "r": 1 },
    { "id": 66, "x": 118.44, "y": -88.34, "z": -170.1, "name": "L 354-89", "type": "M1", "wh": 1, "st": 7, "r": 0 },
    { "id": 67, "x": 106.54, "y": 150.92, "z": -131.46, "name": "LP 944-20", "type": "M9", "wh": 1, "st": 4, "r": 1 },
    { "id": 68, "x": -16.52, "y": -163.94, "z": -160.86, "name": "CD-44 11909", "type": "M3.5", "wh": 2, "st": 6, "r": 0 },
    { "id": 69, "x": 100.94, "y": 204.68, "z": -30.66, "name": "Omicron² Eridani A", "type": "K1", "wh": 1, "st": 10, "r": 0 },
    { "id": 70, "x": 100.94, "y": 204.68, "z": -30.66, "name": "Omicron² Eridani B", "type": "DA4", "wh": 0, "st": 0, "r": 0 },
    { "id": 71, "x": 100.94, "y": 204.68, "z": -30.66, "name": "Omicron² Eridani C", "type": "M4.5", "wh": 0, "st": 0, "r": 0 },
    { "id": 72, "x": 156.38, "y": -52.22, "z": 161.14, "name": "BD+43 4305", "type": "M4.5", "wh": 1, "st": 2, "r": 0 },
    { "id": 73, "x": 5.18, "y": -231.98, "z": 10.08, "name": "70 Ophiuchi A", "type": "K0", "wh": 2, "st": 8, "r": 1 },
    { "id": 74, "x": 5.18, "y": -231.98, "z": 10.08, "name": "70 Ophiuchi B", "type": "K5", "wh": 0, "st": 0, "r": 0 },
    { "id": 75, "x": 107.24, "y": -205.66, "z": 36.12, "name": "Altair", "type": "A7", "wh": 1, "st": 9, "r": 1 },
    { "id": 76, "x": -157.5, "y": 160.16, "z": 80.78, "name": "G9-38 A", "type": "M5.5", "wh": 1, "st": 7, "r": 1 },
    { "id": 77, "x": -157.5, "y": 160.16, "z": 80.78, "name": "G9-38 B", "type": "M5.5", "wh": 0, "st": 0, "r": 0 },
    { "id": 78, "x": 232.12, "y": 15.26, "z": -67.34, "name": "L 722-22 A", "type": "M4", "wh": 1, "st": 8, "r": 1 },
    { "id": 79, "x": 232.12, "y": 15.26, "z": -67.34, "name": "L 722-22 B", "type": "M6", "wh": 0, "st": 0, "r": 0 },
    { "id": 80, "x": 0, "y": 244.86, "z": 11.48, "name": "G99-49", "type": "M4", "wh": 1, "st": 3, "r": 0 },
    { "id": 81, "x": -48.3, "y": 2.66, "z": 241.5, "name": "G254-29", "type": "M4", "wh": 1, "st": 6, "r": 0 },
    { "id": 82, "x": -214.9, "y": -106.12, "z": 63.7, "name": "Lalande 25372", "type": "M4", "wh": 1, "st": 10, "r": 1 },
    { "id": 83, "x": 62.16, "y": 240.1, "z": -30.24, "name": "LP 656-38", "type": "M3.5", "wh": 1, "st": 4, "r": 0 },
    { "id": 84, "x": 163.66, "y": -175.28, "z": -73.22, "name": "LP 816-60", "type": "M5", "wh": 1, "st": 6, "r": 0 },
    { "id": 85, "x": 49.14, "y": 120.12, "z": 215.74, "name": "Stein 2051 A", "type": "M4", "wh": 1, "st": 8, "r": 0 },
    { "id": 86, "x": 49.14, "y": 120.12, "z": 215.74, "name": "Stein 2051 B", "type": "DC5", "wh": 0, "st": 0, "r": 0 },
    { "id": 87, "x": -49.28, "y": 204.68, "z": 138.18, "name": "Wolf 294", "type": "M4", "wh": 1, "st": 7, "r": 0 },
    { "id": 88, "x": 33.04, "y": -214.48, "z": 140.84, "name": "2MASS 1835+32", "type": "M8.5", "wh": 1, "st": 11, "r": 0 },
    { "id": 89, "x": 32.62, "y": 257.18, "z": -16.66, "name": "Wolf 1453", "type": "M1.5", "wh": 1, "st": 7, "r": 0 },
    { "id": 90, "x": 114.24, "y": 231.7, "z": -43.54, "name": "2MASS 0415-09", "type": "T8.5", "wh": 1, "st": 10, "r": 0 },
    { "id": 91, "x": 35.84, "y": -84.28, "z": 246.96, "name": "Sigma Draconis", "type": "K0", "wh": 1, "st": 11, "r": 1 },
    { "id": 92, "x": -10.78, "y": 244.44, "z": -98.14, "name": "L 668-21 A", "type": "M1", "wh": 1, "st": 8, "r": 1 },
    { "id": 93, "x": -10.78, "y": 244.44, "z": -98.14, "name": "L 668-21 B", "type": "T6", "wh": 0, "st": 0, "r": 0 },
    { "id": 94, "x": 20.16, "y": 257.32, "z": 57.12, "name": "Ross 47", "type": "M4", "wh": 1, "st": 11, "r": 0 },
    { "id": 95, "x": -8.68, "y": -142.94, "z": -223.3, "name": "L 205-128", "type": "M3.5", "wh": 0, "st": 4, "r": 0 },
    { "id": 96, "x": 87.08, "y": -252.56, "z": 24.22, "name": "Wolf 1055 A", "type": "M3.5", "wh": 0, "st": 5, "r": 0 },
    { "id": 97, "x": 88.06, "y": -252.28, "z": 24.08, "name": "Wolf 1055 B", "type": "M8", "wh": 0, "st": 0, "r": 0 },
    { "id": 98, "x": -136.22, "y": 209.58, "z": -98.7, "name": "L 674-15", "type": "M4", "wh": 1, "st": 8, "r": 0 },
    { "id": 99, "x": -179.76, "y": -175.28, "z": -98.42, "name": "Lalande 27173 A", "type": "K5", "wh": 1, "st": 7, "r": 0 },
    { "id": 100, "x": -179.76, "y": -175.28, "z": -98.42, "name": "Lalande 27173 B", "type": "M1", "wh": 0, "st": 0, "r": 0 },
    { "id": 101, "x": -179.76, "y": -175.28, "z": -98.42, "name": "Lalande 27173 C", "type": "M3", "wh": 0, "st": 0, "r": 0 },
    { "id": 102, "x": -179.9, "y": -175.28, "z": -98.28, "name": "Lalande 27173 D", "type": "T8", "wh": 0, "st": 0, "r": 0 },
    { "id": 103, "x": 64.82, "y": -177.8, "z": -192.92, "name": "L 347-14", "type": "M4.5", "wh": 1, "st": 9, "r": 0 },
    { "id": 104, "x": -118.72, "y": 242.9, "z": 16.8, "name": "Ross 882", "type": "M4.5", "wh": 0, "st": 9, "r": 0 },
    { "id": 105, "x": -122.5, "y": -162.54, "z": -178.78, "name": "CD-40 9712", "type": "M3", "wh": 1, "st": 10, "r": 1 },
    { "id": 106, "x": 141.54, "y": 30.8, "z": 230.16, "name": "Eta Cassiopeiae A", "type": "G0", "wh": 0, "st": 7, "r": 0 },
    { "id": 107, "x": 141.54, "y": 30.8, "z": 230.16, "name": "Eta Cassiopeiae B", "type": "K7", "wh": 0, "st": 0, "r": 0 },
    { "id": 108, "x": 272.02, "y": -13.02, "z": 11.48, "name": "Lalande 46650", "type": "M2", "wh": 0, "st": 9, "r": 0 },
    { "id": 109, "x": -47.6, "y": -239.68, "z": -122.36, "name": "36 Ophiuchi A", "type": "K1", "wh": 1, "st": 7, "r": 0 },
    { "id": 110, "x": -47.6, "y": -239.68, "z": -122.36, "name": "36 Ophiuchi B", "type": "K1", "wh": 0, "st": 0, "r": 0 },
    { "id": 111, "x": -46.48, "y": -239.4, "z": -121.8, "name": "36 Ophiuchi C", "type": "K5", "wh": 0, "st": 0, "r": 0 },
    { "id": 112, "x": 120.82, "y": -187.74, "z": -162.82, "name": "CD-36 13940 A", "type": "K3", "wh": 0, "st": 9, "r": 0 },
    { "id": 113, "x": 120.82, "y": -187.74, "z": -162.82, "name": "CD-36 13940 B", "type": "M3.5", "wh": 0, "st": 0, "r": 0 },
    { "id": 114, "x": 130.48, "y": 154.42, "z": -189, "name": "82 Eridani", "type": "G5", "wh": 0, "st": 6, "r": 0 },
    { "id": 115, "x": 59.78, "y": -95.48, "z": -255.08, "name": "Delta Pavonis", "type": "G5", "wh": 0, "st": 8, "r": 0 },
    { "id": 116, "x": -213.36, "y": -169.82, "z": -60.48, "name": "Wolf 1481", "type": "M3", "wh": 0, "st": 9, "r": 0 }
];

// Wormhole Connection Data
const WORMHOLE_DATA = [
    [0,1],[0,4],[0,7],[0,9],[0,11],[0,12],[0,16],[0,19],
    [1,13],[4,23],[4,73],[5,6],[5,7],[5,27],[5,65],[7,34],
    [7,36],[9,13],[9,14],[9,31],[9,33],[11,1],[11,39],[11,45],
    [13,35],[14,48],[15,1],[15,42],[15,46],[16,57],[21,25],[21,58],
    [23,53],[23,91],[25,40],[25,72],[27,34],[27,65],[28,37],[28,54],
    [28,66],[31,13],[31,56],[32,36],[32,64],[32,67],[35,92],[37,68],
    [37,103],[40,81],[46,52],[46,82],[49,56],[50,35],[51,1],[51,55],
    [52,76],[53,63],[55,105],[57,78],[61,85],[61,87],[63,1],[68,109],
    [69,90],[73,75],[80,89],[83,94],[84,88],[98,99]
];

// Global Three.js objects
let scene, camera, renderer, controls;
let ambientLight, directionalLight;

// Runtime star objects storage
let stars = [];

// Sector boundary
let sectorBoundary = null;

// Starfield background
let starfield = null;

// Wormhole lines storage for potential disposal
const wormholeLines = [];

// Rotation state (default: enabled)
let autoRotationEnabled = true;

// Selection state
let selectedStar = null;
let raycaster = null;
const mouse = { x: 0, y: 0 };

// Visual configuration
const VISUAL_CONFIG = {
    starSize: 20,
    pulseAmplitude: 0.15,
    pulseSpeed: 2.0,
    selectionRingSize: 30,
    selectionRingPulseSpeed: 3.0,
    selectionColor: 0xFFFF00  // Bright yellow
};

// Label configuration
const LABEL_CONFIG = {
    maxFontSize: 18,      // pixels
    minFontSize: 8,       // pixels
    maxOpacity: 1.0,
    minOpacity: 0.1,
    nearDistance: 100,    // full size/opacity
    farDistance: 500      // minimum opacity
};

// Map spectral class to color
function getStarColor(spectralClass) {
    // Extract first character of spectral class (e.g., "G2" -> "G")
    const spectralType = spectralClass.charAt(0).toUpperCase();
    // Return color from mapping, default to white if unknown
    return SPECTRAL_COLORS[spectralType] || 0xFFFFFF;
}

// Create a realistic star texture with radial glow
function createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Create radial gradient for glow effect
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
}

// Create text sprite for star label
function createLabel(text, fontSize = 18) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set font for measuring text
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    
    // Measure text to size canvas appropriately
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.4; // Add some padding
    
    // Set canvas size with padding
    canvas.width = textWidth + 20;
    canvas.height = textHeight + 10;
    
    // Re-set font after canvas resize (canvas resize clears context)
    ctx.font = `${fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw text with glow effect
    ctx.fillStyle = '#00FF88'; // Neon green color
    ctx.shadowColor = '#00FF88';
    ctx.shadowBlur = 10;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create sprite material
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Scale sprite to appropriate size
    const scale = fontSize * 2;
    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
    
    return sprite;
}

// Calculate label properties based on distance from camera
function calculateLabelProperties(distance) {
    // Clamp distance to configured range
    const clampedDistance = Math.max(
        LABEL_CONFIG.nearDistance,
        Math.min(distance, LABEL_CONFIG.farDistance)
    );
    
    // Calculate interpolation factor (0 at near, 1 at far)
    const t = (clampedDistance - LABEL_CONFIG.nearDistance) / 
              (LABEL_CONFIG.farDistance - LABEL_CONFIG.nearDistance);
    
    // Calculate font size (linear interpolation)
    const fontSize = LABEL_CONFIG.maxFontSize - 
                   (LABEL_CONFIG.maxFontSize - LABEL_CONFIG.minFontSize) * t;
    
    // Calculate opacity (linear interpolation)
    const opacity = LABEL_CONFIG.maxOpacity - 
                  (LABEL_CONFIG.maxOpacity - LABEL_CONFIG.minOpacity) * t;
    
    return { fontSize, opacity };
}

// Update label scale and opacity based on camera distance
function updateLabelScale() {
    stars.forEach(star => {
        if (star.label) {
            // Calculate distance from camera to star
            const distance = camera.position.distanceTo(star.position);
            
            // Get label properties for this distance
            const { fontSize, opacity } = calculateLabelProperties(distance);
            
            // Update label opacity
            star.label.material.opacity = opacity;
            
            // Update label scale based on font size
            // The scale factor maintains the aspect ratio
            const scaleFactor = fontSize / LABEL_CONFIG.maxFontSize;
            const baseScale = LABEL_CONFIG.maxFontSize * 2;
            const canvas = star.label.material.map.image;
            const aspectRatio = canvas.width / canvas.height;
            
            star.label.scale.set(
                baseScale * aspectRatio * scaleFactor,
                baseScale * scaleFactor,
                1
            );
        }
    });
}

// Create star systems
function createStarSystems(starData) {
    // Create shared star texture for all stars
    const starTexture = createStarTexture();
    
    starData.forEach(data => {
        // Create sprite material with color based on spectral class
        const color = getStarColor(data.type);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: starTexture,
            color: color,
            transparent: true,
            blending: THREE.AdditiveBlending,  // Additive blending for glow effect
            depthWrite: false,
            sizeAttenuation: true
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(VISUAL_CONFIG.starSize, VISUAL_CONFIG.starSize, 1);
        
        // Position sprite at x, y, z coordinates from data
        sprite.position.set(data.x, data.y, data.z);
        
        // Add sprite to scene
        scene.add(sprite);
        
        // Create label for star system
        const label = createLabel(data.name, LABEL_CONFIG.maxFontSize);
        
        // Position label near the star (offset slightly above)
        label.position.set(data.x, data.y + 15, data.z);
        
        // Add label to scene
        scene.add(label);
        
        // Store runtime star object
        const starObject = {
            data: data,
            sprite: sprite,
            label: label,
            selectionRing: null,  // To be created in selection task
            position: sprite.position,  // Reference sprite's Vector3 instead of creating duplicate
            originalColor: color  // Store original color for selection/deselection
        };
        
        stars.push(starObject);
    });
    
    console.log(`Created ${stars.length} star systems with labels`);
}

// Create a targeting reticle texture with sci-fi HUD aesthetic
function createTargetingReticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    const centerX = 128;
    const centerY = 128;
    const radius = 100;
    
    // Set up glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
    ctx.lineCap = 'round';
    
    // Draw main circle with glow
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw crosshairs (with gaps in the center)
    const crosshairLength = radius * 0.4;
    const crosshairGap = 10;
    
    ctx.lineWidth = 2;
    // Horizontal crosshair
    ctx.beginPath();
    ctx.moveTo(centerX - crosshairLength, centerY);
    ctx.lineTo(centerX - crosshairGap, centerY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX + crosshairGap, centerY);
    ctx.lineTo(centerX + crosshairLength, centerY);
    ctx.stroke();
    
    // Vertical crosshair
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - crosshairLength);
    ctx.lineTo(centerX, centerY - crosshairGap);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + crosshairGap);
    ctx.lineTo(centerX, centerY + crosshairLength);
    ctx.stroke();
    
    // Draw corner brackets (targeting reticle style)
    const bracketSize = 20;
    const bracketOffset = radius + 10;
    ctx.lineWidth = 3;
    
    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(centerX - bracketOffset, centerY - bracketOffset + bracketSize);
    ctx.lineTo(centerX - bracketOffset, centerY - bracketOffset);
    ctx.lineTo(centerX - bracketOffset + bracketSize, centerY - bracketOffset);
    ctx.stroke();
    
    // Top-right bracket
    ctx.beginPath();
    ctx.moveTo(centerX + bracketOffset - bracketSize, centerY - bracketOffset);
    ctx.lineTo(centerX + bracketOffset, centerY - bracketOffset);
    ctx.lineTo(centerX + bracketOffset, centerY - bracketOffset + bracketSize);
    ctx.stroke();
    
    // Bottom-left bracket
    ctx.beginPath();
    ctx.moveTo(centerX - bracketOffset, centerY + bracketOffset - bracketSize);
    ctx.lineTo(centerX - bracketOffset, centerY + bracketOffset);
    ctx.lineTo(centerX - bracketOffset + bracketSize, centerY + bracketOffset);
    ctx.stroke();
    
    // Bottom-right bracket
    ctx.beginPath();
    ctx.moveTo(centerX + bracketOffset - bracketSize, centerY + bracketOffset);
    ctx.lineTo(centerX + bracketOffset, centerY + bracketOffset);
    ctx.lineTo(centerX + bracketOffset, centerY + bracketOffset - bracketSize);
    ctx.stroke();
    
    // Add small tick marks around the outer circle
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI * 2) / 8;
        const x1 = centerX + Math.cos(angle) * (radius + 5);
        const y1 = centerY + Math.sin(angle) * (radius + 5);
        const x2 = centerX + Math.cos(angle) * (radius + 15);
        const y2 = centerY + Math.sin(angle) * (radius + 15);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Add center dot
    ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    return new THREE.CanvasTexture(canvas);
}

// Create selection ring for a star with targeting reticle
function createSelectionRing() {
    // Create a plane geometry for the reticle
    const reticleGeometry = new THREE.PlaneGeometry(
        VISUAL_CONFIG.selectionRingSize * 3,
        VISUAL_CONFIG.selectionRingSize * 3
    );
    
    // Create targeting reticle texture
    const reticleTexture = createTargetingReticleTexture();
    
    // Create material with additive blending for glow effect
    const reticleMaterial = new THREE.MeshBasicMaterial({
        map: reticleTexture,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
    });
    
    // Create mesh
    const reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
    
    return reticle;
}

// Update star pulsing animation
function updateStarPulse(time) {
    stars.forEach(star => {
        // Calculate pulsing scale using sine wave
        const pulseScale = 1.0 + Math.sin(time * VISUAL_CONFIG.pulseSpeed) * VISUAL_CONFIG.pulseAmplitude;
        
        // Apply pulsing to sprite scale
        star.sprite.scale.set(
            VISUAL_CONFIG.starSize * pulseScale,
            VISUAL_CONFIG.starSize * pulseScale,
            1
        );
    });
}

// Update selection ring pulsing animation
function updateSelectionRingPulse(time) {
    if (selectedStar && selectedStar.selectionRing) {
        // Subtle pulsing scale for targeting lock effect
        const pulseScale = 1.0 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed) * 0.08;
        
        // Apply pulsing to reticle scale
        selectedStar.selectionRing.scale.set(pulseScale, pulseScale, 1);
        
        // Pulse the opacity for "scanning" effect
        const pulseOpacity = 0.75 + Math.sin(time * VISUAL_CONFIG.selectionRingPulseSpeed * 1.5) * 0.25;
        selectedStar.selectionRing.material.opacity = pulseOpacity;
        
        // Slow rotation for targeting system effect
        selectedStar.selectionRing.rotation.z = time * 0.2;
    }
}

// Create wormhole connection lines
function createWormholeLines(connections, starObjects) {
    const starMap = new Map();
    starObjects.forEach(star => {
        starMap.set(star.data.id, star);
    });
    
    // Separate positions for reachable and unreachable connections
    const reachablePositions = [];
    const unreachablePositions = [];
    
    let validConnections = 0;
    let invalidConnections = 0;
    
    connections.forEach(connection => {
        if (!Array.isArray(connection) || connection.length !== 2) {
            console.warn('Invalid wormhole connection format:', connection);
            invalidConnections++;
            return;
        }
        
        const [id1, id2] = connection;
        const star1 = starMap.get(id1);
        const star2 = starMap.get(id2);
        
        if (!star1) {
            console.warn(`Wormhole connection references non-existent star ID: ${id1}`);
            invalidConnections++;
            return;
        }
        
        if (!star2) {
            console.warn(`Wormhole connection references non-existent star ID: ${id2}`);
            invalidConnections++;
            return;
        }
        
        // Add positions to appropriate array
        const positions = (star1.data.r === 1 && star2.data.r === 1) 
            ? reachablePositions 
            : unreachablePositions;
        
        positions.push(star1.position.x, star1.position.y, star1.position.z);
        positions.push(star2.position.x, star2.position.y, star2.position.z);
        
        validConnections++;
    });
    
    // Create reachable connections geometry
    if (reachablePositions.length > 0) {
        const reachableGeometry = new THREE.BufferGeometry();
        reachableGeometry.setAttribute('position', 
            new THREE.BufferAttribute(new Float32Array(reachablePositions), 3));
        
        const reachableMaterial = new THREE.LineBasicMaterial({
            color: 0x00CCFF,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });
        
        const reachableLines = new THREE.LineSegments(reachableGeometry, reachableMaterial);
        scene.add(reachableLines);
        wormholeLines.push(reachableLines);
    }
    
    // Create unreachable connections geometry
    if (unreachablePositions.length > 0) {
        const unreachableGeometry = new THREE.BufferGeometry();
        unreachableGeometry.setAttribute('position', 
            new THREE.BufferAttribute(new Float32Array(unreachablePositions), 3));
        
        const unreachableMaterial = new THREE.LineBasicMaterial({
            color: 0x884444,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });
        
        const unreachableLines = new THREE.LineSegments(unreachableGeometry, unreachableMaterial);
        scene.add(unreachableLines);
        wormholeLines.push(unreachableLines);
    }
    
    console.log(`Created ${validConnections} wormhole connections`);
    if (invalidConnections > 0) {
        console.warn(`Skipped ${invalidConnections} invalid wormhole connections`);
    }
}

// Initialize Three.js scene and camera
function initScene() {
    try {
        // Check for WebGL support
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        
        // Exponential fog creates subtle volumetric depth without obscuring nearby stars
        scene.fog = new THREE.FogExp2(0x000000, 0.0003);
        
        camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );
        
        camera.position.set(500, 500, 500);
        camera.lookAt(0, 0, 0);
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        const container = document.getElementById('container');
        container.appendChild(renderer.domElement);
        
        // Ambient + directional lighting provides depth without harsh shadows
        ambientLight = new THREE.AmbientLight(0x404040, 1.5);
        scene.add(ambientLight);
        
        directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);
        
        setupCameraControls();
        
        window.addEventListener('resize', onWindowResize, false);
        
        console.log('Scene initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize Three.js scene:', error);
        const container = document.getElementById('container');
        container.innerHTML = '<div style="color: #FF0000; padding: 20px; text-align: center;">' +
            '<h2>WebGL Error</h2>' +
            '<p>Unable to initialize 3D visualization. Please ensure your browser supports WebGL.</p>' +
            '<p>Error: ' + error.message + '</p>' +
            '</div>';
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Create a soft glowing star texture for background stars
function createBackgroundStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const centerX = 32;
    const centerY = 32;
    
    // Create radial gradient for soft glow
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Create starfield background
function createStarfield() {
    const starfieldGeometry = new THREE.BufferGeometry();
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    // Create stars at random positions in a spherical shell
    const minRadius = 700;
    const maxRadius = 1400;
    
    // Spectral types for random selection
    const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const spectralWeights = [0.02, 0.08, 0.15, 0.20, 0.25, 0.20, 0.10]; // Realistic distribution
    
    for (let i = 0; i < starCount; i++) {
        // Random spherical coordinates
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        
        // Convert to cartesian coordinates
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        
        // Select spectral type based on weighted distribution
        const roll = Math.random();
        let cumulativeWeight = 0;
        let spectralType = 'G'; // Default
        
        for (let j = 0; j < spectralTypes.length; j++) {
            cumulativeWeight += spectralWeights[j];
            if (roll < cumulativeWeight) {
                spectralType = spectralTypes[j];
                break;
            }
        }
        
        // Get color from SPECTRAL_COLORS
        const baseColor = SPECTRAL_COLORS[spectralType];
        const brightness = 0.6 + Math.random() * 0.4; // 60-100% brightness for variety
        
        // Extract RGB from hex color and apply brightness
        const r = ((baseColor >> 16) & 255) / 255 * brightness;
        const g = ((baseColor >> 8) & 255) / 255 * brightness;
        const b = (baseColor & 255) / 255 * brightness;
        
        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;
    }
    
    starfieldGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starfieldGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create texture for stars
    const starTexture = createBackgroundStarTexture();
    
    // Create material for starfield
    const starfieldMaterial = new THREE.PointsMaterial({
        size: 4,
        map: starTexture,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    // Create points mesh
    starfield = new THREE.Points(starfieldGeometry, starfieldMaterial);
    
    // Add to scene
    scene.add(starfield);
    
    console.log(`Created starfield background with ${starCount} stars`);
    console.log('Starfield position:', starfield.position);
    console.log('Starfield visible:', starfield.visible);
}

// Create sector boundary
function setupSectorBoundary() {
    // Create sphere geometry with radius 300
    const sphereGeometry = new THREE.SphereGeometry(300, 32, 32);
    
    // Use EdgesGeometry for clean wireframe lines
    const edgesGeometry = new THREE.EdgesGeometry(sphereGeometry);
    
    // Create line material with brighter color for visibility
    const material = new THREE.LineBasicMaterial({
        color: 0x00FF88,  // Neon green to match theme
        transparent: true,
        opacity: 0.5
    });
    
    // Create line segments from edges geometry
    sectorBoundary = new THREE.LineSegments(edgesGeometry, material);
    
    // Position at origin (0, 0, 0) - centered on Sol
    sectorBoundary.position.set(0, 0, 0);
    
    // Set initial visibility to true
    sectorBoundary.visible = true;
    
    // Add to scene
    scene.add(sectorBoundary);
    
    console.log('Sector boundary created with radius 300');
}

// Toggle sector boundary visibility
function toggleBoundary() {
    if (sectorBoundary) {
        sectorBoundary.visible = !sectorBoundary.visible;
        console.log(`Sector boundary visibility: ${sectorBoundary.visible}`);
    }
}

// Expose to global scope for onclick handlers
window.toggleBoundary = toggleBoundary;

// Set up camera controls with OrbitControls
function setupCameraControls() {
    // Create OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    
    // Configure left mouse button for rotation (orbit)
    controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN
    };
    
    // Enable damping for smooth movement
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Configure control speeds
    controls.rotateSpeed = 1.0;
    controls.panSpeed = 1.0;
    // Configure scroll wheel for dolly (zoom) with sensitivity 150
    // Note: Higher values make zoom more sensitive
    controls.zoomSpeed = 1.5;
    
    // Set min/max distance limits
    controls.minDistance = 50;
    controls.maxDistance = 2000;
    
    // Enable orbit, pan, and dolly
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.enableZoom = true;
    
    // Set the target to Sol (0, 0, 0)
    controls.target.set(0, 0, 0);
    
    // Update controls to apply initial settings
    controls.update();
    
    console.log('Camera controls initialized with OrbitControls');
}

// Zoom In button handler - decreases camera distance
function zoomIn() {
    if (controls) {
        // Reuse temp vector to avoid allocation during user interaction
        _tempZoomDirection.subVectors(controls.target, camera.position).normalize();
        
        // Calculate current distance
        const currentDistance = camera.position.distanceTo(controls.target);
        
        // Calculate zoom amount (10% of current distance, minimum 10 units)
        const zoomAmount = Math.max(currentDistance * 0.1, 10);
        
        // Calculate new position using temp vector to avoid allocation
        _tempZoomPosition.copy(camera.position).add(_tempZoomDirection.multiplyScalar(zoomAmount));
        
        // Check if new distance would be below minimum
        const newDistance = _tempZoomPosition.distanceTo(controls.target);
        if (newDistance > controls.minDistance) {
            camera.position.copy(_tempZoomPosition);
            controls.update();
        }
        
        console.log(`Zoom In - Distance: ${newDistance.toFixed(2)}`);
    }
}

// Zoom Out button handler - increases camera distance
function zoomOut() {
    if (controls) {
        // Reuse temp vector to avoid allocation during user interaction
        _tempZoomDirection.subVectors(camera.position, controls.target).normalize();
        
        // Calculate current distance
        const currentDistance = camera.position.distanceTo(controls.target);
        
        // Calculate zoom amount (10% of current distance, minimum 10 units)
        const zoomAmount = Math.max(currentDistance * 0.1, 10);
        
        // Calculate new position using temp vector to avoid allocation
        _tempZoomPosition.copy(camera.position).add(_tempZoomDirection.multiplyScalar(zoomAmount));
        
        // Check if new distance would be above maximum
        const newDistance = _tempZoomPosition.distanceTo(controls.target);
        if (newDistance < controls.maxDistance) {
            camera.position.copy(_tempZoomPosition);
            controls.update();
        }
        
        console.log(`Zoom Out - Distance: ${newDistance.toFixed(2)}`);
    }
}

function toggleRotation() {
    // Toggle rotation state
    autoRotationEnabled = !autoRotationEnabled;
    
    // Update button visual state
    const rotationBtn = document.getElementById('rotation-btn');
    if (autoRotationEnabled) {
        rotationBtn.classList.add('active');
    } else {
        rotationBtn.classList.remove('active');
    }
    
    console.log(`Auto-rotation ${autoRotationEnabled ? 'enabled' : 'disabled'}`);
}

// Set up raycaster for click detection
function setupRaycaster() {
    raycaster = new THREE.Raycaster();
    
    // Add click event listener to canvas
    renderer.domElement.addEventListener('click', onCanvasClick, false);
    
    console.log('Raycaster initialized for selection');
}

// Handle canvas click events
function onCanvasClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update raycaster with camera and mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Create array of all clickable objects (sprites and labels)
    const clickableObjects = [];
    stars.forEach(star => {
        clickableObjects.push(star.sprite);
        clickableObjects.push(star.label);
    });
    
    // Calculate intersections
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    
    if (intersects.length > 0) {
        // Find which star was clicked
        const clickedObject = intersects[0].object;
        
        // Find the star that owns this sprite or label
        const clickedStar = stars.find(star => 
            star.sprite === clickedObject || star.label === clickedObject
        );
        
        if (clickedStar) {
            selectStar(clickedStar);
        }
    } else {
        // Empty space clicked
        if (selectedStar) {
            // Deselect if a star is currently selected
            deselectStar();
        }
        // If no star is selected, do nothing (no-op)
    }
}

function selectStar(star) {
    if (selectedStar) {
        deselectStar();
    }
    
    selectedStar = star;
    
    console.log(`Selected star: ${star.data.name}`);
    
    star.sprite.material.color.setHex(VISUAL_CONFIG.selectionColor);
    
    if (!star.selectionRing) {
        star.selectionRing = createSelectionRing();
        star.selectionRing.position.copy(star.position);
        star.selectionRing.lookAt(camera.position);
        scene.add(star.selectionRing);
    } else {
        star.selectionRing.visible = true;
    }
    
    updateHUD(star);
    showHUD();
    
    // Check if this is the current system and show station interface
    if (uiManager && gameStateManager) {
        uiManager.handleSystemClick(star.data.id);
    }
}

function deselectStar() {
    if (!selectedStar) {
        return;
    }
    
    console.log(`Deselected star: ${selectedStar.data.name}`);
    
    selectedStar.sprite.material.color.setHex(selectedStar.originalColor);
    
    if (selectedStar.selectionRing) {
        selectedStar.selectionRing.visible = false;
    }
    
    hideHUD();
    selectedStar = null;
}

function updateHUD(star) {
    document.getElementById('hud-name').textContent = star.data.name;
    document.getElementById('hud-coords').textContent = `${star.data.x}, ${star.data.y}, ${star.data.z}`;
    document.getElementById('hud-spectral').textContent = star.data.type;
    document.getElementById('hud-wormholes').textContent = star.data.wh;
    document.getElementById('hud-reachable').textContent = star.data.r === 1 ? 'Reachable' : 'Unreachable';
}

function showHUD() {
    document.getElementById('hud').style.display = 'block';
}

function hideHUD() {
    document.getElementById('hud').style.display = 'none';
}

// Expose functions to global scope for onclick handlers
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.toggleRotation = toggleRotation;
window.deselectStar = deselectStar;

// Global game state manager and UI manager instances
let gameStateManager = null;
let uiManager = null;

// Reusable temp vectors to avoid object allocation in hot paths
// These are reused across function calls to prevent garbage collection pressure
// Pattern: Declare once at module scope, reuse via .set()/.copy() methods
const _tempOffset = new THREE.Vector3();           // For camera rotation calculations
const _tempZoomDirection = new THREE.Vector3();    // For zoom in/out direction vectors
const _tempZoomPosition = new THREE.Vector3();     // For zoom position calculations

// Frame counter for throttling expensive operations
let _frameCount = 0;
const LABEL_UPDATE_INTERVAL = 3; // Update labels every 3 frames (~20fps)

// Update automatic rotation
function updateAutoRotation() {
    if (autoRotationEnabled && controls) {
        // Rotation speed chosen for smooth, noticeable orbit without inducing motion sickness
        const rotationSpeed = 0.2 * (Math.PI / 180);
        
        // Get current camera position relative to target
        _tempOffset.copy(camera.position).sub(controls.target);
        
        // Apply rotation around Y-axis (vertical axis)
        const cosAngle = Math.cos(rotationSpeed);
        const sinAngle = Math.sin(rotationSpeed);
        
        const newX = _tempOffset.x * cosAngle - _tempOffset.z * sinAngle;
        const newZ = _tempOffset.x * sinAngle + _tempOffset.z * cosAngle;
        
        _tempOffset.x = newX;
        _tempOffset.z = newZ;
        
        // Update camera position
        camera.position.copy(controls.target).add(_tempOffset);
    }
}

// Update starfield rotation to match sphere
function updateStarfieldRotation() {
    if (starfield && sectorBoundary) {
        // Match starfield rotation to sector boundary rotation
        starfield.rotation.copy(sectorBoundary.rotation);
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    _frameCount++;
    
    updateAutoRotation();
    
    if (controls) {
        controls.update();
    }
    
    updateStarPulse(time);
    updateSelectionRingPulse(time);
    
    if (selectedStar && selectedStar.selectionRing) {
        selectedStar.selectionRing.lookAt(camera.position);
    }
    
    // Throttle label updates to reduce distanceTo() calls
    if (_frameCount % LABEL_UPDATE_INTERVAL === 0) {
        updateLabelScale();
    }
    
    updateStarfieldRotation();
    
    renderer.render(scene, camera);
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    initScene();
    
    // Create star systems after scene is initialized
    if (scene) {
        // Create starfield background first (renders behind everything)
        createStarfield();
        
        createStarSystems(STAR_DATA);
        
        // Create wormhole connections after stars are created
        createWormholeLines(WORMHOLE_DATA, stars);
        
        // Create sector boundary
        setupSectorBoundary();
        
        // Set up raycaster for selection
        setupRaycaster();
        
        // Initialize game state manager
        gameStateManager = new GameStateManager(STAR_DATA, WORMHOLE_DATA);
        
        // Initialize UI manager
        uiManager = new UIManager(gameStateManager);
        
        // Initialize new game
        gameStateManager.initNewGame();
        
        // Show the game HUD
        uiManager.showHUD();
        
        // Make game state manager and UI manager available globally for debugging
        window.gameStateManager = gameStateManager;
        window.uiManager = uiManager;
        
        console.log('Game state manager and UI manager initialized');
        
        // Select Sol on initialization (id: 0)
        const sol = stars.find(star => star.data.id === 0);
        if (sol) {
            selectStar(sol);
            console.log('Sol pre-selected on initialization');
        } else {
            console.warn('Sol (id: 0) not found in star data');
        }
        
        // Start animation loop
        animate();
    } else {
        console.error('Failed to initialize scene');
    }
});
