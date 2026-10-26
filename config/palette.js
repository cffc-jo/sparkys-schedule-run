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

// Scenery colours (sky, clouds, skyline, grass). NOT brand colours: approved for background
// art only. Characters, UI, text and boxes stay on the brand palette above.
// The background follows the season of each match Sparky passes (see js/season.js).
const CITY = {
  CITY_FAR:      '#A6C8DE',
  CITY_FAR_WIN:  '#C8E2F0',
  CITY_NEAR:     '#6A8AAB',
  CITY_NEAR_WIN: '#A3C3DD',
  CITY_DARK:     '#4C6684',
  // Landmarks
  WRIGLEY:       '#F4F0E6', // white glazed terra cotta
  WRIGLEY_SHADE: '#D6CEBE',
  WRIGLEY_WIN:   '#93A9BF',
  CLOCK_HANDS:   '#2B2B33',
  STADIUM_BRICK: '#9A4A35', // McDonald's Park: long red-brick facade...
  STADIUM_BRICK_DARK: '#76362A',
  STADIUM_GLASS: '#38404E', // ...big dark-glass window bays...
  STADIUM_FRAME: '#C9CED6', // ...with light frames / mullions...
  STADIUM_ROOF: '#2B2D34',  // ...under a flat, dark, overhanging roof
  STADIUM_ROOF_EDGE: '#5A5E69',
};

export const SEASONS = Object.freeze({
  summer: Object.freeze({
    ...CITY,
    SKY_TOP: '#4FA8E8', SKY_MID: '#7DCCF0', SKY_LOW: '#B9E3F6',
    CLOUD: '#FFFFFF', CLOUD_SHADE: '#D3ECF8',
    SUN: '#FFE27A', SUN_EDGE: '#FFC94A',
    GRASS_TIP: '#9BDB5A', GRASS_A: '#5CB63B', GRASS_B: '#4EA431', GRASS_DARK: '#3D8A27', GRASS_DEEP: '#2F6E1F',
    SPECKS: [],
    WEATHER: null,
    DECOR: [],
  }),
  spring: Object.freeze({
    ...CITY,
    SKY_TOP: '#6BB6EA', SKY_MID: '#9ED6F2', SKY_LOW: '#D4EEF8',
    CLOUD: '#FFFFFF', CLOUD_SHADE: '#DCEFF8',
    SUN: '#FFEC9C', SUN_EDGE: '#FFD86A',
    GRASS_TIP: '#B5E67A', GRASS_A: '#6CC04A', GRASS_B: '#5DB040', GRASS_DARK: '#4A9A33', GRASS_DEEP: '#3A7E28',
    SPECKS: ['#FFFFFF', '#F7B6D2', '#FFE27A'],   // little flowers in the grass
    WEATHER: { kind: 'petal', colors: ['#F7B6D2', '#FFFFFF'], rate: 4 },
    DECOR: [['tulips', 0.45], ['daisies', 0.3]],  // flower beds along the pitch
  }),
  fall: Object.freeze({
    ...CITY,
    SKY_TOP: '#5E9FD6', SKY_MID: '#9CC7E3', SKY_LOW: '#F2D9B8',
    CLOUD: '#FFF6EA', CLOUD_SHADE: '#E8D6C2',
    SUN: '#FFC066', SUN_EDGE: '#F39C3D',
    GRASS_TIP: '#C9B44A', GRASS_A: '#8FA83A', GRASS_B: '#7E9632', GRASS_DARK: '#6B7F2A', GRASS_DEEP: '#55661F',
    SPECKS: ['#E07B28', '#C0392B', '#E8B53A'],   // fallen leaves
    WEATHER: { kind: 'leaf', colors: ['#E07B28', '#C0392B', '#E8B53A', '#B85A14'], rate: 14 },
    DECOR: [['leafPile', 0.7]],                  // [sprite, chance per pitch-side slot]
    DECOR_OCTOBER: [['leafPile', 0.35], ['pumpkin', 0.5]], // + jack-o'-lanterns in October
  }),
  winter: Object.freeze({
    ...CITY,
    SKY_TOP: '#8FA9C4', SKY_MID: '#B8CCDD', SKY_LOW: '#DDE7EF',
    CLOUD: '#F4F7FA', CLOUD_SHADE: '#C8D4DE',
    SUN: '#FFF4C2', SUN_EDGE: '#F2E3A6',
    // Snow-covered pitch: pale blue-white stripes, green tufts poking through
    GRASS_TIP: '#7FA88A', GRASS_A: '#DCE7EE', GRASS_B: '#CCDBE5', GRASS_DARK: '#B4C7D5', GRASS_DEEP: '#9AB0C2',
    SPECKS: ['#7FA88A', '#FFFFFF'],              // grass tufts + fresh snow
    LINE: '#FFFFFF',                             // touchlines (crisp white against the snow)
    WEATHER: { kind: 'snow', colors: ['#FFFFFF', '#EEF4F8'], rate: 45 },                  // flakes per second
    DECOR: [['snowman', 0.5]],
  }),
});

// Default scenery (summer). Kept for code that just needs "a" scenery set.
export const SCENERY = SEASONS.summer;
