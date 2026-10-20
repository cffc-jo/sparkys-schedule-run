// Official Chicago Fire FC palette. Every non-logo pixel in the game uses one of these.
// CSS custom properties (--c-*) are generated from this object at boot, so this is the single source.
export const PALETTE = Object.freeze({
  FIRE_RED:  '#FF0000', // highlights, "+10" pops, buttons, Sparky accents
  RED:       '#AA0000', // primary red fills, HOME box border
  DEEP_RED:  '#760000', // red shading
  DARK_RED:  '#450000', // darkest red shading and outlines
  NAVY:      '#171A45', // primary background and UI panels
  DEEP_NAVY: '#160C26', // background shading, far skyline layer
  DARK_NAVY: '#160008', // darkest outlines and text shadows
  WHITE:     '#FFFFFF', // text, ball, stars
  FLAG_BLUE: '#7DCCF0', // sky accents, AWAY box border, invincibility glow
  BLUE:      '#52B3E3', // secondary UI and the timer
  DEEP_BLUE: '#3A95CE', // blue shading, mid skyline layer
  DARK_BLUE: '#1D80D5', // darkest blue shading
});

// Scenery colours (daytime sky, skyline, grass). NOT brand colours: approved for background
// art only. Characters, UI, text and boxes stay on the brand palette above.
export const SCENERY = Object.freeze({
  SKY_TOP:       '#4FA8E8',
  SKY_MID:       '#7DCCF0', // = Flag Blue
  SKY_LOW:       '#B9E3F6',
  CLOUD:         '#FFFFFF',
  CLOUD_SHADE:   '#D3ECF8',
  SUN:           '#FFE27A',
  SUN_EDGE:      '#FFC94A',
  CITY_FAR:      '#A6C8DE',
  CITY_FAR_WIN:  '#C8E2F0',
  CITY_NEAR:     '#6A8AAB',
  CITY_NEAR_WIN: '#A3C3DD',
  CITY_DARK:     '#4C6684',
  GRASS_TIP:     '#9BDB5A',
  GRASS_A:       '#5CB63B',
  GRASS_B:       '#4EA431',
  GRASS_DARK:    '#3D8A27',
  GRASS_DEEP:    '#2F6E1F',
});
