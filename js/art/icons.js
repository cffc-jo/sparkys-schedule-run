// Small pixel icons for the instructions key (rendered to data URLs for <img> tags).
import { gridToCanvas } from './pixelArt.js';

const ICONS = {
  ball: [
    '....KKKKKK......',
    '..KKWWWWWWKK....',
    '.KWWWWKKWWWWK...',
    '.KWWWKKKKWWWK...',
    'KWKWWKKKKWWKWK..',
    'KWKKWWKKWWKKWK..',
    'KWKKWWWWWWKKWK..',
    'KWWWWWWWWWWWWK..',
    'KWWKKWWWWKKWWK..',
    '.KWKKKWWKKKWK...',
    '.KWWKWWWWKWWK...',
    '..KKWWWWWWKK....',
    '....KKKKKK......',
    '................',
    '................',
    '................',
  ],
  hit: [
    '..........FF....',
    '.........FFFF...',
    'KKKKKKKKKKFFKK..',
    'KRRRRRRRRRFFRK..',
    'KRKKKKKKKKKKRK..',
    'KRKWWWWWWWWKRK..',
    'KRKWBBBBBBWKRK..',
    'KRKWBWWWWBWKRK..',
    'KRKWBWWWWBWKRK..',
    'KRKWBBBBBBWKRK..',
    'KRKWWWWWWWWKRK..',
    'KRKKKKKKKKKKRK..',
    'KRRRRRRRRRRRRK..',
    'KKKKKKKKKKKKKK..',
    '................',
    '................',
  ],
  clear: [
    '................',
    '..BB............',
    '..BBBB..........',
    '..BBBBBB........',
    '..BBBBBBBB......',
    '..BBBBBBBBBB....',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBBBB..',
    '..BBBBBBBBBB....',
    '..BBBBBBBB......',
    '..BBBBBB........',
    '..BBBB..........',
    '..BB............',
    '................',
    '................',
    '................',
  ],
};

const urlCache = {};

export function iconCanvas(name) {
  return gridToCanvas(ICONS[name]);
}

export function iconDataURL(name) {
  if (!urlCache[name]) urlCache[name] = iconCanvas(name).toDataURL('image/png');
  return urlCache[name];
}
