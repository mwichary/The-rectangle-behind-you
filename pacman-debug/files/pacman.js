// Copyright 2010 Google Inc.  All Rights Reserved.

/**
 * @fileoverview Playable Pac-Man doodle for the homepage for May 21-22, 2010.
 * @author mwichary@google.com (Marcin Wichary)
 * @author khom@google.com (Kristopher Hom)
 *
 * Game logic largely based on
 * http://home.comcast.net/~jpittman2/pacman/pacmandossier.html
 */

var pacMan = {};

// new modes for presentation

var PM_NORMAL = 0;
var PM_POSITION_FOLLOWS_PAC_MAN = 1;
var PM_FINAL = 2;

// CODE CONSTANTS

/**
 * Constants for player characters.
 * @const
 */
var PM_PACMAN = 0;
var PM_MS_PACMAN = 1;

/**
 * Gameplay mode constants.
 * @const
 */
var PM_GAMEPLAY_GAME_IN_PROGRESS = 0;       // Regular game
var PM_GAMEPLAY_GHOST_BEING_EATEN = 1;      // Pause after Pac-Man eats ghost
var PM_GAMEPLAY_PLAYER_DYING_PART_1 = 2;    // Pause before Pac-Man dies
var PM_GAMEPLAY_PLAYER_DYING_PART_2 = 3;    // Pac-Man death animation
var PM_GAMEPLAY_READY_PART_1 = 4;           // READY! with ghosts hidden
var PM_GAMEPLAY_READY_PART_2 = 5;           // READY! with ghosts visible
var PM_GAMEPLAY_FAST_READY_PART_1 = 6;      // Before quick READY! (empty)
var PM_GAMEPLAY_FAST_READY_PART_2 = 7;      // Quick READY! without melody
                                            // (level 2 and above)
var PM_GAMEPLAY_GAMEOVER = 8;               // GAME OVER
var PM_GAMEPLAY_LEVEL_COMPLETE_PART_1 = 9;  // Pause after level ends
var PM_GAMEPLAY_LEVEL_COMPLETE_PART_2 = 10; // Playfield blinking
var PM_GAMEPLAY_LEVEL_COMPLETE_PART_3 = 11; // Quick pause with no playfield
var PM_GAMEPLAY_DOUBLE_MODE_SWITCH = 12;    // Pause before Ms. Pac-Man
var PM_GAMEPLAY_CUTSCENE = 13;              // Cutscene
var PM_GAMEPLAY_INFINITE_GAMEOVER = 14;     // GAME OVER at level 256

/**
 * Player and non-player (ghost) character modes.
 * @const
 */
var PM_PLAYER_MODE_MOVING = 1;          // Normal Pac-Man move (no other mode)
var PM_GHOST_MODE_CHASE = 1;            // Ghost chases Pac-Man
var PM_GHOST_MODE_SCATTER = 2;          // Ghost just wanders around
var PM_GHOST_MODE_FRIGHT = 4;           // (Blue) ghost runs away
var PM_GHOST_MODE_EYES = 8;             // Just being eaten, returns to pen
var PM_GHOST_MODE_IN_PEN = 16;          // In pen
var PM_GHOST_MODE_EXITING_PEN = 32;     // Leaving pen for the first time
var PM_GHOST_MODE_REENTERING_PEN = 64;  // Re-entering pen (after being eaten)
var PM_GHOST_MODE_REEXITING_PEN = 128;  // Re-exiting pen (after being eaten)

/**
 * Direction/movement constants.
 * @const
 */
var PM_DIR_NONE = 0;
var PM_DIR_UP = 1;
var PM_DIR_DOWN = 2;
var PM_DIR_LEFT = 4;
var PM_DIR_RIGHT = 8;

/**
 * A list of all directions. The order here is important: the original game
 * considered directions when figuring out ghost movement in this particular
 * order.
 * @const
 */
var PM_DIRS = [PM_DIR_UP, PM_DIR_LEFT, PM_DIR_DOWN, PM_DIR_RIGHT];

/**
 * Information about movement.
 * @const
 */
var PM_MOVEMENTS = {
  0: { axis: 0, increment: 0 }, // PM_DIR_NONE
  1: { axis: 0, increment: -1 }, // PM_DIR_UP
  2: { axis: 0, increment: +1 }, // PM_DIR_DOWN
  4: { axis: 1, increment: -1 }, // PM_DIR_LEFT
  8: { axis: 1, increment: +1 } // PM_DIR_RIGHT
};

/**
 * Dot types. Energizer = big blinking dot.
 * @const
 */
var PM_DOT_TYPE_NONE = 0;
var PM_DOT_TYPE_DOT = 1;
var PM_DOT_TYPE_ENERGIZER = 2;

/**
 * Speed constants. Pac-Man moves slower when eating dots. Ghosts move
 * slower in a tunnel.
 * @const
 */
var PM_SPEED_FULL = 0;
var PM_SPEED_DOT_EATING = 1;
var PM_SPEED_TUNNEL = 2;

/**
 * Path type = regular path or a tunnel.
 * @const
 */
var PM_PATH_NORMAL = 0;
var PM_PATH_TUNNEL = 1;

/**
 * Sound constants.
 * @const
 */
var PM_SOUND_PACMAN_DEATH = 'death';
var PM_SOUND_FRUIT = 'fruit';
var PM_SOUND_EXTRA_LIFE = 'extra-life';
var PM_SOUND_DOT_EATING_PART_1 = 'eating-dot-1';
var PM_SOUND_DOT_EATING_PART_2 = 'eating-dot-2';
var PM_SOUND_EATING_GHOST = 'eating-ghost';
var PM_SOUND_AMBIENT_1 = 'ambient-1';
var PM_SOUND_AMBIENT_2 = 'ambient-2';
var PM_SOUND_AMBIENT_3 = 'ambient-3';
var PM_SOUND_AMBIENT_4 = 'ambient-4';
var PM_SOUND_AMBIENT_FRIGHT = 'ambient-fright';
var PM_SOUND_AMBIENT_EYES = 'ambient-eyes';
var PM_SOUND_START_MUSIC = 'start-music';
var PM_SOUND_AMBIENT_CUTSCENE = 'cutscene';
var PM_SOUND_START_MUSIC_DOUBLE = 'start-music-double';
var PM_SOUND_DOT_EATING_DOUBLE = 'eating-dot-double';
var PM_SOUND_PACMAN_DEATH_DOUBLE = 'death-double';

/**
 * Sound channel constants.
 * @const
 */
var PM_CHANNEL_AUX = 0;
var PM_CHANNEL_EATING = 1;
var PM_CHANNEL_EATING_DOUBLE = 3;

/**
 * Number of supported sound channels.
 * @const
 */
var PM_SOUND_CHANNEL_COUNT = 5;

/**
 * Multi-channel count. We rotate between 2 channels for eating and
 * ambient sounds.
 * @const
 */
var PM_MULTI_CHANNEL_COUNT = 2;

/**
 * Interval for eating dots sound.
 * @const
 */
var PM_DOT_EATING_SOUND_INTERVAL = 150;
var PM_DOT_EATING_SOUND_CLEAR_TIME = PM_DOT_EATING_SOUND_INTERVAL + 100;


// GAMEPLAY CONFIGURATION CONSTANTS

/**
 * A number of non-player characters (ghosts).
 * @const
 */
var PM_GHOST_ACTOR_COUNT = 4;

/**
 * Extra life multiplier (awarded every 10000 points).
 * @const
 */
var PM_EXTRA_LIFE_SCORE = 10000;

/**
 * The maximum number of Pac-Man lives.
 * @const
 */
var PM_MAX_LIVES = 5;

/**
 * How many dots need to be eaten for the fruit to appear.
 * @const
 */
var PM_FRUIT_DOTS_TRIGGER_1 = 70;
var PM_FRUIT_DOTS_TRIGGER_2 = 170;

/**
 * How many dots does it take to be eaten for ambient sounds to change
 * (become faster)
 */
var PM_SOUND_AMBIENT_2_DOTS = 138;
var PM_SOUND_AMBIENT_3_DOTS = 207;
var PM_SOUND_AMBIENT_4_DOTS = 241;

/**
 * Scores for eating a dot, an energizer, and a ghost.
 * @const
 */
var PM_SCORE_DOT = 10;
var PM_SCORE_ENERGIZER = 50;
var PM_SCORE_GHOST = 200;

/**
 * Values used to determine whether ghosts can leave the pen in the
 * alternate count mode (c.f. pacMan.dotEaten).
 * @const
 */
var PM_ALTERNATE_DOT_COUNT = [0, 7, 17, 32];

/**
 * Width/height of one tile in pixels.
 * @const
 */
var PM_TILE_SIZE = 8;

/**
 * The number of pixels available for "cornering" (if you change directions
 * before the turn, you can "corner" the turn gaining a little bit of
 * distance). Two variants depending on the direction.
 * @const
 */
var PM_CORNER_DELTA_MAX = 4 - 0.4;
var PM_CORNER_DELTA_MIN = 4;

/**
 * Correction to position the gameplay exactly on top of the doodle graphics.
 * (Currently 32 pixels to the left.)
 * @const
 */
var PM_PLAYFIELD_OFFSET_X = -32;
var PM_PLAYFIELD_OFFSET_Y = 0;

/**
 * Available paths for Pac-Man and ghosts to travel through. A path starts
 * with position (x and y), and is either horizontal (w = width) or vertical
 * (h = height).
 * @type Array.<Object.<string, number>>
 * @const
 */
var PM_PATHS = [
  { x: 5, y: 1, w: 56 },
  { x: 5, y: 4, w: 5 },
  { x: 5, y: 1, h: 4 },
  { x: 9, y: 1, h: 12 },
  { x: 5, y: 12, h: 4 },
  { x: 10, y: 12, h: 4 },
  { x: 5, y: 15, w: 16 },
  { x: 5, y: 12, w: 31 },
  { x: 60, y: 1, h: 4 },
  { x: 54, y: 1, h: 4 },
  { x: 19, y: 1, h: 12 },
  { x: 19, y: 4, w: 26 },
  { x: 13, y: 5, w: 7 },
  { x: 13, y: 5, h: 4 },
  { x: 13, y: 8, w: 3 },
  { x: 56, y: 4, h: 9 },
  { x: 48, y: 4, w: 13 },
  { x: 48, y: 1, h: 12 },
  { x: 60, y: 12, h: 4 },
  { x: 44, y: 15, w: 17 },
  { x: 54, y: 12, h: 4 },
  { x: 44, y: 12, w: 17 },
  { x: 44, y: 1, h: 15 },
  { x: 41, y: 13, w: 4 },
  { x: 41, y: 13, h: 3 },
  { x: 38, y: 13, h: 3 },
  { x: 38, y: 15, w: 4 },
  { x: 35, y: 10, w: 10 },
  { x: 35, y: 1, h: 15 },
  { x: 35, y: 13, w: 4 },
  { x: 21, y: 12, h: 4 },
  { x: 24, y: 12, h: 4 },
  { x: 24, y: 15, w: 12 },
  { x: 27, y: 4, h: 9 },
  { x: 52, y: 9, w: 5 },
  { x: 56, y: 8, w: 10, type: PM_PATH_TUNNEL },
  { x: 1, y: 8, w: 9, type: PM_PATH_TUNNEL }
];

/**
 * Paths that should not have dots in them. Essentially, paths around
 * the ghost pen, and the tunnel.
 * @type Array.<Object.<string, number>>
 * @const
 */
var PM_NO_DOT_PATHS = [
  { x: 1, y: 8, w: 8 }, // Tunnel
  { x: 57, y: 8, w: 9 },
  { x: 44, y: 2, h: 10 }, // Around the pen
  { x: 35, y: 5, h: 7 },
  { x: 36, y: 4, w: 8 },
  { x: 36, y: 10, w: 8 },
  { x: 39, y: 15, w: 2 } // Where Pac-Man starts
];

/**
 * Positions of energizers (big dots that turn ghosts blue and allow
 * Pac-Man to eat them).
 * @type Array.<Object.<string, number>>
 * @const
 */
var PM_ENERGIZERS = [
  { x: 5, y: 15 },
  { x: 5, y: 3 },
  { x: 15, y: 8 },
  { x: 60, y: 3 },
  { x: 60, y: 15 }
];

/**
 * Positions of two ends of horizontal tunnel linking both sides of the
 * playfield.
 * @type Array.<Object.<string, number>>
 * @const
 */
var PM_TUNNEL_ENDS = [
  { x: 2, y: 8 },
  { x: 63, y: 8 }
];

/**
 * Initial position of all the actors. scatterX and scatterY are the
 * off-screen targets for scatter mode.
 * @type Object.<number, Array.<Object.<string, number>>>
 * @const
 */
var PM_INITIAL_ACTOR_POSITIONS = {
  1: [ // Pac-Man mode (one player)
    { x: 39.5, y: 15, dir: PM_DIR_LEFT },
    { x: 39.5, y: 4, dir: PM_DIR_LEFT, scatterX: 57, scatterY: -4 },
    { x: 39.5, y: 7, dir: PM_DIR_DOWN, scatterX: 0, scatterY: -4 },
    { x: 37.625, y: 7, dir: PM_DIR_UP, scatterX: 57, scatterY: 20 },
    { x: 41.375, y: 7, dir: PM_DIR_UP, scatterX: 0, scatterY: 20 }
  ],
  2: [ // Ms. Pac-Man mode (two players)
    { x: 40.25, y: 15, dir: PM_DIR_RIGHT },
    { x: 38.75, y: 15, dir: PM_DIR_LEFT },
    { x: 39.5, y: 4, dir: PM_DIR_LEFT, scatterX: 57, scatterY: -4 },
    { x: 39.5, y: 7, dir: PM_DIR_DOWN, scatterX: 0, scatterY: -4 },
    { x: 37.625, y: 7, dir: PM_DIR_UP, scatterX: 57, scatterY: 20 },
    { x: 41.375, y: 7, dir: PM_DIR_UP, scatterX: 0, scatterY: 20 }
  ]
};

/**
 * The position of the exit/entrance to the pen (Y, X)
 * @type Array.<number>
 * @const
 */
var PM_EXIT_PEN_POS = [4 * PM_TILE_SIZE, 39 * PM_TILE_SIZE];

/**
 * The position of the fruit (Y, X)
 * @type Array.<number>
 * @const
 */
var PM_FRUIT_POS = [10 * PM_TILE_SIZE, 39 * PM_TILE_SIZE];

/**
 * Constants for different timers.
 * @type number
 * @const
 */
var PM_TIMING_ENERGIZER = 0;               // Energizer blinking
var PM_TIMING_FRIGHT_BLINK = 1;            // Ghosts blinking blue/white
var PM_TIMING_GHOST_BEING_EATEN = 2;       // Pause while ghost is being eaten
var PM_TIMING_PLAYER_DYING_PART_1 = 3;     // Pause before Pac-Man dies
var PM_TIMING_PLAYER_DYING_PART_2 = 4;     // Pac-Man death animation
var PM_TIMING_FAST_READY_PART_1 = 5;       // Blank screen before quick READY!
var PM_TIMING_FAST_READY_PART_2 = 6;       // Quick READY! (level 2 and above)
var PM_TIMING_READY_PART_1 = 7;            // READY! with ghosts hidden
var PM_TIMING_READY_PART_2 = 8;            // READY! with ghosts visible
var PM_TIMING_GAMEOVER = 9;                // GAME OVER!
var PM_TIMING_LEVEL_COMPLETE_PART_1 = 10;  // Pause after level ends
var PM_TIMING_LEVEL_COMPLETE_PART_2 = 11;  // Playfield blinking
var PM_TIMING_LEVEL_COMPLETE_PART_3 = 12;  // Quick pause with no playfield
var PM_TIMING_DOUBLE_MODE = 13;            // Switching to Ms. Pac-Man mode
var PM_TIMING_FRUIT_DECAY = 14;            // Pause after eating the fruit
var PM_TIMING_FRUIT_MIN = 15;              // Minimum fruit time
var PM_TIMING_FRUIT_MAX = 16;              // Maximum fruit time
var PM_TIMING_SCORE_LABEL = 17;            // Score label blinking

/**
 * Different timers as per above constants.
 * @type Object.<number, number>
 * @const
 */
var PM_TIMING = {
  0: .16,   // PM_TIMING_ENERGIZER
  1: .23,   // PM_TIMING_FRIGHT_BLINK
  2: 1,     // PM_TIMING_GHOST_BEING_EATEN
  3: 1,     // PM_TIMING_PLAYER_DYING_PART_1
  4: 2.23,  // PM_TIMING_PLAYER_DYING_PART_2
  5: .3,    // PM_TIMING_FAST_READY_PART_1
  6: 1.9,   // PM_TIMING_FAST_READY_PART_2
  7: 2.23,  // PM_TIMING_READY_PART_1
  8: 1.9,   // PM_TIMING_READY_PART_2
  9: 5,     // PM_TIMING_GAMEOVER
  10: 1.9,  // PM_TIMING_LEVEL_COMPLETE_PART_1
  11: 1.18, // PM_TIMING_LEVEL_COMPLETE_PART_2
  12: .3,   // PM_TIMING_LEVEL_COMPLETE_PART_3
  13: .5,   // PM_TIMING_DOUBLE_MODE
  14: 1.9,  // PM_TIMING_FRUIT_DECAY
  15: 9,    // PM_TIMING_FRUIT_MIN
  16: 10,   // PM_TIMING_FRUIT_MAX
  17: .26   // PM_TIMING_SCORE_LABEL
};

/**
 * Master speed value.
 * @type number
 * @const
 */
var PM_MASTER_SPEED = .8;

/**
 * Speed whenever the ghosts turns into eyes after being eaten.
 * @type number
 * @const
 */
var PM_EYES_SPEED = PM_MASTER_SPEED * 2;

/**
 * Ghost speed inside a pen.
 * @type number
 * @const
 */
var PM_PEN_SPEED = PM_MASTER_SPEED * .6;

/**
 * Ghost speed when exiting the pen.
 * @type number
 * @const
 */
var PM_EXIT_PEN_SPEED = PM_MASTER_SPEED * .4;

/**
 * Information about the level. We have information for levels 1 (start)
 * through 21. Every level after 21 is the same. Level 255 is the last one,
 * after which we get a "kill screen."
 * @type Array.<Object.<string, number>>
 * @const
 */
var PM_LEVELS = [
  // 0
  {},

  // 1
  {
    ghostSpeed: .75,            // Regular ghost speed
    ghostTunnelSpeed: .4,       // Ghost speed in a tunnel

    playerSpeed: .8,            // Regular Pac-Man speed
    dotEatingSpeed: .71,        // Pac-Man speed when eating dots

    ghostFrightSpeed: .5,       // Ghost speed when frightened (blue)
    playerFrightSpeed: .9,      // Pac-Man speed when ghosts are frightened
    dotEatingFrightSpeed: .79,  // Pac-Man speed when eating dots in fright
                                // mode

    elroyDotsLeftPart1: 20,     // How many dots have to remain before red
                                // ghost (Blinky) turns into "Cruise Elroy"
    elroySpeedPart1: .8,        // Speed of "Cruise Elroy"
    elroyDotsLeftPart2: 10,     // How many dots have to remain before
                                // "Cruise Elroy" gets even faster
    elroySpeedPart2: .85,       // ...this fast

    frightTime: 6,              // Fright mode lasts for 6 seconds
    frightBlinkCount: 5,        // ...after 6 seconds, we get 5 blinks

    fruit: 1,                   // Type of fruit (1 to 8)
    fruitScore: 100,            // Fruit score when eaten

    // Times in seconds of alternating ghost modes
    // (scatter, chase, scatter...)
    ghostModeSwitchTimes: [7, 20, 7, 20, 5, 20, 5, 1],

    penForceTime: 4,            // How many seconds of Pac-Man inactivity
                                // (not eating dots) does it take for the
                                // ghosts to start leaving the pen

    // How many dots need to be eaten before ghosts start leaving (for four
    // ghosts)
    penLeavingLimits: [0, 0, 30, 60]
  },

  // 2
  {
    ghostSpeed: .85, ghostTunnelSpeed: .45,
    playerSpeed: .9, dotEatingSpeed: .79,
    ghostFrightSpeed: .55, playerFrightSpeed: .95, dotEatingFrightSpeed: .83,
    elroyDotsLeftPart1: 30, elroySpeedPart1: .9,
    elroyDotsLeftPart2: 15, elroySpeedPart2: .95,
    frightTime: 5, frightBlinkCount: 5,
    fruit: 2, fruitScore: 300,
    ghostModeSwitchTimes: [7, 20, 7, 20, 5, 1033, 1 / 60, 1],
    penForceTime: 4, penLeavingLimits: [0, 0, 0, 50],

    cutsceneId: 1 // Which cutscene to play after the level
  },

  // 3
  {
    ghostSpeed: .85, ghostTunnelSpeed: .45,
    playerSpeed: .9, dotEatingSpeed: .79,
    ghostFrightSpeed: .55, playerFrightSpeed: .95, dotEatingFrightSpeed: .83,
    elroyDotsLeftPart1: 40, elroySpeedPart1: .9,
    elroyDotsLeftPart2: 20, elroySpeedPart2: .95,
    frightTime: 4, frightBlinkCount: 5,
    fruit: 3, fruitScore: 500,
    ghostModeSwitchTimes: [7, 20, 7, 20, 5, 1033, 1 / 60, 1],
    penForceTime: 4, penLeavingLimits: [0, 0, 0, 0]
  },

  // 4
  {
    ghostSpeed: .85, ghostTunnelSpeed: .45,
    playerSpeed: .9, dotEatingSpeed: .79,
    ghostFrightSpeed: .55, playerFrightSpeed: .95, dotEatingFrightSpeed: .83,
    elroyDotsLeftPart1: 40, elroySpeedPart1: .9,
    elroyDotsLeftPart2: 20, elroySpeedPart2: .95,
    frightTime: 3, frightBlinkCount: 5,
    fruit: 3, fruitScore: 500,
    ghostModeSwitchTimes: [7, 20, 7, 20, 5, 1033, 1 / 60, 1],
    penForceTime: 4, penLeavingLimits: [0, 0, 0, 0]
  },

  // 5
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 40, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 20, elroySpeedPart2: 1.05,
    frightTime: 2, frightBlinkCount: 5,
    fruit: 4, fruitScore: 700,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0],

    cutsceneId: 2
  },

  // 6
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 50, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 25, elroySpeedPart2: 1.05,
    frightTime: 5, frightBlinkCount: 5,
    fruit: 4, fruitScore: 700,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 7
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 50, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 25, elroySpeedPart2: 1.05,
    frightTime: 2, frightBlinkCount: 5,
    fruit: 5, fruitScore: 1000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 8
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 50, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 25, elroySpeedPart2: 1.05,
    frightTime: 2, frightBlinkCount: 5,
    fruit: 5, fruitScore: 1000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 9
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 60, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 30, elroySpeedPart2: 1.05,
    frightTime: 1, frightBlinkCount: 3,
    fruit: 6, fruitScore: 2000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0],

    cutsceneId: 3
  },

  // 10
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 60, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 30, elroySpeedPart2: 1.05,
    frightTime: 5, frightBlinkCount: 5,
    fruit: 6, fruitScore: 2000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 11
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 60, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 30, elroySpeedPart2: 1.05,
    frightTime: 2, frightBlinkCount: 5,
    fruit: 7, fruitScore: 3000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 12
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 80, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 40, elroySpeedPart2: 1.05,
    frightTime: 1, frightBlinkCount: 3,
    fruit: 7, fruitScore: 3000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 13
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 80, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 40, elroySpeedPart2: 1.05,
    frightTime: 1, frightBlinkCount: 3,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0],

    cutsceneId: 3
  },

  // 14
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 80, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 40, elroySpeedPart2: 1.05,
    frightTime: 3, frightBlinkCount: 5,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 15
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 100, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 50, elroySpeedPart2: 1.05,
    frightTime: 1, frightBlinkCount: 3,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 16
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 100, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 50, elroySpeedPart2: 1.05,
    frightTime: 1, frightBlinkCount: 3,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 17
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 100, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 50, elroySpeedPart2: 1.05,
    frightTime: 0, frightBlinkCount: 0,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0],

    cutsceneId: 3
  },

  // 18
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 100, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 50, elroySpeedPart2: 1.05,
    frightTime: 1, frightBlinkCount: 3,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 19
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 120, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 60, elroySpeedPart2: 1.05,
    frightTime: 0, frightBlinkCount: 0,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 20
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: 1, dotEatingSpeed: .87,
    ghostFrightSpeed: .6, playerFrightSpeed: 1, dotEatingFrightSpeed: .87,
    elroyDotsLeftPart1: 120, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 60, elroySpeedPart2: 1.05,
    frightTime: 0, frightBlinkCount: 0,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]
  },

  // 21+
  {
    ghostSpeed: .95, ghostTunnelSpeed: .5,
    playerSpeed: .9, dotEatingSpeed: .79,
    ghostFrightSpeed: .75, playerFrightSpeed: .9, dotEatingFrightSpeed: .79,
    elroyDotsLeftPart1: 120, elroySpeedPart1: 1,
    elroyDotsLeftPart2: 60, elroySpeedPart2: 1.05,
    frightTime: 0, frightBlinkCount: 0,
    fruit: 8, fruitScore: 5000,
    ghostModeSwitchTimes: [5, 20, 5, 20, 5, 1037, 1 / 60, 1],
    penForceTime: 3, penLeavingLimits: [0, 0, 0, 0]

  }
];

/**
 * Constants for different "routines." Routines are pre-programmed paths
 * ghosts follow when entering/leaving the pen.
 * @const
 */
var PM_ROUTINE_LEFT_PEN = 1;
var PM_ROUTINE_CENTER_PEN = 2;
var PM_ROUTINE_RIGHT_PEN = 3;
var PM_ROUTINE_LEFT_PEN_EXIT = 4;
var PM_ROUTINE_CENTER_PEN_EXIT = 5;
var PM_ROUTINE_RIGHT_PEN_EXIT = 6;
var PM_ROUTINE_REENTER_LEFT_PEN = 7;
var PM_ROUTINE_REENTER_CENTER_PEN = 8;
var PM_ROUTINE_REENTER_RIGHT_PEN = 9;
var PM_ROUTINE_REEXIT_LEFT_PEN = 10;
var PM_ROUTINE_REEXIT_CENTER_PEN = 11;
var PM_ROUTINE_REEXIT_RIGHT_PEN = 12;

/**
 * Different routines. Each step has a position, direction, speed, and
 * the destination value (X if left/right, Y if up/down).
 * @type Object.<number, Object.<string, number>>
 * @const
 */
var PM_ROUTINES = {
  1: [ // PM_ROUTINE_LEFT_PEN
    { x: 37.6, y: 7, dir: PM_DIR_UP, dest: 6.375, speed: PM_PEN_SPEED },
    { x: 37.6, y: 6.375, dir: PM_DIR_DOWN, dest: 7.625,
      speed: PM_PEN_SPEED },
    { x: 37.6, y: 7.625, dir: PM_DIR_UP, dest: 7, speed: PM_PEN_SPEED }
  ],
  2: [ // PM_ROUTINE_CENTER_PEN
    { x: 39.5, y: 7, dir: PM_DIR_DOWN, dest: 7.625, speed: PM_PEN_SPEED },
    { x: 39.5, y: 7.625, dir: PM_DIR_UP, dest: 6.375,
      speed: PM_PEN_SPEED },
    { x: 39.5, y: 6.375, dir: PM_DIR_DOWN, dest: 7, speed: PM_PEN_SPEED }
  ],
  3: [ // PM_ROUTINE_RIGHT_PEN
    { x: 41.4, y: 7, dir: PM_DIR_UP, dest: 6.375, speed: PM_PEN_SPEED },
    { x: 41.4, y: 6.375, dir: PM_DIR_DOWN, dest: 7.625,
      speed: PM_PEN_SPEED },
    { x: 41.4, y: 7.625, dir: PM_DIR_UP, dest: 7, speed: PM_PEN_SPEED }
  ],
  4: [ // PM_ROUTINE_LEFT_PEN_EXIT
    { x: 37.6, y: 7, dir: PM_DIR_RIGHT, dest: 39.5,
      speed: PM_EXIT_PEN_SPEED },
    { x: 39.5, y: 7, dir: PM_DIR_UP, dest: 4, speed: PM_EXIT_PEN_SPEED }
  ],
  5: [ // PM_ROUTINE_CENTER_PEN_EXIT
    { x: 39.5, y: 7, dir: PM_DIR_UP, dest: 4, speed: PM_EXIT_PEN_SPEED }
  ],
  6: [ // PM_ROUTINE_RIGHT_PEN_EXIT
    { x: 41.4, y: 7, dir: PM_DIR_LEFT, dest: 39.5,
      speed: PM_EXIT_PEN_SPEED },
    { x: 39.5, y: 7, dir: PM_DIR_UP, dest: 4, speed: PM_EXIT_PEN_SPEED }
  ],
  7: [ // PM_ROUTINE_REENTER_LEFT_PEN
    { x: 39.5, y: 4, dir: PM_DIR_DOWN, dest: 7, speed: PM_EYES_SPEED },
    { x: 39.5, y: 7, dir: PM_DIR_LEFT, dest: 37.625, speed: PM_EYES_SPEED }
  ],
  8: [ // PM_ROUTINE_REENTER_CENTER_PEN
    { x: 39.5, y: 4, dir: PM_DIR_DOWN, dest: 7, speed: PM_EYES_SPEED }
  ],
  9: [ // PM_ROUTINE_REENTER_RIGHT_PEN
    { x: 39.5, y: 4, dir: PM_DIR_DOWN, dest: 7, speed: PM_EYES_SPEED },
    { x: 39.5, y: 7, dir: PM_DIR_RIGHT, dest: 41.375, speed: PM_EYES_SPEED }
  ],
  10: [ // PM_ROUTINE_REEXIT_LEFT_PEN
    { x: 37.6, y: 7, dir: PM_DIR_RIGHT, dest: 39.5,
      speed: PM_EXIT_PEN_SPEED },
    { x: 39.5, y: 7, dir: PM_DIR_UP, dest: 4, speed: PM_EXIT_PEN_SPEED }
  ],
  11: [ // PM_ROUTINE_REEXIT_CENTER_PEN
    { x: 39.5, y: 7, dir: PM_DIR_UP, dest: 4, speed: PM_EXIT_PEN_SPEED }
  ],
  12: [ // PM_ROUTINE_REEXIT_RIGHT_PEN
    { x: 41.4, y: 7, dir: PM_DIR_LEFT, dest: 39.5,
      speed: PM_EXIT_PEN_SPEED },
    { x: 39.5, y: 7, dir: PM_DIR_UP, dest: 4, speed: PM_EXIT_PEN_SPEED }
  ]
};

/**
 * Information about cutscenes.
 * @const
 */
var PM_CUTSCENES = {
  // First cutscene: Ghost chases Pac-Man, big Pac-Man chases back
  1: {
    // Actors in a given cutscene.
    actors: [
      { ghost: false, x: 64, y: 9, id: 0 },
      { ghost: true, x: 68.2, y: 9, id: 1 }
    ],
    sequence: [
      {
        time: 5.5,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: .78 * PM_MASTER_SPEED * 2 }
        ]
      },
      {
        time: .1,
        moves: [
          { dir: PM_DIR_LEFT, speed: 20 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: 0 }
        ]
      },
      {
        time: 9,
        moves: [
          { dir: PM_DIR_RIGHT, speed: .75 * PM_MASTER_SPEED * 2,
            elId: 'pcm-bpcm' },
          { dir: PM_DIR_RIGHT, speed: .5 * PM_MASTER_SPEED * 2,
            mode: PM_GHOST_MODE_FRIGHT }
        ]
      }
    ]
  },

  // Second cutscene: Ghost getting damaged
  2: {
    actors: [
      { ghost: false, x: 64, y: 9, id: 0 },
      { ghost: true, x: 70.2, y: 9, id: 1 },
      { ghost: true, x: 32, y: 9.5, id: 2 }
    ],
    sequence: [
      {
        time: 2.70,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: .78 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_NONE, speed: 0, elId: 'pcm-stck' }
        ]
      },
      {
        time: 1,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: .1 * PM_MASTER_SPEED },
          { dir: PM_DIR_NONE, speed: 0, elId: 'pcm-stck' }
        ]
      },
      {
        time: 1.3,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: 0 * PM_MASTER_SPEED },
          { dir: PM_DIR_NONE, speed: 0, elId: 'pcm-stck' }
        ]
      },
      {
        time: 1,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: 0, elId: 'pcm-ghfa' },
          { dir: PM_DIR_NONE, speed: 0, elId: 'pcm-stck' }
        ]
      },
      {
        time: 2.5,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: 0, elId: 'pcm-ghfa' },
          { dir: PM_DIR_NONE, speed: 0, elId: 'pcm-stck' }
        ]
      }
    ]
  },

  // Third cutscene: Fixed ghost chases Pac-Man, bug runs away
  3: {
    actors: [
      { ghost: false, x: 64, y: 9, id: 0 },
      { ghost: true, x: 70.2, y: 9, id: 2 }
    ],
    sequence: [
      {
        time: 5.3,
        moves: [
          { dir: PM_DIR_LEFT, speed: .75 * PM_MASTER_SPEED * 2 },
          { dir: PM_DIR_LEFT, speed: .78 * PM_MASTER_SPEED * 2,
            elId: 'pcm-ghin' }
        ]
      },
      {
        time: 5.3,
        moves: [
          { dir: PM_DIR_LEFT, speed: 0 },
          { dir: PM_DIR_RIGHT, speed: .78 * PM_MASTER_SPEED * 2,
            elId: 'pcm-gbug' }
        ]
      }
    ]
  }
};

/**
 * Allowed framerates. The game will start with the first one (90fps) and
 * scale down if it determines the computer is too slow.
 * @const
 */
var PM_ALLOWED_FPS = [90, 45, 30];
var PM_TARGET_FPS = PM_ALLOWED_FPS[0];

/**
 * Stop trying to catch up with timer if it exceeds 100ms. Otherwise,
 * if the whole browser stutters, Pac-Man/ghosts etc. would jump a long
 * distance.
 * @const
 */
var PM_MAX_TIME_DELTA = 100;

/**
 * If two subsequent clock ticks are longer than 50ms, we increase the
 * slowness count.
 * @const
 */
var PM_TIME_SLOWNESS = 50;

/**
 * If the slowness count exceeds 20, we drop to lower framerate.
 * @const
 */
var PM_MAX_SLOWNESS_COUNT = 20;

/**
 * How many fruit icons maximum can we show to indicate the current level
 * in the lower-right corner.
 * @const
 */
var PM_LEVEL_CHROME_MAX = 4;

/**
 * Key codes for all keyboard operations.
 * @const
 */
var PM_KEYCODE_LEFT = 37;
var PM_KEYCODE_UP = 38;
var PM_KEYCODE_RIGHT = 39;
var PM_KEYCODE_DOWN = 40;
var PM_KEYCODE_A = 65;
var PM_KEYCODE_D = 68;
var PM_KEYCODE_S = 83;
var PM_KEYCODE_W = 87;

/**
 * Click event sensitivity. Any click event further than 8px from Pac-Man
 * will be interpreted as directional.
 * @const
 */
var PM_CLICK_SENSITIVITY = 8;

/**
 * Touch event sensitivity. Any touch event more than 15px long will
 * be interpreted as a stroke.
 * @const
 */
var PM_TOUCH_SENSITIVITY = 15;

/**
 * Touch click event sensitivity. Any touch event shorter than 8px will
 * be interpreted as a click.
 * @const
 */
var PM_TOUCH_CLICK_SENSITIVITY = 8;

/**
 * Minimal supported Flash version.
 */
var PM_MIN_FLASH_VERSION = '9.0.0.0';

/**
 * We allow Flash 3 seconds to load and initialize. If it doesn't in that
 * time, we start the game without sound. This is in case something goes
 * wrong and Flash is detected but doesn't load correctly.
 */
var PM_FLASH_NOT_READY_TIMEOUT = 1000; /* 3000 */


/* PAC MAN ACTOR FUNCTIONS */

/**
 * Creates a Pac-Man actor object with a given actor id.
 * @param {number} id Actor id (0 for Pac-Man, 1 for Ms. Pac-Man if present,
 *                              2, 3, etc. for ghosts).
 * @constructor
 */
function PacManActor(id) {
  this.id = id;
}

/**
 * Restarts/reboots the actor (usually at the beginning of new level/new
 * life).
 */
PacManActor.prototype.restart = function() {
  var position = PM_INITIAL_ACTOR_POSITIONS[pacMan.playerCount][this.id];

  // Current position, including fractions for positions within tiles.
  this.pos = [position.y * PM_TILE_SIZE, position.x * PM_TILE_SIZE];
  // Used for subtle changes in position when cornering.
  this.posDelta = [0, 0];
  // Last full/rounded position (or = currently active tile).
  this.tilePos = [position.y * PM_TILE_SIZE, position.x * PM_TILE_SIZE];
  // For ghosts, the tile the ghosts is going after.
  this.targetPos = [position.scatterY * PM_TILE_SIZE,
                    position.scatterX * PM_TILE_SIZE];
  // For ghosts, the target tile in the scatter mode.
  this.scatterPos = [position.scatterY * PM_TILE_SIZE,
                     position.scatterX * PM_TILE_SIZE];

  // Current direction.
  this.dir = position.dir;
  // Last direction before actor stopped.
  this.lastActiveDir = this.dir;
  // Next direction to be taken at the nearest possible intersection.
  this.nextDir = PM_DIR_NONE;
  // Next player direction requested by keyboard press or touch event.
  this.requestedDir = PM_DIR_NONE;

  this.physicalSpeed = 0;

  // Current speed (full, tunnel, eating dot, etc.).
  this.changeCurrentSpeed(PM_SPEED_FULL);

  // If the ghost was already eaten during a given fright mode, it will
  // exit the pen non-blue.
  this.eatenInThisFrightMode = false;
  // If the global mode was changed while the ghost was in the pen,
  // the ghost will chose a different direction upon entering.
  this.modeChangedWhileInPen = false;
  // Whether the ghost is free to leave pen. Does not apply to Blinky,
  // who's never really in the pen.
  this.freeToLeavePen = false;
  this.reverseDirectionsNext = false;

  this.updateTargetPlayerId();
};

/**
 * Creates a DOM element for a given actor.
 */
PacManActor.prototype.createElement = function() {
  this.el = document.createElement('div');
  this.el.className = 'pcm-ac';
  this.el.id = 'actor' + this.id;
  pacMan.prepareElement(this.el, 0, 0);
  pacMan.playfieldEl.appendChild(this.el);

  // We store the last DOM position and last DOM background position so that
  // we don't request DOM changes unless we have to.
  this.elPos = [0, 0];
  this.elBackgroundPos = [0, 0];
};

PacManActor.prototype.debugUpdateTargetLine = function() {
  if (pacMan.debugTargetTiles) {
    var el1 = document.getElementById('debug-target-' + (this.id - pacMan.playerCount));
    var el2 = document.getElementById('debug-target-' + (this.id - pacMan.playerCount) + '-line');
    
    if (!el1 || !el2) {
      return;
    }
    
    if (this.mode == PM_GHOST_MODE_CHASE || this.mode == PM_GHOST_MODE_SCATTER ||
        this.mode == PM_GHOST_MODE_EYES) {
      el1.style.display = 'block';
      el2.style.display = 'block';
    } else {
      el1.style.display = 'none';
      el2.style.display = 'none';
    }
  }
}
/**
 * Changes the mode of a given actor (ghost) and reacts to the change.
 * @param {number} mode New mode (PM_GHOST_MODE_* constants).
 */
PacManActor.prototype.changeMode = function(mode) {
  var oldMode = this.mode;
  this.mode = mode;
  
  this.debugUpdateTargetLine();

  // Cruise Elroy speed sometimes depends on whether the last ghost is or is
  // not in the pen.
  if ((this.id == pacMan.playerCount + 3) &&
      (mode == PM_GHOST_MODE_IN_PEN || oldMode == PM_GHOST_MODE_IN_PEN)) {
    pacMan.updateCruiseElroySpeed();
  }

  switch (oldMode) {
    case PM_GHOST_MODE_EXITING_PEN:
      pacMan.ghostExitingPenNow = false;
      break;
    case PM_GHOST_MODE_EYES:
      if (pacMan.ghostEyesCount > 0) {
        pacMan.ghostEyesCount--;
      }
      if (pacMan.ghostEyesCount == 0) {
        pacMan.playAmbientSound();
      }
      break;
  }

  switch (mode) {
    case PM_GHOST_MODE_FRIGHT:
      this.fullSpeed = pacMan.levels.ghostFrightSpeed * PM_MASTER_SPEED;
      this.tunnelSpeed = pacMan.levels.ghostTunnelSpeed * PM_MASTER_SPEED;
      this.followingRoutine = false;
      break;
    case PM_GHOST_MODE_CHASE:
      this.fullSpeed = pacMan.levels.ghostSpeed * PM_MASTER_SPEED;
      this.tunnelSpeed = pacMan.levels.ghostTunnelSpeed * PM_MASTER_SPEED;
      this.followingRoutine = false;
      break;
    case PM_GHOST_MODE_SCATTER:
      this.targetPos = this.scatterPos;
      this.fullSpeed = pacMan.levels.ghostSpeed * PM_MASTER_SPEED;
      this.tunnelSpeed = pacMan.levels.ghostTunnelSpeed * PM_MASTER_SPEED;
      this.followingRoutine = false;
      break;
    case PM_GHOST_MODE_EYES:
      this.fullSpeed = PM_EYES_SPEED;
      this.tunnelSpeed = PM_EYES_SPEED;
      this.targetPos = [PM_EXIT_PEN_POS[0], PM_EXIT_PEN_POS[1]];
      this.followingRoutine = false;
      this.freeToLeavePen = false;
      break;
    case PM_GHOST_MODE_IN_PEN:
      // Randomly pick a target (Pac-Man or Ms. Pac-Man) to focus on,
      // so that it's a surprise if a ghost exits the pen.
      this.updateTargetPlayerId();

      this.followingRoutine = true;
      this.routineMoveId = -1;
      switch (this.id) {
        case pacMan.playerCount + 1:
          this.routineToFollow = PM_ROUTINE_CENTER_PEN;
          break;
        case pacMan.playerCount + 2:
          this.routineToFollow = PM_ROUTINE_LEFT_PEN;
          break;
        case pacMan.playerCount + 3:
          this.routineToFollow = PM_ROUTINE_RIGHT_PEN;
          break;
      }
      break;
    case PM_GHOST_MODE_EXITING_PEN:
      this.followingRoutine = true;
      this.routineMoveId = -1;
      switch (this.id) {
        case pacMan.playerCount + 1:
          this.routineToFollow = PM_ROUTINE_CENTER_PEN_EXIT;
          break;
        case pacMan.playerCount + 2:
          this.routineToFollow = PM_ROUTINE_LEFT_PEN_EXIT;
          break;
        case pacMan.playerCount + 3:
          this.routineToFollow = PM_ROUTINE_RIGHT_PEN_EXIT;
          break;
      }
      pacMan.ghostExitingPenNow = true;
      break;
    case PM_GHOST_MODE_REENTERING_PEN:
      this.followingRoutine = true;
      this.routineMoveId = -1;
      switch (this.id) {
        case pacMan.playerCount:
        case pacMan.playerCount + 1:
          this.routineToFollow = PM_ROUTINE_REENTER_CENTER_PEN;
          break;
        case pacMan.playerCount + 2:
          this.routineToFollow = PM_ROUTINE_REENTER_LEFT_PEN;
          break;
        case pacMan.playerCount + 3:
          this.routineToFollow = PM_ROUTINE_REENTER_RIGHT_PEN;
          break;
      }
      break;
    case PM_GHOST_MODE_REEXITING_PEN:
      this.followingRoutine = true;
      this.routineMoveId = -1;
      switch (this.id) {
        case pacMan.playerCount:
        case pacMan.playerCount + 1:
          this.routineToFollow = PM_ROUTINE_REEXIT_CENTER_PEN;
          break;
        case pacMan.playerCount + 2:
          this.routineToFollow = PM_ROUTINE_REEXIT_LEFT_PEN;
          break;
        case pacMan.playerCount + 3:
          this.routineToFollow = PM_ROUTINE_REEXIT_RIGHT_PEN;
          break;
      }

      break;
  }

  this.updatePhysicalSpeed();
};

/**
 * For two-player game (with Pac-Man and Ms. Pac-Man) each ghosts randomly
 * focuses on one of the players. This changes every time a ghost leaves
 * a pen to make things more interesting.
 */
PacManActor.prototype.updateTargetPlayerId = function() {
  if (this.id >= pacMan.playerCount) {
    this.targetPlayerId = Math.floor(pacMan.rand() * pacMan.playerCount);
  }
};

/**
 * Process a direction requested by player using keyboard, touch, etc.
 * @param {number} newDir New direction.
 */
PacManActor.prototype.processRequestedDirection = function(newDir) {
  // Enable sound as long as the user hasn't previously disabled it by clicking
  // the sound icon.
  if (!pacMan.userDisabledSound) {
    google.pacManSound = true;
    pacMan.updateSoundIcon();
  }

  // If the new direction is the opposite of the current one, we turn
  // immediately in place...
  if (this.dir == pacMan.oppositeDirections[newDir]) {
    this.dir = newDir;

    this.posDelta = [0, 0];

    // If Pac-Man reverses direction in a tile when it was eating a dot,
    // we restore the speed to full on reverse.
    if (this.currentSpeed != PM_SPEED_TUNNEL) {
      this.changeCurrentSpeed(PM_SPEED_FULL);
    }
    if (this.dir != PM_DIR_NONE) {
      this.lastActiveDir = this.dir;
    }
    this.nextDir = PM_DIR_NONE;
  } else if (this.dir != newDir) {
    // ...otherwise, we either move the Pac-Man straight away if it's
    // stationary...
    if (this.dir == PM_DIR_NONE) {
      if (pacMan.playfield[this.pos[0]][this.pos[1]].allowedDir & newDir) {
        this.dir = newDir;
      }
    } else {
      // We want to be more forgiving with control. If the player presses
      // the arrow one or two pixels *after* the intersection, we still want
      // to allow the turn.
      var tile = pacMan.playfield[this.tilePos[0]][this.tilePos[1]];
      if (tile && (tile.allowedDir & newDir)) {
        var movement = PM_MOVEMENTS[this.dir];
        var newPos = [this.pos[0], this.pos[1]];
        newPos[movement.axis] -= movement.increment;

        var backtrackDist = 0;
        if (newPos[0] == this.tilePos[0] && newPos[1] == this.tilePos[1]) {
          backtrackDist = 1;
        } else {
          newPos[movement.axis] -= movement.increment;

          if (newPos[0] == this.tilePos[0] && newPos[1] == this.tilePos[1]) {
            backtrackDist = 2;
          }
        }

        if (backtrackDist) {
          this.dir = newDir;
          this.pos[0] = this.tilePos[0];
          this.pos[1] = this.tilePos[1];
          var movement = PM_MOVEMENTS[this.dir];
          this.pos[movement.axis] += movement.increment * backtrackDist;
          return;
        }
      }

      // ...all else failing, we store the direction for the next possible
      // intersection
      this.nextDir = newDir;
      this.posDelta = [0, 0];
    }
  }
};

/**
 * Calculate the next direction for a ghost.
 * @param {boolean} afterReversal Did the ghost just reverse course?
 */
PacManActor.prototype.figureOutNextDirection = function(afterReversal) {
  var tilePos = this.tilePos;

  var movement = PM_MOVEMENTS[this.dir];
  var newPos = [tilePos[0], tilePos[1]];
  newPos[movement.axis] += movement.increment * PM_TILE_SIZE;

  var tile = pacMan.playfield[newPos[0]][newPos[1]];
  // If the ghost just reversed course, and reverses back into a
  // corner, the tile ahead might be a wall. In that case, we use a current
  // tile.
  if (afterReversal && !tile.intersection) {
    var tile = pacMan.playfield[tilePos[0]][tilePos[1]];
  }

  if (tile.intersection) {
    switch (this.mode) {
      case PM_GHOST_MODE_SCATTER:
      case PM_GHOST_MODE_CHASE:
      case PM_GHOST_MODE_EYES:
        // If only the opposite direction is allowed (dead end), we have
        // to take it. Reversing back in an intersection is otherwise not
        // allowed, hence the special case.
        if ((this.dir & tile.allowedDir) == 0 &&
            tile.allowedDir == pacMan.oppositeDirections[this.dir]) {
          this.nextDir = pacMan.oppositeDirections[this.dir];
        } else {
          // Try each direction that's available and see which gets us
          // closer (in a straight line) to the target tile.
          var bestDistance = 99999999999;
          var bestDir = PM_DIR_NONE;

          for (var i in PM_DIRS) {
            var dir = PM_DIRS[i];

            if ((tile.allowedDir & dir) &&
                (this.dir != pacMan.oppositeDirections[dir])) {

              var movement = PM_MOVEMENTS[dir];
              var simulatedPos = [newPos[0], newPos[1]];
              simulatedPos[movement.axis] += movement.increment;
              var newDistance = pacMan.getDistance(simulatedPos,
                  [this.targetPos[0], this.targetPos[1]]);

              if (newDistance < bestDistance) {
                bestDistance = newDistance;
                bestDir = dir;
              }
            }
          }
          if (bestDir) {
            this.nextDir = bestDir;
          }

        }
        break;

      case PM_GHOST_MODE_FRIGHT:
        // If only the opposite direction is allowed (dead end), we have
        // to take it. Reversing back in an intersection is otherwise not
        // allowed, hence the special case.
        if ((this.dir & tile.allowedDir) == 0 &&
            tile.allowedDir == pacMan.oppositeDirections[this.dir]) {
          this.nextDir = pacMan.oppositeDirections[this.dir];
        } else {
          // In scatter mode, we just take a random new direction (except
          // reverse, which is not allowed).
          do {
            var random = PM_DIRS[Math.floor(pacMan.rand() * 4)];
          } while (((random & tile.allowedDir) == 0) ||
                   (random == pacMan.oppositeDirections[this.dir]));
          this.nextDir = random;
        }
        break;
    }
  }
};

/**
 * Handling a new tile. Changing the speed depending if it's a tunnel or not,
 * eat a dot if it's there, etc.
 * @param {Array} tilePos Position of a new tile.
 */
PacManActor.prototype.enterNewTile = function(tilePos) {
  pacMan.tilesChanged = true;

  // When modes change, ghosts reverse directions immediately. We need to
  // special case this, since there will be no time to figure out the next
  // direction the proper way this way.
  if (this.reverseDirectionsNext) {
    this.dir = pacMan.oppositeDirections[this.dir];
    this.nextDir = 0;
    this.reverseDirectionsNext = false;
    this.figureOutNextDirection(true);
  }

  // If Marcin was a good programmer, the algorithms governing Pac-Man
  // movements would be rock solid. That is not the case. Ryan found a bug
  // once that made him go through a wall. If Marcin was a good tester, he
  // would figure out how to reproduce and fix the bug. That is not the
  // case. Hence a little protection below. This checks if a new tile is
  // actually a valid path and if not, go back to the last-known good tile
  // and stop Pac-Man in its tracks. This is essentially a "treating
  // symptoms" protection, but hey, it's better than nothing, right?
  if (!this.ghost && !pacMan.playfield[tilePos[0]][tilePos[1]].path) {
    this.pos[0] = this.lastGoodTilePos[0];
    this.pos[1] = this.lastGoodTilePos[1];
    tilePos[0] = this.lastGoodTilePos[0];
    tilePos[1] = this.lastGoodTilePos[1];
    this.dir = PM_DIR_NONE;
  } else {
    this.lastGoodTilePos = [tilePos[0], tilePos[1]];
  }

  // You slow down in a tunnel, except if you're ghost's eyes.
  if ((pacMan.playfield[tilePos[0]][tilePos[1]].type == PM_PATH_TUNNEL) &&
     (this.mode != PM_GHOST_MODE_EYES)) {
    this.changeCurrentSpeed(PM_SPEED_TUNNEL);
  } else {
    this.changeCurrentSpeed(PM_SPEED_FULL);
  }

  if (!this.ghost && pacMan.playfield[tilePos[0]][tilePos[1]].dot) {
    pacMan.dotEaten(this.id, tilePos);
  }

  this.tilePos[0] = tilePos[0];
  this.tilePos[1] = tilePos[1];
};

/**
 * Pac-Man and Ms. Pac-Man (but not ghost) are allowed to "corner." If the
 * direction is changed in advance of intersection, a couple pixels (3 or 4)
 * close to the middle of it are taken diagonally, allowing to gain extra
 * distance when ghosts chase you.
 */
PacManActor.prototype.handleCornering = function() {
  var tilePos = this.tilePos;

  switch (this.dir) {
    case PM_DIR_UP:
      var minPos = [tilePos[0], tilePos[1]];
      var maxPos = [tilePos[0] + PM_CORNER_DELTA_MAX, tilePos[1]];
      break;
    case PM_DIR_DOWN:
      var minPos = [tilePos[0] - PM_CORNER_DELTA_MIN, tilePos[1]];
      var maxPos = [tilePos[0], tilePos[1]];
      break;
    case PM_DIR_LEFT:
      var minPos = [tilePos[0], tilePos[1]];
      var maxPos = [tilePos[0], tilePos[1] + PM_CORNER_DELTA_MAX];
      break;
    case PM_DIR_RIGHT:
      var minPos = [tilePos[0], tilePos[1] - PM_CORNER_DELTA_MIN];
      var maxPos = [tilePos[0], tilePos[1]];
      break;
  }

  if (this.pos[0] >= minPos[0] && this.pos[0] <= maxPos[0] &&
      this.pos[1] >= minPos[1] && this.pos[1] <= maxPos[1]) {
    var movement = PM_MOVEMENTS[this.nextDir];

    // The corner increment is stored temporarily in posDelta and added to
    // the proper position only after cornering ends.
    this.posDelta[movement.axis] += movement.increment;
  }
};

/**
 * Checks if the current tile is not a special tile that requires a special
 * action.
 */
PacManActor.prototype.checkSpecialTiles = function() {
  // Horizontal tunnel.
  if (this.pos[0] == (PM_TUNNEL_ENDS[0].y * PM_TILE_SIZE) &&
      this.pos[1] == (PM_TUNNEL_ENDS[0].x * PM_TILE_SIZE)) {
    this.pos[0] = PM_TUNNEL_ENDS[1].y * PM_TILE_SIZE;
    this.pos[1] = (PM_TUNNEL_ENDS[1].x - 1) * PM_TILE_SIZE;
  } else if (this.pos[0] == (PM_TUNNEL_ENDS[1].y * PM_TILE_SIZE) &&
             this.pos[1] == (PM_TUNNEL_ENDS[1].x * PM_TILE_SIZE)) {
    this.pos[0] = PM_TUNNEL_ENDS[0].y * PM_TILE_SIZE;
    this.pos[1] = (PM_TUNNEL_ENDS[0].x + 1) * PM_TILE_SIZE;
  }

  // Entering the pen if the ghosts just died.
  if (this.mode == PM_GHOST_MODE_EYES &&
      this.pos[0] == PM_EXIT_PEN_POS[0] &&
      this.pos[1] == PM_EXIT_PEN_POS[1]) {
    this.changeMode(PM_GHOST_MODE_REENTERING_PEN);
  }

  // Eating fruit if you're Pac-Man.
  if (!this.ghost && (this.pos[0] == PM_FRUIT_POS[0]) &&
      ((this.pos[1] == PM_FRUIT_POS[1]) ||
       (this.pos[1] == PM_FRUIT_POS[1] + PM_TILE_SIZE))) {
    pacMan.eatFruit(this.id);
  }
};

/**
 * Does whatever's necessary in the middle of the tile -- mainly, change
 * directions if it's an intersection.
 */
PacManActor.prototype.middleOfATile = function() {
  // Check whether the tile is not a special tile (fruit, tunnel, etc.)
  // that requires extra action.
  this.checkSpecialTiles();

  // Ghosts figure out their next move a bit in advance.
  if (this.ghost) {
    this.figureOutNextDirection(false);
  }

  var tile = pacMan.playfield[this.pos[0]][this.pos[1]];

  if (tile.intersection) {
    if (this.nextDir && (this.nextDir & tile.allowedDir)) {
      // We can turn.
      if (this.dir != PM_DIR_NONE) {
        this.lastActiveDir = this.dir;
      }
      this.dir = this.nextDir;
      this.nextDir = PM_DIR_NONE;

      // Include the position changes gathered by cornering.
      if (!this.ghost) {
        this.pos[0] += this.posDelta[0];
        this.pos[1] += this.posDelta[1];
        this.posDelta = [0, 0];
      }
    } else if ((this.dir & tile.allowedDir) == PM_DIR_NONE) {
      // We cannot turn. (This should never happen for a ghost.)

      if (this.dir != PM_DIR_NONE) {
        this.lastActiveDir = this.dir;
      }
      this.dir = PM_DIR_NONE;
      this.nextDir = PM_DIR_NONE;
      this.changeCurrentSpeed(PM_SPEED_FULL);
    }
  }
};

/**
 * React to the new position: perhaps it's the new tile, perhaps it's the
 * middle of the tile, perhaps cornering should be covered...
 */
PacManActor.prototype.checkTheNewPixel = function() {
  var y = this.pos[0] / PM_TILE_SIZE;
  var x = this.pos[1] / PM_TILE_SIZE;

  var tilePos = [Math.round(y) * PM_TILE_SIZE, Math.round(x) * PM_TILE_SIZE];

  if (tilePos[0] != this.tilePos[0] || tilePos[1] != this.tilePos[1]) {
    this.enterNewTile(tilePos);
  } else {
    var floorPos = [Math.floor(y) * PM_TILE_SIZE, Math.floor(x) * PM_TILE_SIZE];
    if (this.pos[1] == floorPos[1] && this.pos[0] == floorPos[0]) {
      this.middleOfATile();
    }
  }

  if (!this.ghost && this.nextDir &&
      pacMan.playfield[tilePos[0]][tilePos[1]].intersection &&
      (this.nextDir & pacMan.playfield[tilePos[0]][tilePos[1]].allowedDir)) {
    this.handleCornering();
  }
};

/**
 * Each ghost has a target position that determines where it's heading.
 * It could be a tile outside a screen in scatter mode (so that the ghost
 * is just wandering around, never to reach it); a Pac-Man tile or a tile
 * close to Pac-Man in chase mode; a pen if the ghost died, etc.
 */
PacManActor.prototype.updateTargetPosition = function() {
  // When Blinky becomes Cruise Elroy, it always follows Pac-Man, even in
  // scatter mode.
  if (this.id == pacMan.playerCount &&
      pacMan.dotsRemaining < pacMan.levels.elroyDotsLeftPart1 &&
      this.mode == PM_GHOST_MODE_SCATTER &&
      (!pacMan.lostLifeOnThisLevel ||
       pacMan.actors[pacMan.playerCount + 3].mode != PM_GHOST_MODE_IN_PEN)) {
    var player = pacMan.actors[this.targetPlayerId];
    this.targetPos = [player.tilePos[0], player.tilePos[1]];
  } else if (this.ghost && this.mode == PM_GHOST_MODE_CHASE) {
    var player = pacMan.actors[this.targetPlayerId];
    switch (this.id) {
      // Blinky always follows the player.
      case pacMan.playerCount:
        this.targetPos = [player.tilePos[0], player.tilePos[1]];
        break;

      // Pinky follows a tile ahead of player.
      case pacMan.playerCount + 1:
        this.targetPos = [player.tilePos[0], player.tilePos[1]];
        var movement = PM_MOVEMENTS[player.dir];
        this.targetPos[movement.axis] +=
            4 * PM_TILE_SIZE * movement.increment;

        // Recreating the original Pac-Man bug, in which UP = UP+LEFT
        if (player.dir == PM_DIR_UP) {
          this.targetPos[1] -= 4 * PM_TILE_SIZE;
        }
        break;

      // Inky uses a convoluted scheme averaging Blinky's position and
      // an offset tile.
      case pacMan.playerCount + 2:
        var blinky = pacMan.actors[pacMan.playerCount];

        var offsetPos = [player.tilePos[0], player.tilePos[1]];
        var movement = PM_MOVEMENTS[player.dir];
        offsetPos[movement.axis] +=
            2 * PM_TILE_SIZE * movement.increment;

        // Recreating the original Pac-Man bug, in which UP = UP+LEFT
        if (player.dir == PM_DIR_UP) {
          offsetPos[1] -= 2 * PM_TILE_SIZE;
        }

        this.targetPos[0] = offsetPos[0] * 2 - blinky.tilePos[0];
        this.targetPos[1] = offsetPos[1] * 2 - blinky.tilePos[1];
        break;

      // Clyde uses Pac-Man's position if further away, scatter position
      // if close.
      case pacMan.playerCount + 3:
        var distance = pacMan.getDistance(player.tilePos, this.tilePos);

        if (distance > (8 * PM_TILE_SIZE)) {
          this.targetPos = [player.tilePos[0], player.tilePos[1]];
        } else {
          this.targetPos = this.scatterPos;
        }
        break;
    }
  }
  
  if (pacMan.debugTargetTiles) {
    var el = document.getElementById('debug-target-' + (this.id - pacMan.playerCount));

    if (el) {
      var x1 = pacMan.getPlayfieldX(this.tilePos[1]);
      var y1 = pacMan.getPlayfieldY(this.tilePos[0]);
    
      var x2 = pacMan.getPlayfieldX(this.targetPos[1]);
      var y2 = pacMan.getPlayfieldY(this.targetPos[0]);
  
      el.style.left = x2 + 'px';
      el.style.top = y2 + 'px';
    
      var el = document.getElementById('debug-target-' + (this.id - pacMan.playerCount) + '-line');
        
      var dx = (x2 - x1);
      var dy = (y2 - y1);

      var size = Math.sqrt(dx * dx + dy * dy);

      var angle = Math.atan2(dy, dx);
      angle = angle * 180 / Math.PI;

      el.style.width = size + 'px';
      el.style.left = x1 + 'px';
      el.style.top = y1 + 'px';
      el.style.webkitTransform = 'rotate(' + angle + 'deg)'; 
    }
  }
};

/**
 * If the actor (ghost) is following a routine, proceed to the next move
 * in that routine.
 */
PacManActor.prototype.nextRoutineMove = function() {
  this.routineMoveId++;
  if (this.routineMoveId == PM_ROUTINES[this.routineToFollow].length) {
    if (this.mode == PM_GHOST_MODE_IN_PEN && this.freeToLeavePen &&
        !pacMan.ghostExitingPenNow) {
      if (this.eatenInThisFrightMode) {
        this.changeMode(PM_GHOST_MODE_REEXITING_PEN);
      } else {
        this.changeMode(PM_GHOST_MODE_EXITING_PEN);
      }
      return;
    } else if (this.mode == PM_GHOST_MODE_EXITING_PEN ||
        this.mode == PM_GHOST_MODE_REEXITING_PEN) {
      this.pos = [PM_EXIT_PEN_POS[0], PM_EXIT_PEN_POS[1] + PM_TILE_SIZE / 2];

      // The direction in which the ghost exits the pen depends on whether
      // the main ghost mode changed during the ghost's stay in the pen.
      if (this.modeChangedWhileInPen) {
        this.dir = PM_DIR_RIGHT;
      } else {
        this.dir = PM_DIR_LEFT;
      }
      var mode = pacMan.mainGhostMode;
      if (this.mode == PM_GHOST_MODE_REEXITING_PEN &&
          mode == PM_GHOST_MODE_FRIGHT) {
        mode = pacMan.lastMainGhostMode;
      }
      this.changeMode(mode);
      return;
    } else if (this.mode == PM_GHOST_MODE_REENTERING_PEN) {
      // Blinky never stays in the pen and exits straight away.
      if ((this.id == pacMan.playerCount) || this.freeToLeavePen) {
        this.changeMode(PM_GHOST_MODE_REEXITING_PEN);
      } else {
        this.eatenInThisFrightMode = true;
        this.changeMode(PM_GHOST_MODE_IN_PEN);
      }
      return;
    } else {
      this.routineMoveId = 0;
    }
  }

  var routine = PM_ROUTINES[this.routineToFollow][this.routineMoveId];
  this.pos[0] = routine.y * PM_TILE_SIZE;
  this.pos[1] = routine.x * PM_TILE_SIZE;
  this.dir = routine.dir;
  this.physicalSpeed = 0;
  this.speedIntervals = pacMan.getSpeedIntervals(routine.speed);
  this.proceedToNextRoutineMove = false;
  this.updateSprite();
};

/**
 * Does another little step in the routine.
 */
PacManActor.prototype.advanceRoutine = function() {
  var routine = PM_ROUTINES[this.routineToFollow][this.routineMoveId];
  if (!routine) {
    return;
  }

  // Actors move with different speeds. Instead of handling fractional
  // positions, we just move them at some frames, but not the others.
  // (Actor with half speed will move every other frame.)
  if (this.speedIntervals[pacMan.intervalTime]) {
    var movement = PM_MOVEMENTS[this.dir];
    this.pos[movement.axis] += movement.increment;

    // Checking whether this particular routine move has ended.
    switch (this.dir) {
      case PM_DIR_UP:
      case PM_DIR_LEFT:
        if (this.pos[movement.axis] < routine.dest * PM_TILE_SIZE) {
          this.pos[movement.axis] = routine.dest * PM_TILE_SIZE;
          this.proceedToNextRoutineMove = true;
        }
        break;
      case PM_DIR_DOWN:
      case PM_DIR_RIGHT:
        if (this.pos[movement.axis] > routine.dest * PM_TILE_SIZE) {
          this.pos[movement.axis] = routine.dest * PM_TILE_SIZE;
          this.proceedToNextRoutineMove = true;
        }
        break;
    }

    this.updateSprite();
  }
};

/**
 * Follow the routine.
 */
PacManActor.prototype.followRoutine = function() {
  if (this.routineMoveId == -1 || this.proceedToNextRoutineMove) {
    this.nextRoutineMove();
  }

  this.advanceRoutine();
};

/**
 * Update the physical speed of the actor.
 */
PacManActor.prototype.updatePhysicalSpeed = function() {
  switch (this.currentSpeed) {
    case PM_SPEED_FULL:
      // We use Cruise Elroy speed for Blinky.
      if (this.id == pacMan.playerCount &&
          (this.mode == PM_GHOST_MODE_SCATTER ||
           this.mode == PM_GHOST_MODE_CHASE)) {
        var newPhysicalSpeed = pacMan.cruiseElroySpeed;
      } else {
        var newPhysicalSpeed = this.fullSpeed;
      }
      break;
    case PM_SPEED_DOT_EATING:
      var newPhysicalSpeed = this.dotEatingSpeed;
      break;
    case PM_SPEED_TUNNEL:
      var newPhysicalSpeed = this.tunnelSpeed;
      break;
  }

  // Recalculate speed intervals if this is a new speed.
  if (this.physicalSpeed != newPhysicalSpeed) {
    this.physicalSpeed = newPhysicalSpeed;
    this.speedIntervals = pacMan.getSpeedIntervals(this.physicalSpeed);
  }
};

/**
 * Change the current (logical) speed of the actor.
 * @param {number} speed New speed.
 */
PacManActor.prototype.changeCurrentSpeed = function(speed) {
  this.currentSpeed = speed;
  this.updatePhysicalSpeed();
};

/**
 * Advance the actor by one pixel in a given direction if necessary
 */
PacManActor.prototype.advance = function() {
  if (this.dir) {
    // Actors move with different speeds. Instead of handling fractional
    // positions, we just move them at some frames, but not the others.
    // (Actor with half speed will move every other frame.)
    if (this.speedIntervals[pacMan.intervalTime]) {

      var movement = PM_MOVEMENTS[this.dir];
      this.pos[movement.axis] += movement.increment;

      this.checkTheNewPixel();
      this.updateSprite();
    }
  }
};

/**
 * Moves the actor. This varies depending of whether the actor follows the
 * routine or is free to move.
 */
PacManActor.prototype.move = function() {
  // We move the actors only during regular gameplay. An exception is that
  // ghost eyes move when another ghost is being eaten.
  if (pacMan.gameplayMode == PM_GAMEPLAY_GAME_IN_PROGRESS ||
      (this.ghost && (pacMan.gameplayMode == PM_GAMEPLAY_GHOST_BEING_EATEN) &&
       (this.mode == PM_GHOST_MODE_EYES ||
        this.mode == PM_GHOST_MODE_REENTERING_PEN))) {

    if (this.requestedDir != PM_DIR_NONE) {
      this.processRequestedDirection(this.requestedDir);

      this.requestedDir = PM_DIR_NONE;
    }

    if (this.followingRoutine) {
      this.followRoutine();

      // When the ghost turns into eyes, it moves faster than 1px per 90fps.
      // Instead of supporting 180fps (too slow for IE), we just
      // special-case it and move it twice per frame.
      if (this.mode == PM_GHOST_MODE_REENTERING_PEN) {
        this.followRoutine();
      }
    } else {
      this.advance();
      // When the ghost turns into eyes, it moves faster than 1px per 90fps.
      // Instead of supporting 180fps (too slow for IE), we just
      // special-case it and move it twice per frame.
      if (this.mode == PM_GHOST_MODE_EYES) {
        this.advance();
      }
    }
  }
};

/**
 * Update actor sprite position on the screen.
 */
PacManActor.prototype.updatePosition = function() {
  // posDelta accounts for cornering.
  var x = pacMan.getPlayfieldX(this.pos[1] + this.posDelta[1]);
  var y = pacMan.getPlayfieldY(this.pos[0] + this.posDelta[0]);

  // We only request change to the sprite when it's actually different
  // than last time.
  if ((this.elPos[0] != y) || (this.elPos[1] != x)) {
    this.elPos[0] = y;
    this.elPos[1] = x;

    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';    
    //this.el.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)';
    
    if (this.id == 0 && pacMan.mode == PM_POSITION_FOLLOWS_PAC_MAN) {
      pacMan.canvasEl.style.left = -x + 'px';
      pacMan.canvasEl.style.top = (-y + 40) + 'px';
    }
  }
};

/**
 * Get a proper position of player (Pac-Man, Ms. Pac-Man) sprite depending
 * on the current state, mode, etc.
 * @return {Array} X and Y position of the sprite.
 */
PacManActor.prototype.getPlayerSprite = function() {
  var x = 0;
  var y = 0;

  var dir = this.dir;
  if (dir == 0) {
    dir = this.lastActiveDir;
  }

  if ((pacMan.gameplayMode == PM_GAMEPLAY_GHOST_BEING_EATEN) &&
      (this.id == pacMan.playerEatingGhostId)) {
    // Whoever ate the ghost disappears when the ghost is being eaten (and
    // the score is being shown).
    x = 3;
    y = 0;
  } else if ((pacMan.gameplayMode == PM_GAMEPLAY_LEVEL_COMPLETE_PART_1 ||
      pacMan.gameplayMode == PM_GAMEPLAY_LEVEL_COMPLETE_PART_2) &&
      (this.id == PM_PACMAN)) {
    // Pac-Man becomes a circle when the level is completed.
    x = 2;
    y = 0;
  } else if (pacMan.gameplayMode == PM_GAMEPLAY_READY_PART_1 ||
             pacMan.gameplayMode == PM_GAMEPLAY_READY_PART_2 ||
             pacMan.gameplayMode == PM_GAMEPLAY_FAST_READY_PART_2) {
    // Pac-Man becomes a circle and Ms. Pac-Man looks left when the level
    // is about to start.
    if (this.id == PM_PACMAN) {
      x = 2;
      y = 0;
    } else {
      x = 4;
      y = 0;
    }
  } else if (pacMan.gameplayMode == PM_GAMEPLAY_PLAYER_DYING_PART_2) {
    // Handle the dying animation, which is different for Pac-Man and for
    // Ms. Pac-Man.
    if (this.id == pacMan.playerDyingId) {
      var time = 20 - Math.floor(pacMan.gameplayModeTime /
          pacMan.timing[PM_TIMING_PLAYER_DYING_PART_2] * 21);
      if (this.id == PM_PACMAN) { // Pac-Man
        var x = time - 1;
        switch (x) {
          case -1:
            x = 0;
            break;
          case 11:
            x = 10;
            break;
          case 12: case 13: case 14: case 15: case 16:
          case 17: case 18: case 19: case 20:
            x = 11;
            break;
        }
        y = 12;
      } else { // Ms. Pac-Man.
        switch (time) {
          case 0: case 1: case 2: case 6: case 10:
            x = 4; y = 3;
            break;
          case 3: case 7: case 11:
            x = 4; y = 0;
            break;
          case 4: case 8: case 12: case 13: case 14: case 15:
          case 16: case 17: case 18: case 19: case 20:
            x = 4; y = 2;
            break;
          case 5: case 9:
            x = 4; y = 1;
            break;
        }
      }
    } else {
      x = 3;
      y = 0;
    }
  } else if (this.el.id == 'pcm-bpcm') {
    // Big Pac-Man using during the cutscene.
    x = 14;
    y = 0;

    var cor = Math.floor(pacMan.globalTime * 0.2) % 4;
    if (cor == 3) {
      cor = 1;
    }
    y += 2 * cor;
  } else {
    switch (dir) {
      case PM_DIR_LEFT: y = 0; break;
      case PM_DIR_RIGHT: y = 1; break;
      case PM_DIR_UP: y = 2; break;
      case PM_DIR_DOWN: y = 3; break;
    }

    // This makes Pac-Man mouth open/close.
    if (pacMan.gameplayMode != PM_GAMEPLAY_PLAYER_DYING_PART_1) {
      x = Math.floor(pacMan.globalTime * 0.3) % 4;
    }

    // We don't repeat sprites in the sprite png, so here we need to
    // make some corrections for those repeating ones.
    if ((x == 3) && (this.dir == PM_DIR_NONE)) {
      x = 0;
    }
    if ((x == 2) && (this.id == PM_PACMAN)) {
      x = 0;
    }
    if (x == 3) {
      x = 2;
      if (this.id == PM_PACMAN) {
        y = 0;
      }
    }

    if (this.id == PM_MS_PACMAN) {
      x += 4;
    }
  }
  return [y, x];
};

/**
 * Get a proper position of a ghost sprite depending
 * on the current state, mode, etc.
 * @return {Array} X and Y position of the sprite.
 */
PacManActor.prototype.getGhostSprite = function() {
  var x = 0;
  var y = 0;

  if ((pacMan.gameplayMode == PM_GAMEPLAY_LEVEL_COMPLETE_PART_2) ||
      (pacMan.gameplayMode == PM_GAMEPLAY_READY_PART_1) ||
      (pacMan.gameplayMode == PM_GAMEPLAY_PLAYER_DYING_PART_2)) {
    // Ghosts disappear when game starts, level ends, or Pac-Man is dying.
    var x = 3;
    var y = 0;
  } else if (pacMan.gameplayMode == PM_GAMEPLAY_GHOST_BEING_EATEN &&
      this.id == pacMan.ghostBeingEatenId) {
    // A ghost being eaten becomes a score indicator (200, 400, 800, 1600)
    // for a brief moment.
    switch (pacMan.modeScoreMultiplier) {
      case 2: x = 0; break;
      case 4: x = 1; break;
      case 8: x = 2; break;
      case 16: x = 3; break;
    }
    y = 11;

    // Temporary class change to make sure the score digits have higher
    // z-index to be positioned above any ghost that might occupy the same
    // tile.
    this.el.className = 'pcm-ac pcm-n';
  } else if (this.mode == PM_GHOST_MODE_FRIGHT ||
             ((this.mode == PM_GHOST_MODE_IN_PEN ||
               this.mode == PM_GHOST_MODE_EXITING_PEN) &&
              (pacMan.mainGhostMode == PM_GHOST_MODE_FRIGHT) &&
              !this.eatenInThisFrightMode)) {
    // Ghosts turning blue.
    x = 0;
    y = 8;

    // Ghosts blink white before the end of fright mode.
    if ((pacMan.frightModeTime <
         pacMan.levels.frightTotalTime - pacMan.levels.frightTime) &&
        (Math.floor(pacMan.frightModeTime /
                    pacMan.timing[PM_TIMING_FRIGHT_BLINK]) % 2) == 0) {
      x += 2;
    }
    // This makes ghost tails wiggle.
    x += Math.floor(pacMan.globalTime / 16) % 2;
  } else if (this.mode == PM_GHOST_MODE_EYES ||
             this.mode == PM_GHOST_MODE_REENTERING_PEN) {
    // Ghosts become just eyes when traveling to the pen after being eaten.
    var dir = this.nextDir;
    if (!dir) {
      dir = this.dir;
    }
    switch (dir) {
      case PM_DIR_LEFT: x = 2; break;
      case PM_DIR_RIGHT: x = 3; break;
      case PM_DIR_UP: x = 0; break;
      case PM_DIR_DOWN: x = 1; break;
    }
    y = 10;
  } else if (this.el.id == 'pcm-ghin') {
    // Injured (repaired) ghost
    x = 6;
    y = 8;
    x += Math.floor(pacMan.globalTime / 16) % 2;
  } else if (this.el.id == 'pcm-gbug') {
    // Injured (repaired) ghost
    x = 6;
    y = 9;
    y += Math.floor(pacMan.globalTime / 16) % 2;
  } else if (this.el.id == 'pcm-ghfa') {
    // Ghost falling apart
    if (pacMan.cutsceneSequenceId == 3) {
      x = 6;
    } else {
      x = 7;
    }
    y = 11;
  } else if (this.el.id == 'pcm-stck') {
    // Stick
    if (pacMan.cutsceneSequenceId == 1) {
      if (pacMan.cutsceneTime > 60) {
        x = 1;
      } else if (pacMan.cutsceneTime > 45) {
        x = 2;
      } else {
        x = 3;
      }
    } else if (pacMan.cutsceneSequenceId == 2) {
      x = 3;
    } else if (pacMan.cutsceneSequenceId == 3 ||
               pacMan.cutsceneSequenceId == 4) {
      x = 4;
    } else {
      x = 0;
    }
    y = 13;
  } else {
    // We're using next direction, not current direction, so that ghost's
    // eyes will change directions a bit before its "body" will. We make
    // an exception for the tunnel, though, so ghosts don't look off screen.
    var dir = this.nextDir;
    if (!dir ||
      pacMan.playfield[this.tilePos[0]][this.tilePos[1]].type ==
      PM_PATH_TUNNEL) {
      dir = this.dir;
    }
    switch (dir) {
      case PM_DIR_LEFT: x = 4; break;
      case PM_DIR_RIGHT: x = 6; break;
      case PM_DIR_UP: x = 0; break;
      case PM_DIR_DOWN: x = 2; break;
    }

    y = 4 + this.id - pacMan.playerCount;

    // This makes ghost tails wiggle.
    if ((this.speed > 0) || (pacMan.gameplayMode != PM_GAMEPLAY_CUTSCENE)) {
      x += Math.floor(pacMan.globalTime / 16) % 2;
    }
  }

  return [y, x];
};

/**
 * Update a given actor's sprite (choose a proper graphic for a given
 * position/mode/state of the actor).
 */
PacManActor.prototype.updateSprite = function() {
  this.updatePosition();

  // Position within the 16px grid of the sprite png.
  var pos = [0, 0];

  // In these modes, actors disappear...
  if ((pacMan.gameplayMode == PM_GAMEPLAY_GAMEOVER) ||
      (pacMan.gameplayMode == PM_GAMEPLAY_INFINITE_GAMEOVER)) {
    // Empty square.
    pos = [0, 3];
  } else {
    if (this.ghost) {
      pos = this.getGhostSprite();
    } else {
      pos = this.getPlayerSprite();
    }
  }

  // We only request change to the sprite when it's actually different
  // than last time.
  if ((this.elBackgroundPos[0] != pos[0]) ||
      (this.elBackgroundPos[1] != pos[1])) {
    this.elBackgroundPos[0] = pos[0];
    this.elBackgroundPos[1] = pos[1];

    pos[0] *= 16;
    pos[1] *= 16;

    pacMan.changeElementBkPos(this.el, pos[1], pos[0], true);
  }
};


/* PACMAN HELPER FUNCTIONS */

/**
 * Send a random number from 0 to 1. The reason we're not using Math.random()
 * is that you can't seed it reliably on all the browsers -- and we need
 * random numbers to be repeatable between game plays too allow for patterns
 * etc., and also a consistent kill screen that's procedurally generated.
 * @return {number} Random number from 0 to 1.
 */
pacMan.rand = function() {
  var t32 = 0x100000000;
  var constant = 134775813;
  var x = (constant * pacMan.randSeed + 1);
  return (pacMan.randSeed = x % t32) / t32;
};

/**
 * Seeds the random generator.
 * @param {number} seed Seed number.
 */
pacMan.seed = function(seed) {
  pacMan.randSeed = seed;
};

/**
 * Calculates the difference between two positions.
 * @param {Array} firstPos First position.
 * @param {Array} secondPos Second position.
 * @return {number} Distance.
 */
pacMan.getDistance = function(firstPos, secondPos) {
  return Math.sqrt((secondPos[1] - firstPos[1]) *
                   (secondPos[1] - firstPos[1]) +
                   (secondPos[0] - firstPos[0]) *
                   (secondPos[0] - firstPos[0]));
};

/**
 * Returns a corrected X position so that 0 is in the upper-left corner
 * of the playfield.
 * @param {number} x X position.
 * @return {number} Corrected X position.
 */
pacMan.getPlayfieldX = function(x) {
  return x + PM_PLAYFIELD_OFFSET_X;
};

/**
 * Returns a corrected Y position so that 0 is in the upper-left corner
 * of the playfield.
 * @param {number} y Y position.
 * @return {number} Corrected Y position.
 */
pacMan.getPlayfieldY = function(y) {
  return y + PM_PLAYFIELD_OFFSET_Y;
};

/**
 * Corrects the sprite position from a 8px grid to a 10px grid.
 * @param {number} pos Position (x or y).
 * @return {number} Corrected position.
 */
pacMan.getCorrectedSpritePos = function(pos) {
  return pos / 8 * 10 + 2;
};

/**
 * Returns a DOM element ID for a dot (pcm-dY-X).
 * @param {number} y Y position.
 * @param {number} x x position.
 * @return {string} DOM element id.
 */
pacMan.getDotElementId = function(y, x) {
  return 'pcm-d' + y + '-' + x;
};

/**
 * Shows or hides a DOM element.
 * @param {string} id DOM element id.
 * @param {boolean} show Whether to show it or not.
 */
pacMan.showElementById = function(id, show) {
  var el = document.getElementById(id);

  if (el) {
    el.style.visibility = show ? 'visible' : 'hidden';
  }
};

/**
 * Gets an absolute page position of a given DOM element.
 * @param {Element} el DOM element.
 * @return {Array} pos Position on the page (y and x).
 */
pacMan.getAbsoluteElPos = function(el) {
  var pos = [0, 0];

  do {
    pos[0] += el.offsetTop;
    pos[1] += el.offsetLeft;
  } while (el = el.offsetParent);

  return pos;
};

/**
 * Prepares a DOM element to serve as a sprite.
 * @param {Element} el DOM element.
 * @param {number} x Initial X position.
 * @param {number} y Initial Y position.
 */
pacMan.prepareElement = function(el, x, y) {
  x = pacMan.getCorrectedSpritePos(parseInt(x, 10));
  y = pacMan.getCorrectedSpritePos(parseInt(y, 10));

  // For all the browsers coming from a good home, we are doing it via CSS.
  if (pacMan.useCss) {
    el.style.backgroundImage = 'url(files/sprite.png)';
    el.style.backgroundPosition = (-x) + 'px ' + (-y) + 'px';
    el.style.backgroundRepeat = 'no-repeat';
  } else {
    // For Internet Explorer with CSS background reloading bug, we put
    // an image inside an element, and move it around.
    
    el.style.overflow = 'hidden';

    var style = 'display: block; position: relative; ' +
                'left: ' + (-x) + 'px; top: ' + (-y) + 'px';
    el.innerHTML = '<img style="' + style +
                   '" src="files/sprite.png">';
  }
};

/**
 * Changes a background of a given DOM element to show a proper sprite.
 * This is done in two different fashions depending on whether we do it
 * via CSS, or by having an image inline (for IE)
 * @param {Element} el DOM element.
 * @param {number} x X position.
 * @param {number} y Y position.
 * @param {boolean} correction Whether to correct for the new sprite grid.
 */
pacMan.changeElementBkPos = function(el, x, y, correction) {
  if (correction) {
    x = pacMan.getCorrectedSpritePos(x);
    y = pacMan.getCorrectedSpritePos(y);
  }

  if (pacMan.useCss) {
    el.style.backgroundPosition = (-x) + 'px ' + (-y) + 'px';
  } else {
    if (el.childNodes[0]) {
      el.childNodes[0].style.left = (-x) + 'px';
      el.childNodes[0].style.top = (-y) + 'px';
    }
  }
};


/* PACMAN GAME FUNCTIONS */

/**
 * Determining the dimensions of the playfield based on the paths.
 */
pacMan.determinePlayfieldDimensions = function() {
  pacMan.playfieldWidth = 0;
  pacMan.playfieldHeight = 0;

  for (var i in PM_PATHS) {
    var path = PM_PATHS[i];
    if (path.w) {
      // Horizontal path
      var curWidth = path.x + path.w - 1;
      if (curWidth > pacMan.playfieldWidth) {
        pacMan.playfieldWidth = curWidth;
      }
    } else {
      // Vertical path
      var curHeight = path.y + path.h - 1;
      if (curHeight > pacMan.playfieldHeight) {
        pacMan.playfieldHeight = curHeight;
      }
    }
  }
};

/**
 * Prepares the playfield by creating the necessary tile array elements.
 */
pacMan.preparePlayfield = function() {
  pacMan.playfield = [];
  for (var y = 0; y <= pacMan.playfieldHeight + 1; y++) {
    pacMan.playfield[y * PM_TILE_SIZE] = [];

    // We are starting at -2 to accomodate the horizontal tunnel
    for (var x = -2; x <= pacMan.playfieldWidth + 1; x++) {
      pacMan.playfield[y * PM_TILE_SIZE][x * PM_TILE_SIZE] = {
        path: 0,
        dot: PM_DOT_TYPE_NONE,
        intersection: 0
      }
    }
  }
};

/**
 * Converts all the playfield paths into separate tiles, figures out where
 * the intersections are, etc.
 */
pacMan.preparePaths = function() {
  for (var i in PM_PATHS) {
    var path = PM_PATHS[i];
    var type = path.type;

    if (path.w) {
      var y = path.y * PM_TILE_SIZE;

      for (var x = path.x * PM_TILE_SIZE;
           x <= (path.x + path.w - 1) * PM_TILE_SIZE; x += PM_TILE_SIZE) {
        pacMan.playfield[y][x].path = true;
        // Check for dots, which are initialized in preparePlayfield.
        if (pacMan.playfield[y][x].dot == PM_DOT_TYPE_NONE) {
          pacMan.playfield[y][x].dot = PM_DOT_TYPE_DOT;
          pacMan.dotsRemaining++;
        }
        if (!type || (x != (path.x * PM_TILE_SIZE) &&
            x != ((path.x + path.w - 1) * PM_TILE_SIZE))) {
          pacMan.playfield[y][x].type = type;
        } else {
          pacMan.playfield[y][x].type = PM_PATH_NORMAL;
        }
      }
      pacMan.playfield[y][path.x * PM_TILE_SIZE].intersection = true;
      pacMan.playfield[y][(path.x + path.w - 1) * PM_TILE_SIZE].
          intersection = true;
    } else {
      var x = path.x * PM_TILE_SIZE;

      for (var y = path.y * PM_TILE_SIZE;
           y <= (path.y + path.h - 1) * PM_TILE_SIZE; y += PM_TILE_SIZE) {
        if (pacMan.playfield[y][x].path) {
          pacMan.playfield[y][x].intersection = true;
        }
        pacMan.playfield[y][x].path = true;
        if (pacMan.playfield[y][x].dot == PM_DOT_TYPE_NONE) {
          pacMan.playfield[y][x].dot = PM_DOT_TYPE_DOT;
          pacMan.dotsRemaining++;
        }
        if (!type || (y != (path.y * PM_TILE_SIZE) &&
            y != ((path.y + path.h - 1) * PM_TILE_SIZE))) {
          pacMan.playfield[y][x].type = type;
        } else {
          pacMan.playfield[y][x].type = PM_PATH_NORMAL;
        }
      }
      pacMan.playfield[path.y * PM_TILE_SIZE][x].intersection = true;
      pacMan.playfield[(path.y + path.h - 1) * PM_TILE_SIZE][x].
          intersection = true;
    }
  }

  for (var i in PM_NO_DOT_PATHS) {
    if (PM_NO_DOT_PATHS[i].w) {
      for (var x = PM_NO_DOT_PATHS[i].x * PM_TILE_SIZE;
           x <= (PM_NO_DOT_PATHS[i].x + PM_NO_DOT_PATHS[i].w - 1) *
                 PM_TILE_SIZE; x += PM_TILE_SIZE) {
        pacMan.playfield[PM_NO_DOT_PATHS[i].y * PM_TILE_SIZE][x].dot =
            PM_DOT_TYPE_NONE;
        pacMan.dotsRemaining--;
      }
    } else {
      for (var y = PM_NO_DOT_PATHS[i].y * PM_TILE_SIZE;
           y <= (PM_NO_DOT_PATHS[i].y + PM_NO_DOT_PATHS[i].h - 1) *
                 PM_TILE_SIZE; y += PM_TILE_SIZE) {
        pacMan.playfield[y][PM_NO_DOT_PATHS[i].x * PM_TILE_SIZE].dot =
            PM_DOT_TYPE_NONE;
        pacMan.dotsRemaining--;
      }
    }
  }
};

/**
 * Goes through all the paths and figures out which directions are available
 * at each tile.
 */
pacMan.prepareAllowedDirections = function() {
  for (var y = 1 * PM_TILE_SIZE; y <= pacMan.playfieldHeight * PM_TILE_SIZE;
       y += PM_TILE_SIZE) {
    for (var x = 1 * PM_TILE_SIZE; x <= pacMan.playfieldWidth * PM_TILE_SIZE;
         x += PM_TILE_SIZE) {
      pacMan.playfield[y][x].allowedDir = 0;

      if (pacMan.playfield[y - PM_TILE_SIZE][x].path) {
        pacMan.playfield[y][x].allowedDir += PM_DIR_UP;
      }
      if (pacMan.playfield[y + PM_TILE_SIZE][x].path) {
        pacMan.playfield[y][x].allowedDir += PM_DIR_DOWN;
      }
      if (pacMan.playfield[y][x - PM_TILE_SIZE].path) {
        pacMan.playfield[y][x].allowedDir += PM_DIR_LEFT;
      }
      if (pacMan.playfield[y][x + PM_TILE_SIZE].path) {
        pacMan.playfield[y][x].allowedDir += PM_DIR_RIGHT;
      }
    }
  }
};

/**
 * Creates DOM elements for dots.
 */
pacMan.createDotElements = function() {
  for (var y = 1 * PM_TILE_SIZE; y <= pacMan.playfieldHeight * PM_TILE_SIZE;
       y += PM_TILE_SIZE) {
    for (var x = 1 * PM_TILE_SIZE; x <= pacMan.playfieldWidth * PM_TILE_SIZE;
         x += PM_TILE_SIZE) {
      if (pacMan.playfield[y][x].dot) {
        var el = document.createElement('div');
        el.className = 'pcm-d';

        el.id = pacMan.getDotElementId(y, x);

        el.style.left = (x + PM_PLAYFIELD_OFFSET_X) + 'px';
        el.style.top = (y + PM_PLAYFIELD_OFFSET_Y) + 'px';

        pacMan.playfieldEl.appendChild(el);
      }
    }
  }
};

/**
 * Changes selected dot DOM elements to energizers (big dots).
 */
pacMan.createEnergizerElements = function() {
  for (var i in PM_ENERGIZERS) {
    var energizer = PM_ENERGIZERS[i];

    var id = pacMan.getDotElementId(energizer.y * PM_TILE_SIZE,
                                  energizer.x * PM_TILE_SIZE);
    document.getElementById(id).className = 'pcm-e';
    pacMan.prepareElement(document.getElementById(id), 0, 144);

    pacMan.playfield[energizer.y * PM_TILE_SIZE]
                    [energizer.x * PM_TILE_SIZE].dot = PM_DOT_TYPE_ENERGIZER;
  }
};

/**
 * Creates a fruit DOM element. The element is always there, it's just most
 * of the time it has transparent background and nothing else.
 */
pacMan.createFruitElement = function() {
  pacMan.fruitEl = document.createElement('div');
  pacMan.fruitEl.id = 'pcm-f';
  pacMan.fruitEl.style.left = (pacMan.getPlayfieldX(PM_FRUIT_POS[1])) + 'px';
  pacMan.fruitEl.style.top = (pacMan.getPlayfieldY(PM_FRUIT_POS[0])) + 'px';
  pacMan.prepareElement(pacMan.fruitEl, -32, -16);

  pacMan.playfieldEl.appendChild(pacMan.fruitEl);
};

/**
 * Create all "edible" playfield DOM elements: dots, energizers, fruit.
 */
pacMan.createPlayfieldElements = function() {
  // Door to the pen
  pacMan.doorEl = document.createElement('div');
  pacMan.doorEl.id = 'pcm-do';
  pacMan.doorEl.style.display = 'none';
  pacMan.playfieldEl.appendChild(pacMan.doorEl);

  pacMan.createDotElements();
  pacMan.createEnergizerElements();
  pacMan.createFruitElement();
};

/**
 * Create objects for all the actors.
 */
pacMan.createActors = function() {
  pacMan.actors = [];
  for (var id = 0; id < pacMan.playerCount + PM_GHOST_ACTOR_COUNT; id++) {
    pacMan.actors[id] = new PacManActor(id);

    if (id < pacMan.playerCount) {
      // Player
      pacMan.actors[id].ghost = false;
      pacMan.actors[id].mode = PM_PLAYER_MODE_MOVING;
    } else {
      // Non-player character, or... ghost
      pacMan.actors[id].ghost = true;
    }
  }
};

/**
 * Restarts all the actors.
 */
pacMan.restartActors = function() {
  for (var id in pacMan.actors) {
    pacMan.actors[id].restart();
  }
};

/**
 * Creates DOM elements for all the actors (Pac-Man, Ms. Pac-Man, ghosts).
 */
pacMan.createActorElements = function() {
  for (var id in pacMan.actors) {
    pacMan.actors[id].createElement();
  }
};

/**
 * Creates the DOM element for the playfield.
 */
pacMan.createPlayfield = function() {
  pacMan.playfieldEl = document.createElement('div');
  pacMan.playfieldEl.id = 'pcm-p';
  pacMan.canvasEl.appendChild(pacMan.playfieldEl);
};

/**
 * Resets the playfield in preparations for the new level.
 */
pacMan.resetPlayfield = function() {
  pacMan.dotsRemaining = 0;
  pacMan.dotsEaten = 0;

  pacMan.playfieldEl.innerHTML = '';
  pacMan.prepareElement(pacMan.playfieldEl, 256, 0);

  pacMan.determinePlayfieldDimensions();
  pacMan.preparePlayfield();
  pacMan.preparePaths();
  pacMan.prepareAllowedDirections();
  pacMan.createPlayfieldElements();
  pacMan.createActorElements();
};

pacMan.debugPause = function() {
  if (pacMan.mode != PM_FINAL) {
    pacMan.debugPaused = !pacMan.debugPaused;
    
    if (pacMan.debugPaused) {
      window.clearInterval(pacMan.tickTimer);
    } else {
      pacMan.initializeTickTimer();
    }
  }  
};

/**
 * Reacts to a key being pressed.
 * @param {number} keyCode Keyboard code for the key.
 * @return {boolean} Whether the key was processed and the natural browser
 *                   response to that key should be supressed.
 */
pacMan.keyPressed = function(keyCode) {
  var processed = false;


  switch (keyCode) {
    case PM_KEYCODE_LEFT:
      pacMan.actors[PM_PACMAN].requestedDir = PM_DIR_LEFT;
      processed = true;
      break;
    case PM_KEYCODE_UP:
      pacMan.actors[PM_PACMAN].requestedDir = PM_DIR_UP;
      processed = true;
      break;
    case PM_KEYCODE_RIGHT:
      pacMan.actors[PM_PACMAN].requestedDir = PM_DIR_RIGHT;
      processed = true;
      break;
    case PM_KEYCODE_DOWN:
      pacMan.actors[PM_PACMAN].requestedDir = PM_DIR_DOWN;
      processed = true;
      break;
    case PM_KEYCODE_A:
      if (pacMan.playerCount == 2) {
        pacMan.actors[PM_MS_PACMAN].requestedDir = PM_DIR_LEFT;
        processed = true;
      }
      break;
    case PM_KEYCODE_S:
      if (pacMan.playerCount == 2) {
        pacMan.actors[PM_MS_PACMAN].requestedDir = PM_DIR_DOWN;
        processed = true;
      }
      break;
    case PM_KEYCODE_D:
      if (pacMan.playerCount == 2) {
        pacMan.actors[PM_MS_PACMAN].requestedDir = PM_DIR_RIGHT;
        processed = true;
      }
      break;
    case PM_KEYCODE_W:
      if (pacMan.playerCount == 2) {
        pacMan.actors[PM_MS_PACMAN].requestedDir = PM_DIR_UP;
        processed = true;
      }
      break;
      
    case 52: // 4;
      pacMan.debugPause();
      break;
    
      
    case 49: // 1
      if (pacMan.mode != PM_FINAL) {
        pacMan.debugSlower = !pacMan.debugSlower;
        pacMan.initializeTickTimer();
      }
      break;
      
    case 50: // 2
      if (pacMan.mode != PM_FINAL) {
        pacMan.debugSprites++;
        pacMan.removeCssCodeByClassName('debug-sprites');
        switch (pacMan.debugSprites) {
          case 1:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #pcm-c img { display: none !important; }', 'debug-sprites');
            break;
          case 2:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; } #pcm-c img { display: none !important; }', 'debug-sprites');
            break;
          case 3:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; } #pcm-c img { display: none !important; } #actor0 img { display: block !important; }', 'debug-sprites');
            break;
          case 4:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; overflow: visible !important; } #pcm-c img { display: none !important; } #actor0 img { display: block !important; }', 'debug-sprites');
            break;
          case 5:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor1 { outline: 1px solid white; overflow: visible !important; } #pcm-c img { display: none !important; } #actor1 img { display: block !important; }', 'debug-sprites');
            break;
          case 6:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor2 { outline: 1px solid white; overflow: visible !important; } #pcm-c img { display: none !important; } #actor2 img { display: block !important; }', 'debug-sprites');
            break;
          case 7:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; overflow: visible !important; } #pcm-c img { display: none !important; } #actor0 img { display: block !important; }', 'debug-sprites');
            break;
          case 8:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); overflow: visible !important; } #actor0 { outline: 1px solid white; }', 'debug-sprites');
            break;
          case 9:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; overflow: visible !important; } #pcm-c img { display: none !important; } #actor0 img { display: block !important; }', 'debug-sprites');
            break;
          case 10:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; } #pcm-c img { display: none !important; } #actor0 img { display: block !important; }', 'debug-sprites');
            break;
          case 11:
            pacMan.addCssCode('#pcm-c * { outline: 1px solid rgba(127, 0, 0, 1); } #actor0 { outline: 1px solid white; }', 'debug-sprites');
            break;
          case 12:
            pacMan.debugSprites = 0;
            break;
        }
      }
      break;
      
    case 51: // 3
      if (pacMan.mode != PM_FINAL) {
        if (!pacMan.debugTargetTiles) {
          pacMan.debugTargetTiles = 5;
        } else {
          pacMan.debugTargetTiles = 0;
        }

/*
        pacMan.debugTargetTiles++;
        if (pacMan.debugTargetTiles == 6) {
          pacMan.debugTargetTiles = 0;
        }
*/
        for (var i = 0; i < 4; i++) {
          var el = document.getElementById('debug-target-' + i);
          if (el) {
            pacMan.playfieldEl.removeChild(el);
          }
          var el = document.getElementById('debug-target-' + i + '-line');
          if (el) {
            pacMan.playfieldEl.removeChild(el);
          }
        }
      
        if (pacMan.debugTargetTiles) {
          var colors = ['#ff0000', '#ff99cc', '#33ffff', '#ffcc33'];
        
          for (var i = 0; i < 4; i++) {
            if ((pacMan.debugTargetTiles == 5) || ((pacMan.debugTargetTiles - 1) == i)) {
          
              var el = document.createElement('div');
              el.style.position = 'absolute';
              el.style.background = colors[i];
              //el.style.opacity = .8;
              el.style.width = '8px';
              el.style.height = '8px';
              el.style.marginLeft = 0;
              el.style.marginTop = 0;
              el.style.zIndex = 5000;
              el.style.left = 0;
              el.style.top = 0;
        
              el.id = 'debug-target-' + i;        
              pacMan.playfieldEl.appendChild(el);

              var el = document.createElement('div');

              el.style.position = 'absolute';
              el.style.height = '1px';
              el.style.background = colors[i];
              el.style.marginLeft = '4px';
              el.style.marginTop = '4px';
              //el.style.opacity = .8;
              el.style.zIndex = 4999;
              el.style.webkitTransformOrigin = '0 0';

              el.id = 'debug-target-' + i + '-line';
              pacMan.playfieldEl.appendChild(el);

              this.actors[pacMan.playerCount + i].debugUpdateTargetLine();
            }
          }
        }
      }
      
      break;
  }
  return processed;
};

/**
 * An event handle for a key down event.
 * @param {Event} event Keyboard event.
 */
pacMan.handleKeyDown = function(event) {
  if (!event) {
    var event = window.event;
  }

  if (pacMan.keyPressed(event.keyCode)) {
    if (event.preventDefault) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.returnValue = false;
    }
  }
};

/**
 * Reacts to a click on a canvas. We support navigating Pac-Man by clicking
 * on which direction it should go.
 * @param {number} x Horizontal position on the page.
 * @param {number} y Vertical position on the page.
 */
pacMan.canvasClicked = function(x, y) {
  // Normalizing the click position
  var pos = pacMan.getAbsoluteElPos(pacMan.canvasEl);

  x -= pos[1] - PM_PLAYFIELD_OFFSET_X;
  y -= pos[0] - PM_PLAYFIELD_OFFSET_Y;

  // Pac-Man position
  var player = pacMan.actors[0];
  var playerX = pacMan.getPlayfieldX(player.pos[1] + player.posDelta[1]) +
                PM_TILE_SIZE * 2;
  var playerY = pacMan.getPlayfieldY(player.pos[0] + player.posDelta[0]) +
                PM_TILE_SIZE * 4;

  var dx = Math.abs(x - playerX);
  var dy = Math.abs(y - playerY);

  if ((dx > PM_CLICK_SENSITIVITY) && (dy < dx)) {
    if (x > playerX) {
      player.requestedDir = PM_DIR_RIGHT;
    } else {
      player.requestedDir = PM_DIR_LEFT;
    }
  } else if ((dy > PM_CLICK_SENSITIVITY) && (dx < dy)) {
    if (y > playerY) {
      player.requestedDir = PM_DIR_DOWN;
    } else {
      player.requestedDir = PM_DIR_UP;
    }
  }
};

/**
 * An event handle for a click event.
 * @param {Event} event Mouse event.
 */
pacMan.handleClick = function(event) {
  if (!event) {
    var event = window.event;
  }

  pacMan.canvasClicked(event.clientX, event.clientY);
};


/**
 * Add handlers for touch events. We support swiping to move on machines
 * that have that capability.
 */
pacMan.registerTouch = function() {
  document.body.addEventListener('touchstart', pacMan.handleTouchStart,
      true);
  pacMan.canvasEl.addEventListener('touchstart', pacMan.handleTouchStart,
      true);
  if (document.f && document.f.q) {
    document.f.q.addEventListener('touchstart', pacMan.handleTouchStart,
        true);
  }
};

/**
 * Handle touch start event.
 * @param {Event} event Browser event.
 */
pacMan.handleTouchStart = function(event) {
  // The touch event is added to body, so after the game starts, it is not
  // possible to swipe page by accident, pinch to zoom, etc.

  pacMan.touchDX = 0;
  pacMan.touchDY = 0;

  // Only single touch at this moment.
  if (event.touches.length == 1) {
    pacMan.touchStartX = event.touches[0].pageX;
    pacMan.touchStartY = event.touches[0].pageY;

    document.body.addEventListener('touchmove', pacMan.handleTouchMove,
                                   true);
    document.body.addEventListener('touchend', pacMan.handleTouchEnd, true);
  }
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Handle touch move event.
 * @param {Event} event Browser event.
 */
pacMan.handleTouchMove = function(event) {
  if (event.touches.length > 1) {
    pacMan.cancelTouch();
  } else {
    pacMan.touchDX = event.touches[0].pageX - pacMan.touchStartX;
    pacMan.touchDY = event.touches[0].pageY - pacMan.touchStartY;
  }
  event.preventDefault();
  event.stopPropagation();
};

/**
 * Handle touch end event.
 * @param {Event} event Browser event.
 */
pacMan.handleTouchEnd = function(event) {
  // Regular tap is interpreted as a click
  if ((pacMan.touchDX == 0) && (pacMan.touchDY == 0)) {
    pacMan.canvasClicked(pacMan.touchStartX, pacMan.touchStartY);
  } else {
    var dx = Math.abs(pacMan.touchDX);
    var dy = Math.abs(pacMan.touchDY);

    // A very short swipe is interpreted as click/tap
    if ((dx < PM_TOUCH_CLICK_SENSITIVITY) &&
        (dy < PM_TOUCH_CLICK_SENSITIVITY)) {
      pacMan.canvasClicked(pacMan.touchStartX, pacMan.touchStartY);
    } else if ((dx > PM_TOUCH_SENSITIVITY) && (dy < (dx * 2 / 3))) {
      // Horizontal swipe
      if (pacMan.touchDX > 0) {
        pacMan.actors[0].requestedDir = PM_DIR_RIGHT;
      } else {
        pacMan.actors[0].requestedDir = PM_DIR_LEFT;
      }
    } else if ((dy > PM_TOUCH_SENSITIVITY) && (dx < (dy * 2 / 3))) {
      // Vertical swipe
      if (pacMan.touchDY > 0) {
        pacMan.actors[0].requestedDir = PM_DIR_DOWN;
      } else {
        pacMan.actors[0].requestedDir = PM_DIR_UP;
      }
    }
  }

  event.preventDefault();
  event.stopPropagation();
  pacMan.cancelTouch();
};

/**
 * Finish with this touch gesture, remove handlers.
 */
pacMan.cancelTouch = function() {
  document.body.removeEventListener('touchmove', pacMan.handleTouchMove,
      true);
  document.body.removeEventListener('touchend', pacMan.handleTouchEnd, true);
  pacMan.touchStartX = null;
  pacMan.touchStartY = null;
};

/**
 * Adds necessary event listeners (keyboard, touch events).
 */
pacMan.addEventListeners = function() {
  if (window.addEventListener) {
    window.addEventListener('keydown', pacMan.handleKeyDown, true);
    pacMan.canvasEl.addEventListener('click', pacMan.handleClick, false);
    pacMan.registerTouch();
  } else {
    document.body.attachEvent('onkeydown', pacMan.handleKeyDown);
    pacMan.canvasEl.attachEvent('onclick', pacMan.handleClick);
  }
};

pacMan.removeEventListeners = function() {
  window.removeEventListener('keydown', pacMan.handleKeyDown, true);
  pacMan.canvasEl.removeEventListener('click', pacMan.handleClick, false);  
}

/**
 * Starts the gameplay. Performs all the functions that are necessary to
 * be done only once (clearing scores, setting life counter, etc.)
 */
pacMan.startGameplay = function() {
  pacMan.score = [0, 0];
  pacMan.extraLifeAwarded = [false, false];
  if (pacMan.mode == PM_FINAL) {
    pacMan.lives = 100;
  } else {
    pacMan.lives = 3;
  }
  pacMan.level = 0;
  pacMan.paused = false;

  pacMan.globalTime = 0;

  pacMan.newLevel(true);  
};

/**
 * Restarts the gameplay following new level or the loss of life.
 * @param {boolean} firstTime Whether this is the first game or not (first
 *                            game = longer READY with music).
 */
pacMan.restartGameplay = function(firstTime) {
  // Seeding the random number generator to a constant value. This allows
  // for patterns -- ghosts always move the same way if the player does too.
  pacMan.seed(0);

  // Resetting the timers.
  pacMan.frightModeTime = 0;
  pacMan.intervalTime = 0;
  pacMan.gameplayModeTime = 0;
  pacMan.fruitTime = 0;

  pacMan.ghostModeSwitchPos = 0;
  pacMan.ghostModeTime =
      pacMan.levels.ghostModeSwitchTimes[0] * PM_TARGET_FPS;

  // During the initial exiting of the pen, ghosts should come out one by
  // one. (This is not required if they do it later.)
  pacMan.ghostExitingPenNow = false;
  // How many ghost eyes are floating around.
  pacMan.ghostEyesCount = 0;

  // If any of the actors changed their current tile, we need to do some
  // things like check for collisions, etc. We do it only then to speed up
  // the game.
  pacMan.tilesChanged = false;

  pacMan.updateCruiseElroySpeed();
  pacMan.hideFruit();
  pacMan.resetForcePenLeaveTime();
  pacMan.restartActors();
  pacMan.updateActorPositions();

  pacMan.switchMainGhostMode(PM_GHOST_MODE_SCATTER, true);
  // Everyone except Blinky starts in a pen.
  for (var id = pacMan.playerCount + 1;
       id < pacMan.playerCount + PM_GHOST_ACTOR_COUNT; id++) {
    pacMan.actors[id].changeMode(PM_GHOST_MODE_IN_PEN);
  }

  pacMan.dotEatingChannel = [0, 0];
  pacMan.dotEatingSoundPart = [1, 1];
  pacMan.clearDotEatingNow();

  if (firstTime) {
    pacMan.changeGameplayMode(PM_GAMEPLAY_READY_PART_1);
  } else {
    pacMan.changeGameplayMode(PM_GAMEPLAY_FAST_READY_PART_1);
  }
};

/**
 * Switch to double mode, where Ms. Pac-Man plays alongside Pac-Man.
 * This initiates a little pause before jumping in.
 */
pacMan.initiateDoubleMode = function() {
  if (pacMan.playerCount != 2) {
    pacMan.stopAllAudio();
    pacMan.changeGameplayMode(PM_GAMEPLAY_DOUBLE_MODE_SWITCH);
  }
};

/**
 * Initiates a new game.
 */
pacMan.newGame = function() {
  if (pacMan.mode == PM_FINAL) {
    pacMan.playerCount = 2;
  } else {
    pacMan.playerCount = 1;
  }
  pacMan.createChrome();
  pacMan.createPlayfield();
  pacMan.createActors();

  pacMan.startGameplay();
};

/**
 * Second part of switch to double mode.
 */
pacMan.switchToDoubleMode = function() {
  pacMan.playerCount = 2;
  pacMan.createChrome();
  pacMan.createPlayfield();
  pacMan.createActors();

  pacMan.startGameplay();
};

/**
 * React to the user pressing Insert Coin button. This initiates double
 * mode during regular game play, or restarts the game again during game
 * over screen.
 */
pacMan.insertCoin = function() {
  if (pacMan.gameplayMode == PM_GAMEPLAY_GAMEOVER ||
      pacMan.gameplayMode == PM_GAMEPLAY_INFINITE_GAMEOVER) {
    pacMan.newGame();
  } else {
    pacMan.initiateDoubleMode();
  }
};

/**
 * Creates a little kill screen element.
 * @param {number} x Horizontal position.
 * @param {number} y Vertical position.
 * @param {number} w Width.
 * @param {number} h Height.
 * @param {boolean} image Whether to show an image or make it black.
 */
pacMan.createKillScreenElement = function(x, y, w, h, image) {
  var el = document.createElement('div');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.zIndex = 119;
  if (image) {
    el.style.background = 'url(files/sprite.png) -' +
        pacMan.killScreenTileX + 'px -' +
        pacMan.killScreenTileY + 'px no-repeat';
    pacMan.killScreenTileY += 8;
  } else {
    el.style.background = 'black';
  }
  pacMan.playfieldEl.appendChild(el);
};

/**
 * Show the "kill screen" instead of level 256. The original Pac-Man had
 * a bug that corrupted that level, making it look funny and impossible to
 * finish. We're trying to procedurally generate a similarly looking level,
 * although we're not making it playable.
 */
pacMan.killScreen = function() {
  // Makes sure it always looks the same.
  pacMan.seed(0);

  pacMan.canvasEl.style.visibility = '';

  // Covering the right-hand side of the playfield.
  pacMan.createKillScreenElement(272, 0, 200, 80, false);
  pacMan.createKillScreenElement(272 + 8, 80, 200 - 8, 136 - 80, false);

  // Creating little tiles with gibberish.
  pacMan.killScreenTileX = 80;
  pacMan.killScreenTileY = 0;
  for (var x = 280; x <= 472; x += 8) {
    for (var y = 0; y <= 136; y += 8) {
      if (pacMan.rand() < 0.03) {
        pacMan.killScreenTileX = Math.floor(pacMan.rand() * 25) * 10;
        pacMan.killScreenTileY = Math.floor(pacMan.rand() * 2) * 10;
      }

      pacMan.createKillScreenElement(x, y, 8, 8, true);
    }
  }

  pacMan.changeGameplayMode(PM_GAMEPLAY_INFINITE_GAMEOVER);
};

/**
 * Start a new level.
 * @param {boolean} firstTime Whether this is happening for the first time.
 */
pacMan.newLevel = function(firstTime) {
  pacMan.level++;

  // Every level above 21 looks like level 21.
  if (pacMan.level >= PM_LEVELS.length) {
    pacMan.levels = PM_LEVELS[PM_LEVELS.length - 1];
  } else {
    pacMan.levels = PM_LEVELS[pacMan.level];
  }

  // Calculate proper length of fright time based on level info.
  pacMan.levels.frightTime =
      Math.round(pacMan.levels.frightTime * PM_TARGET_FPS);
  pacMan.levels.frightTotalTime =
      pacMan.levels.frightTime +
      pacMan.timing[PM_TIMING_FRIGHT_BLINK] *
      ((pacMan.levels.frightBlinkCount * 2) - 1);

  for (var i in pacMan.actors) {
    pacMan.actors[i].dotCount = 0;
  }

  pacMan.alternatePenLeavingScheme = false;
  pacMan.lostLifeOnThisLevel = false;

  pacMan.updateChrome();
  pacMan.resetPlayfield();

  pacMan.restartGameplay(firstTime);

  // You can never advance past level 255. Level 256 is a "kill screen"
  // and the game ends there.
  if (pacMan.level == 256) {
    pacMan.killScreen();
  }
  
};

/**
 * New life starts for Pac-Man. If there aren't enough lives left, game
 * over!
 */
pacMan.newLife = function() {
  // Some ghost behaviour differs when Pac-Man lost a life on a given
  // level.
  pacMan.lostLifeOnThisLevel = true;

  pacMan.alternatePenLeavingScheme = true;
  pacMan.alternateDotCount = 0;

  pacMan.lives--;
  pacMan.updateChromeLives();
  if (pacMan.lives == -1) {
    pacMan.changeGameplayMode(PM_GAMEPLAY_GAMEOVER);
  } else {
    pacMan.restartGameplay(false);
  }
};

/**
 * Switches the main ghost mode.
 *
 * In normal gameplay, the modes alternate between scatter (ghosts just
 * roam around) and chase (ghosts chase Pac-Man). When Pac-Man eats an
 * energizer, the main ghost mode switches to fright.
 *
 * In addition to that, ghosts have their individual modes too.
 *
 * @param {number} newMode New main ghost mode.
 * @param {boolean} initial Whether this is an initial invokation of this
 *                          during level start.
 */
pacMan.switchMainGhostMode = function(newMode, initial) {
  // On further levels, fright mode doesn't happen at all. The ghosts just
  // reverse directions.
  if (newMode == PM_GHOST_MODE_FRIGHT && pacMan.levels.frightTime == 0) {
    for (var i in pacMan.actors) {
      var actor = pacMan.actors[i];
      if (actor.ghost) {
        actor.reverseDirectionsNext = true;
      }
    }
    return;
  }

  var oldMode = pacMan.mainGhostMode;

  // Remember the previous mode that came before fright mode.
  if (newMode == PM_GHOST_MODE_FRIGHT &&
      pacMan.mainGhostMode != PM_GHOST_MODE_FRIGHT) {
    pacMan.lastMainGhostMode = pacMan.mainGhostMode;
  }
  pacMan.mainGhostMode = newMode;

  if (newMode == PM_GHOST_MODE_FRIGHT || oldMode == PM_GHOST_MODE_FRIGHT) {
    pacMan.playAmbientSound();
  }

  switch (newMode) {
    case PM_GHOST_MODE_CHASE:
    case PM_GHOST_MODE_SCATTER:
      pacMan.currentPlayerSpeed =
          pacMan.levels.playerSpeed * PM_MASTER_SPEED;
      pacMan.currentDotEatingSpeed =
          pacMan.levels.dotEatingSpeed * PM_MASTER_SPEED;
      break;
    case PM_GHOST_MODE_FRIGHT:
      pacMan.currentPlayerSpeed =
          pacMan.levels.playerFrightSpeed * PM_MASTER_SPEED;
      pacMan.currentDotEatingSpeed =
          pacMan.levels.dotEatingFrightSpeed * PM_MASTER_SPEED;
      pacMan.frightModeTime = pacMan.levels.frightTotalTime;
      pacMan.modeScoreMultiplier = 1;
      break;
  }

  for (var i in pacMan.actors) {
    var actor = pacMan.actors[i];
    if (actor.ghost) {
      // For each ghost, we remember whether a master mode change happened
      // while it was in pen. Its direction when exiting a pen will depend
      // on that.
      if (newMode != PM_GHOST_MODE_REENTERING_PEN && !initial) {
        actor.modeChangedWhileInPen = true;
      }

      // We need to remember whether a ghost has been eaten in a given fright
      // mode, so that it exits in its normal state, even if everyone else
      // is still blue.
      if (newMode == PM_GHOST_MODE_FRIGHT) {
        actor.eatenInThisFrightMode = false;
      }

      if ((actor.mode != PM_GHOST_MODE_EYES &&
           actor.mode != PM_GHOST_MODE_IN_PEN &&
           actor.mode != PM_GHOST_MODE_EXITING_PEN &&
           actor.mode != PM_GHOST_MODE_REEXITING_PEN &&
           actor.mode != PM_GHOST_MODE_REENTERING_PEN) || initial) {
        // Ghosts are forced to reverse direction whenever they change modes
        // (except when the fright mode ends).
        if (!initial && actor.mode != PM_GHOST_MODE_FRIGHT &&
            actor.mode != newMode) {
          actor.reverseDirectionsNext = true;
        }
        actor.changeMode(newMode);
      }
    } else {
      actor.fullSpeed = pacMan.currentPlayerSpeed;
      actor.dotEatingSpeed = pacMan.currentDotEatingSpeed;
      actor.tunnelSpeed = pacMan.currentPlayerSpeed;
      actor.updatePhysicalSpeed();
    }
  }
};

/**
 * Check if some of the ghosts can now exit the pen.
 */
pacMan.figureOutPenLeaving = function() {
  // In the alternate pen leaving scheme (after a player died on a given
  // level) the ghosts exit after Pac-Man ate specificically numbered dots.
  if (pacMan.alternatePenLeavingScheme) {
    pacMan.alternateDotCount++;

    switch (pacMan.alternateDotCount) {
      case PM_ALTERNATE_DOT_COUNT[1]:
        pacMan.actors[pacMan.playerCount + 1].freeToLeavePen = true;
        break;
      case PM_ALTERNATE_DOT_COUNT[2]:
        pacMan.actors[pacMan.playerCount + 2].freeToLeavePen = true;
        break;
      case PM_ALTERNATE_DOT_COUNT[3]:
        if (pacMan.actors[pacMan.playerCount + 3].mode ==
            PM_GHOST_MODE_IN_PEN) {
          pacMan.alternatePenLeavingScheme = false;
        }
        break;
    }
  } else {
    // In the normal pen leaving scheme, each ghost has an individual counter
    // and leaves after it exceeds a given value. We advance the counter only
    // for the first ghost in the pen (Inky >> Pinky >> Clyde).
    if (pacMan.actors[pacMan.playerCount + 1].mode == PM_GHOST_MODE_IN_PEN ||
        pacMan.actors[pacMan.playerCount + 1].mode == PM_GHOST_MODE_EYES) {
      pacMan.actors[pacMan.playerCount + 1].dotCount++;

      if (pacMan.actors[pacMan.playerCount + 1].dotCount >=
          pacMan.levels.penLeavingLimits[1]) {
        pacMan.actors[pacMan.playerCount + 1].freeToLeavePen = true;
      }
    } else if (pacMan.actors[pacMan.playerCount + 2].mode ==
               PM_GHOST_MODE_IN_PEN ||
               pacMan.actors[pacMan.playerCount + 2].mode ==
               PM_GHOST_MODE_EYES) {
      pacMan.actors[pacMan.playerCount + 2].dotCount++;

      if (pacMan.actors[pacMan.playerCount + 2].dotCount >=
          pacMan.levels.penLeavingLimits[2]) {
        pacMan.actors[pacMan.playerCount + 2].freeToLeavePen = true;
      }
    } else if (pacMan.actors[pacMan.playerCount + 3].mode ==
               PM_GHOST_MODE_IN_PEN ||
               pacMan.actors[pacMan.playerCount + 3].mode ==
               PM_GHOST_MODE_EYES) {
      pacMan.actors[pacMan.playerCount + 3].dotCount++;

      if (pacMan.actors[pacMan.playerCount + 3].dotCount >=
          pacMan.levels.penLeavingLimits[3]) {
        pacMan.actors[pacMan.playerCount + 3].freeToLeavePen = true;
      }
    }
  }
};

/**
 * Resets the force pen leave timer to its default value. The timer
 * forces the ghosts out after
 * a while when Pac-Man is not eating anything.
 */
pacMan.resetForcePenLeaveTime = function() {
  pacMan.forcePenLeaveTime = pacMan.levels.penForceTime * PM_TARGET_FPS;
};

/**
 * Reacts to Pac-Man or Ms. Pac-Man eating a dot
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 * @param {Array} pos Tile position.
 */
pacMan.dotEaten = function(playerId, pos) {
  pacMan.dotsRemaining--;
  pacMan.dotsEaten++;

  pacMan.actors[playerId].changeCurrentSpeed(PM_SPEED_DOT_EATING);
  pacMan.playDotEatingSound(playerId);

  if (pacMan.playfield[pos[0]][pos[1]].dot == PM_DOT_TYPE_ENERGIZER) {
    pacMan.switchMainGhostMode(PM_GHOST_MODE_FRIGHT, false);
    pacMan.addToScore(PM_SCORE_ENERGIZER, playerId);
  } else {
    pacMan.addToScore(PM_SCORE_DOT, playerId);
  }

  // Hide the dot on the screen and in our array.
  var el = document.getElementById(pacMan.getDotElementId(pos[0], pos[1]));
  el.style.display = 'none';
  pacMan.playfield[pos[0]][pos[1]].dot = PM_DOT_TYPE_NONE;

  // Cruise Elroy speed depends on how many dots have been eaten, so we
  // need to update that.
  pacMan.updateCruiseElroySpeed();
  // This timer forces ghosts out of the pen if Pac-Man is not eating dots...
  // so we need to reset it now.
  pacMan.resetForcePenLeaveTime();
  pacMan.figureOutPenLeaving();

  // Showing the fruit at 70 and 170 dots eaten.
  if (pacMan.dotsEaten == PM_FRUIT_DOTS_TRIGGER_1 ||
      pacMan.dotsEaten == PM_FRUIT_DOTS_TRIGGER_2) {
    pacMan.showFruit();
  }

  if (pacMan.dotsRemaining == 0) {
    pacMan.finishLevel();
  }

  // Ambient sound depends on the number of dots eaten
  pacMan.playAmbientSound();
};

/**
 * Get the sprite position of a given fruit.
 * @param {number} fruitId Fruit id (1 to 8).
 * @return {Array} X and Y position of the sprite.
 */
pacMan.getFruitSprite = function(fruitId) {
  if (fruitId <= 4) {
    var x = 128;
  } else {
    var x = 160;
  }

  var y = 128 + 16 * ((fruitId - 1) % 4);

  return [x, y];
};

/**
 * Get the sprite position for a score of a given fruit (appears for a brief
 * moment after the player eats a fruit).
 * @param {number} fruitId Fruit id (1 to 8).
 * @return {Array} X and Y position of the sprite.
 */
pacMan.getFruitScoreSprite = function(fruitId) {
  var x = 128;
  var y = 16 * (fruitId - 1);

  return [x, y];
};

/**
 * Hides the fruit.
 */
pacMan.hideFruit = function() {
  pacMan.fruitShown = false;

  pacMan.changeElementBkPos(pacMan.fruitEl, 32, 16, true);
};

/**
 * Shows the fruit.
 */
pacMan.showFruit = function() {
  pacMan.fruitShown = true;

  var pos = pacMan.getFruitSprite(pacMan.levels.fruit);
  pacMan.changeElementBkPos(pacMan.fruitEl, pos[0], pos[1], true);

  // Randomize fruit time between PM_TIMING_FRUIT_MIN (9 secs)
  // and PM_TIMING_FRUIT_MAX (10 secs)
  pacMan.fruitTime = pacMan.timing[PM_TIMING_FRUIT_MIN] +
      ((pacMan.timing[PM_TIMING_FRUIT_MAX] -
        pacMan.timing[PM_TIMING_FRUIT_MIN]) * pacMan.rand());
};

/**
 * Fruit gets eaten. A sound is played, the fruit gets replaced with score
 * visual (for a brief time), and the score is increased.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.eatFruit = function(playerId) {
  if (pacMan.fruitShown) {
    pacMan.playSound(PM_SOUND_FRUIT, PM_CHANNEL_AUX);

    pacMan.fruitShown = false;
    var pos = pacMan.getFruitScoreSprite(pacMan.levels.fruit);
    pacMan.changeElementBkPos(pacMan.fruitEl, pos[0], pos[1], true);
    pacMan.fruitTime = pacMan.timing[PM_TIMING_FRUIT_DECAY];

    pacMan.addToScore(pacMan.levels.fruitScore, playerId);
  }
};

/**
 * Update target positions for all the ghosts.
 */
pacMan.updateActorTargetPositions = function() {
  for (var id = pacMan.playerCount;
       id < pacMan.playerCount + PM_GHOST_ACTOR_COUNT; id++) {
    pacMan.actors[id].updateTargetPosition();
  }
};

/**
 * Move all the actors.
 */
pacMan.moveActors = function() {
  for (var id in pacMan.actors) {
    pacMan.actors[id].move();
  }
};

/**
 * Ghost is being eaten by Pac-Man.
 * @param {number} ghostId Ghost id.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.ghostDies = function(ghostId, playerId) {
  pacMan.playSound(PM_SOUND_EATING_GHOST, PM_CHANNEL_AUX);

  pacMan.addToScore(PM_SCORE_GHOST * pacMan.modeScoreMultiplier, playerId);
  pacMan.modeScoreMultiplier *= 2;

  pacMan.ghostBeingEatenId = ghostId;
  pacMan.playerEatingGhostId = playerId;
  pacMan.changeGameplayMode(PM_GAMEPLAY_GHOST_BEING_EATEN);
};

/**
 * Ghost eats Pac-Man.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.playerDies = function(playerId) {
  pacMan.playerDyingId = playerId;
  pacMan.changeGameplayMode(PM_GAMEPLAY_PLAYER_DYING_PART_1);
};

/**
 * Detect possible collisions, e.g. Pac-Man or Ms. Pac-Man occupying the same
 * tile as one of the ghosts.
 */
pacMan.detectCollisions = function() {
  pacMan.tilesChanged = false;

  for (var i = pacMan.playerCount;
       i < pacMan.playerCount + PM_GHOST_ACTOR_COUNT; i++) {
    for (var j = 0; j < pacMan.playerCount; j++) {
      if (pacMan.actors[i].tilePos[0] == pacMan.actors[j].tilePos[0] &&
          pacMan.actors[i].tilePos[1] == pacMan.actors[j].tilePos[1]) {

        // If the ghost is blue, Pac-Man eats the ghost...
        if (pacMan.actors[i].mode == PM_GHOST_MODE_FRIGHT) {
          pacMan.ghostDies(i, j);

          // return here prevents from two ghosts being eaten at the same time
          return;
        } else {
          // ...otherwise, the ghost kills Pac-Man
          if (pacMan.actors[i].mode != PM_GHOST_MODE_EYES &&
              pacMan.actors[i].mode != PM_GHOST_MODE_IN_PEN &&
              pacMan.actors[i].mode != PM_GHOST_MODE_EXITING_PEN &&
              pacMan.actors[i].mode != PM_GHOST_MODE_REEXITING_PEN &&
              pacMan.actors[i].mode != PM_GHOST_MODE_REENTERING_PEN) {
            pacMan.playerDies(j);
          }
        }
      }
    }
  }
};

/**
 * Update Cruise Elroy speed. Under some circumstances (e.g. not many dots
 * left remaining), Blinky becomes Cruise Elroy and its speed increases.
 */
pacMan.updateCruiseElroySpeed = function() {
  var newCruiseElroySpeed = pacMan.levels.ghostSpeed * PM_MASTER_SPEED;

  if (!pacMan.lostLifeOnThisLevel ||
      pacMan.actors[pacMan.playerCount + 3].mode != PM_GHOST_MODE_IN_PEN) {
    var levels = pacMan.levels;
    if (pacMan.dotsRemaining < levels.elroyDotsLeftPart2) {
      newCruiseElroySpeed = levels.elroySpeedPart2 * PM_MASTER_SPEED;
    } else if (pacMan.dotsRemaining < levels.elroyDotsLeftPart1) {
      newCruiseElroySpeed = levels.elroySpeedPart1 * PM_MASTER_SPEED;
    }
  }
  if (newCruiseElroySpeed != pacMan.cruiseElroySpeed) {
    pacMan.cruiseElroySpeed = newCruiseElroySpeed;
    pacMan.actors[pacMan.playerCount].updatePhysicalSpeed();
  }
};

/**
 * Gets an interval table for a given speed. Creates a new table and caches
 * it for future use.
 * @param {number} speed Actor speed.
 * @return {Array} Array of speed intervals.
 */
pacMan.getSpeedIntervals = function(speed) {
  if (pacMan.speedIntervals[speed]) {
    return pacMan.speedIntervals[speed];
  } else {
    var dist = 0;
    var lastDist = 0;

    pacMan.speedIntervals[speed] = [];
    for (var i = 0; i < PM_TARGET_FPS; i++) {
      dist += speed;
      if (Math.floor(dist) > lastDist) {
        pacMan.speedIntervals[speed].push(true);
        lastDist = Math.floor(dist);
      } else {
        pacMan.speedIntervals[speed].push(false);
      }
    }

    return pacMan.speedIntervals[speed];
  }
};

/**
 * The level is completed; all the dots have been eaten. We go into the
 * short finish level animation; playfield blinks white for a couple
 * of times. Then we go into a cutscene or straight to the next level.
 */
pacMan.finishLevel = function() {
  pacMan.changeGameplayMode(PM_GAMEPLAY_LEVEL_COMPLETE_PART_1);
};

/**
 * Change the main gameplay mode (game, cutscene, ready, game over, etc.)
 * @param {number} mode New Mode (PM_GAMEPLAY_*).
 */
pacMan.changeGameplayMode = function(mode) {
  pacMan.gameplayMode = mode;

  if (mode != PM_GAMEPLAY_CUTSCENE) {
    for (var i = 0; i < pacMan.playerCount + PM_GHOST_ACTOR_COUNT; i++) {
      pacMan.actors[i].updateSprite();
    }
  }

  switch (mode) {
    case PM_GAMEPLAY_GAME_IN_PROGRESS:
      pacMan.playAmbientSound();
      break;

    case PM_GAMEPLAY_PLAYER_DYING_PART_1:
      pacMan.stopAllAudio();
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_PLAYER_DYING_PART_1];
      break;

    case PM_GAMEPLAY_PLAYER_DYING_PART_2:
      if (pacMan.playerDyingId == 0) {
        pacMan.playSound(PM_SOUND_PACMAN_DEATH, PM_CHANNEL_AUX);
      } else {
        pacMan.playSound(PM_SOUND_PACMAN_DEATH_DOUBLE, PM_CHANNEL_AUX);
      }
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_PLAYER_DYING_PART_2];
      break;

    case PM_GAMEPLAY_FAST_READY_PART_1:
      pacMan.canvasEl.style.visibility = 'hidden';
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_FAST_READY_PART_1];
      break;

    case PM_GAMEPLAY_FAST_READY_PART_2:
      pacMan.stopAllAudio();
      pacMan.canvasEl.style.visibility = '';
      pacMan.doorEl.style.display = 'block';
      var el = document.createElement('div');
      el.id = 'pcm-re';
      pacMan.prepareElement(el, 160, 0);
      pacMan.playfieldEl.appendChild(el);
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_FAST_READY_PART_2];
      break;

    case PM_GAMEPLAY_READY_PART_1:
      pacMan.doorEl.style.display = 'block';
      var el = document.createElement('div');
      el.id = 'pcm-re';
      pacMan.prepareElement(el, 160, 0);
      pacMan.playfieldEl.appendChild(el);
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_READY_PART_1];
      pacMan.stopAllAudio();
      if (pacMan.playerCount == 2) {
        pacMan.playSound(PM_SOUND_START_MUSIC_DOUBLE, PM_CHANNEL_AUX, true);
      } else {
        pacMan.playSound(PM_SOUND_START_MUSIC, PM_CHANNEL_AUX, true);
      }
      break;

    case PM_GAMEPLAY_READY_PART_2:
      pacMan.lives--;
      pacMan.updateChromeLives();
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_READY_PART_2];
      break;

    case PM_GAMEPLAY_GAMEOVER:
    case PM_GAMEPLAY_INFINITE_GAMEOVER:
      var el = document.getElementById('pcm-re');
      if (el) {
        el.parentNode.removeChild(el);
      }

      pacMan.stopAllAudio();
      var el = document.createElement('div');
      el.id = 'pcm-go';
      pacMan.prepareElement(el, 8, 152);
      pacMan.playfieldEl.appendChild(el);
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_GAMEOVER];
      break;

    case PM_GAMEPLAY_LEVEL_COMPLETE_PART_1:
      pacMan.stopAllAudio();
      pacMan.gameplayModeTime =
          pacMan.timing[PM_TIMING_LEVEL_COMPLETE_PART_1];
      break;

    case PM_GAMEPLAY_LEVEL_COMPLETE_PART_2:
      pacMan.doorEl.style.display = 'none';
      pacMan.gameplayModeTime =
          pacMan.timing[PM_TIMING_LEVEL_COMPLETE_PART_2];
      break;

    case PM_GAMEPLAY_LEVEL_COMPLETE_PART_3:
      pacMan.canvasEl.style.visibility = 'hidden';
      pacMan.gameplayModeTime =
          pacMan.timing[PM_TIMING_LEVEL_COMPLETE_PART_3];
      break;

    case PM_GAMEPLAY_DOUBLE_MODE_SWITCH:
      pacMan.playfieldEl.style.visibility = 'hidden';
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_DOUBLE_MODE];
      break;

    case PM_GAMEPLAY_GHOST_BEING_EATEN:
      pacMan.gameplayModeTime = pacMan.timing[PM_TIMING_GHOST_BEING_EATEN];
      break;

    case PM_GAMEPLAY_CUTSCENE:
      pacMan.startCutscene();
      break;
  }
};

/**
 * Shows or hides the chrome in preparation for cutscenes. Scores, lives,
 * and the sound icon are hidden -- the only thing remaining is the level fruit
 * in the bottom-right corner.
 * @param {boolean} show Whether to show (true) or hide (false).
 */
pacMan.showChrome = function(show) {
  pacMan.showElementById('pcm-sc-1-l', show);
  pacMan.showElementById('pcm-sc-2-l', show);
  pacMan.showElementById('pcm-sc-1', show);
  pacMan.showElementById('pcm-sc-2', show);
  pacMan.showElementById('pcm-li', show);
  pacMan.showElementById('pcm-so', show);
};

/**
 * Toggles sound on or off and updates the sound icon.
 * The event is cancelled so that the click does not register as a movement.
 * @param {Event} e Window event.
 * @return {boolean} false.
 */
pacMan.toggleSound = function(e) {
  e = window.event || e;
  e.cancelBubble = true;
  if (google.pacManSound) {
    pacMan.userDisabledSound = true;
    pacMan.stopAllAudio();
    google.pacManSound = false;
  } else {
    google.pacManSound = true;
    pacMan.playAmbientSound();
  }
  pacMan.updateSoundIcon();
  return e.returnValue = false;
};

/**
 * Updates the appearance of the sound icon.
 */
pacMan.updateSoundIcon = function() {
  if (pacMan.soundEl) {
    if (google.pacManSound) {
      pacMan.changeElementBkPos(pacMan.soundEl, 216, 105, false);
    } else {
      pacMan.changeElementBkPos(pacMan.soundEl, 236, 105, false);
    }
  }
};

/**
 * Starts the cutscene ("coffee break"). Hides the chrome, prepares the
 * cutscene actors.
 */
pacMan.startCutscene = function() {
  pacMan.playfieldEl.style.visibility = 'hidden';
  pacMan.canvasEl.style.visibility = '';
  pacMan.showChrome(false);

  pacMan.cutsceneCanvasEl = document.createElement('div');
  pacMan.cutsceneCanvasEl.id = 'pcm-cc';
  pacMan.canvasEl.appendChild(pacMan.cutsceneCanvasEl);

  pacMan.cutscene = PM_CUTSCENES[pacMan.cutsceneId];
  pacMan.cutsceneSequenceId = -1;

  pacMan.frightModeTime = pacMan.levels.frightTotalTime;

  pacMan.cutsceneActors = [];
  for (var i in pacMan.cutscene.actors) {
    var id = pacMan.cutscene.actors[i].id;
    if (id > 0) {
      id += pacMan.playerCount - 1;
    }

    var el = document.createElement('div');
    el.className = 'pcm-ac';
    el.id = 'actor' + id;
    pacMan.prepareElement(el, 0, 0);

    var cutsceneActor = new PacManActor(id);
    cutsceneActor.el = el;
    cutsceneActor.elBackgroundPos = [0, 0];
    cutsceneActor.elPos = [0, 0];
    cutsceneActor.pos = [pacMan.cutscene.actors[i].y * PM_TILE_SIZE,
                         pacMan.cutscene.actors[i].x * PM_TILE_SIZE];
    cutsceneActor.posDelta = [0, 0];
    cutsceneActor.ghost = pacMan.cutscene.actors[i].ghost;

    pacMan.cutsceneCanvasEl.appendChild(el);

    pacMan.cutsceneActors.push(cutsceneActor);
  }

  pacMan.cutsceneNextSequence();

  pacMan.stopAllAudio();
  pacMan.playAmbientSound();
};

/**
 * Finishes the cutscene, moves on to the next level.
 */
pacMan.stopCutscene = function() {
  pacMan.playfieldEl.style.visibility = '';
  if (pacMan.cutsceneCanvasEl) {
    pacMan.cutsceneCanvasEl.parentNode.removeChild(pacMan.cutsceneCanvasEl);
  }

  pacMan.showChrome(true);
  pacMan.newLevel(false);
};

/**
 * Moves on to the next sequence in a cutscene.
 */
pacMan.cutsceneNextSequence = function() {
  pacMan.cutsceneSequenceId++;

  // Last sequence... the cutscene is over.
  if (pacMan.cutscene.sequence.length == pacMan.cutsceneSequenceId) {
    pacMan.stopCutscene();
    return;
  }

  var cutsceneSequence = pacMan.cutscene.sequence[pacMan.cutsceneSequenceId];

  pacMan.cutsceneTime = cutsceneSequence.time * PM_TARGET_FPS;

  for (var i in pacMan.cutsceneActors) {
    var actor = pacMan.cutsceneActors[i];

    actor.dir = cutsceneSequence.moves[i].dir;
    actor.speed = cutsceneSequence.moves[i].speed;

    if (cutsceneSequence.moves[i].elId) {
      actor.el.id = cutsceneSequence.moves[i].elId;
    }
    if (cutsceneSequence.moves[i].mode) {
      actor.mode = cutsceneSequence.moves[i].mode;
    }

    actor.updateSprite();
  }
};

/**
 * Checks whether it's time for the next cutscene sequence.
 */
pacMan.checkCutscene = function() {
  if (pacMan.cutsceneTime <= 0) {
    pacMan.cutsceneNextSequence();
  }
};

/**
 * Updates the cutscene for every frame, moving the actors.
 */
pacMan.advanceCutscene = function() {
  for (var i in pacMan.cutsceneActors) {
    var actor = pacMan.cutsceneActors[i];

    var movement = PM_MOVEMENTS[actor.dir];
    actor.pos[movement.axis] += movement.increment * actor.speed;

    actor.updateSprite();
  }

  pacMan.cutsceneTime--;
};

/**
 * Update positions of all the actors.
 */
pacMan.updateActorPositions = function() {
  for (var id in pacMan.actors) {
    pacMan.actors[id].updatePosition();
  }
};

/**
 * Blink the energizers if it's expected in the current mode.
 */
pacMan.blinkEnergizers = function() {
  switch (pacMan.gameplayMode) {
    case PM_GAMEPLAY_READY_PART_1:
    case PM_GAMEPLAY_READY_PART_2:
    case PM_GAMEPLAY_FAST_READY_PART_1:
    case PM_GAMEPLAY_FAST_READY_PART_2:
    case PM_GAMEPLAY_LEVEL_COMPLETE_PART_1:
    case PM_GAMEPLAY_LEVEL_COMPLETE_PART_2:
    case PM_GAMEPLAY_LEVEL_COMPLETE_PART_3:
    case PM_GAMEPLAY_DOUBLE_MODE_SWITCH:
      pacMan.playfieldEl.className = '';
      break;
    case PM_GAMEPLAY_GAMEOVER:
    case PM_GAMEPLAY_INFINITE_GAMEOVER:
      pacMan.playfieldEl.className = 'blk';
      break;
    default:
      if (pacMan.globalTime % (pacMan.timing[PM_TIMING_ENERGIZER] * 2) == 0) {
        pacMan.playfieldEl.className = '';
      } else if (pacMan.globalTime %
                 (pacMan.timing[PM_TIMING_ENERGIZER] * 2) ==
                 pacMan.timing[PM_TIMING_ENERGIZER]) {
        pacMan.playfieldEl.className = 'blk';
      }
      break;
  }
};

/**
 * Blink the score label.
 */
pacMan.blinkScoreLabels = function() {
  if (pacMan.gameplayMode != PM_GAMEPLAY_CUTSCENE) {
    var visibility = '';
    if (pacMan.globalTime % (pacMan.timing[PM_TIMING_SCORE_LABEL] * 2) == 0) {
      visibility = 'visible';
    } else if (pacMan.globalTime %
               (pacMan.timing[PM_TIMING_SCORE_LABEL] * 2) ==
               pacMan.timing[PM_TIMING_SCORE_LABEL]) {
      visibility = 'hidden';
    }

    if (visibility) {
      for (var i = 0; i < pacMan.playerCount; i++) {
        pacMan.scoreLabelEl[i].style.visibility = visibility;
      }
    }
  }
};

/**
 * Finish the fright mode -- restore the previous mode.
 */
pacMan.finishFrightMode = function() {
  pacMan.switchMainGhostMode(pacMan.lastMainGhostMode, false);
};

/**
 * Handle the main gameplay mode timer (various modes, like READY or
 * GAME OVER are timed and need to end).
 */
pacMan.handleGameplayModeTimer = function() {
  if (pacMan.gameplayModeTime) {
    pacMan.gameplayModeTime--;

    switch (pacMan.gameplayMode) {
      case PM_GAMEPLAY_PLAYER_DYING_PART_1:
      case PM_GAMEPLAY_PLAYER_DYING_PART_2:
        for (var i = 0; i < pacMan.playerCount + PM_GHOST_ACTOR_COUNT;
             i++) {
          pacMan.actors[i].updateSprite();
        }
        break;
      case PM_GAMEPLAY_LEVEL_COMPLETE_PART_2:
        // The playfield blinks blue and white.
        if ((Math.floor(pacMan.gameplayModeTime /
            (pacMan.timing[PM_TIMING_LEVEL_COMPLETE_PART_2] / 8)) % 2) == 0) {
          pacMan.changeElementBkPos(pacMan.playfieldEl, 322, 2, false);
        } else {
          pacMan.changeElementBkPos(pacMan.playfieldEl, 322, 138, false);
        }
    }

    if (pacMan.gameplayModeTime <= 0) {
      pacMan.gameplayModeTime = 0;

      switch (pacMan.gameplayMode) {
        case PM_GAMEPLAY_GHOST_BEING_EATEN:
          pacMan.changeGameplayMode(PM_GAMEPLAY_GAME_IN_PROGRESS);
          pacMan.ghostEyesCount++;
          pacMan.playAmbientSound();
          pacMan.actors[pacMan.ghostBeingEatenId].el.className = 'pcm-ac';
          pacMan.actors[pacMan.ghostBeingEatenId].changeMode(
              PM_GHOST_MODE_EYES);

          // If all the ghosts have been eaten etc., we finish the fright
          // mode.
          var fright = false;
          for (var i = pacMan.playerCount;
               i < pacMan.playerCount + PM_GHOST_ACTOR_COUNT; i++) {
            if ((pacMan.actors[i].mode == PM_GHOST_MODE_FRIGHT) ||
                (((pacMan.actors[i].mode == PM_GHOST_MODE_IN_PEN) ||
                 (pacMan.actors[i].mode == PM_GHOST_MODE_REEXITING_PEN)) &&
                 !pacMan.actors[i].eatenInThisFrightMode)) {
              fright = true;
              break;
            }
          }
          if (!fright) {
            pacMan.finishFrightMode();
          }
          break;
        case PM_GAMEPLAY_PLAYER_DYING_PART_1:
          pacMan.changeGameplayMode(PM_GAMEPLAY_PLAYER_DYING_PART_2);
          break;
        case PM_GAMEPLAY_PLAYER_DYING_PART_2:
          pacMan.newLife();
          break;
        case PM_GAMEPLAY_READY_PART_1:
          pacMan.changeGameplayMode(PM_GAMEPLAY_READY_PART_2);
          break;
        case PM_GAMEPLAY_FAST_READY_PART_1:
          pacMan.changeGameplayMode(PM_GAMEPLAY_FAST_READY_PART_2);
          break;
        case PM_GAMEPLAY_FAST_READY_PART_2:
        case PM_GAMEPLAY_READY_PART_2:
          var el = document.getElementById('pcm-re');
          if (el) { 
            el.parentNode.removeChild(el);
          }
          pacMan.changeGameplayMode(PM_GAMEPLAY_GAME_IN_PROGRESS);
          break;
        case PM_GAMEPLAY_GAMEOVER:
          var el = document.getElementById('pcm-go');
          if (el) {
            el.parentNode.removeChild(el);
          }
          break;
        case PM_GAMEPLAY_LEVEL_COMPLETE_PART_1:
          if (pacMan.mode != PM_FINAL) {
            pacMan.changeGameplayMode(PM_GAMEPLAY_LEVEL_COMPLETE_PART_2);
          }
          break;
        case PM_GAMEPLAY_LEVEL_COMPLETE_PART_2:
          pacMan.changeGameplayMode(PM_GAMEPLAY_LEVEL_COMPLETE_PART_3);
          break;
        case PM_GAMEPLAY_LEVEL_COMPLETE_PART_3:
          if (pacMan.levels.cutsceneId) {
            pacMan.cutsceneId = pacMan.levels.cutsceneId;
            pacMan.changeGameplayMode(PM_GAMEPLAY_CUTSCENE);
          } else {
            pacMan.canvasEl.style.visibility = '';
            pacMan.newLevel(false);
          }
          break;
        case PM_GAMEPLAY_DOUBLE_MODE_SWITCH:
          pacMan.playfieldEl.style.visibility = '';
          pacMan.canvasEl.style.visibility = '';
          pacMan.switchToDoubleMode();
          break;
      }
    }
  }
};

/**
 * Decrements the fruit timer. If the timer runs out, this means we have to
 * hide the fruit.
 */
pacMan.handleFruitTimer = function() {
  if (pacMan.fruitTime) {
    pacMan.fruitTime--;

    if (pacMan.fruitTime <= 0) {
      pacMan.hideFruit();
    }
  }
};

/**
 * Decrements various timers related to ghosts: fright mode countdown
 * (ghosts stopping being blue/frightened); switching between scatter and
 * chase mode in normal operation.
 */
pacMan.handleGhostModeTimer = function() {
  if (pacMan.frightModeTime) {
    pacMan.frightModeTime--;

    if (pacMan.frightModeTime <= 0) {
      pacMan.frightModeTime = 0;

      pacMan.finishFrightMode();
    }
  } else {
    if (pacMan.ghostModeTime > 0) {
      pacMan.ghostModeTime--;

      if (pacMan.ghostModeTime <= 0) {
        pacMan.ghostModeTime = 0;

        pacMan.ghostModeSwitchPos++;

        if (pacMan.levels.ghostModeSwitchTimes[pacMan.ghostModeSwitchPos]) {
          pacMan.ghostModeTime =
              pacMan.levels.ghostModeSwitchTimes[pacMan.ghostModeSwitchPos] *
              PM_TARGET_FPS;

          switch (pacMan.mainGhostMode) {
            case PM_GHOST_MODE_SCATTER:
              pacMan.switchMainGhostMode(PM_GHOST_MODE_CHASE, false);
              break;
            case PM_GHOST_MODE_CHASE:
              pacMan.switchMainGhostMode(PM_GHOST_MODE_SCATTER, false);
              break;
          }
        }
      }
    }
  }
};

/**
 * If the force pen leave timer goes down (and it does so because of
 * Pac-Man's inactivity = not eating dots), the first available ghost can
 * leave the pen.
 */
pacMan.handleForcePenLeaveTimer = function() {
  if (pacMan.forcePenLeaveTime) {
    pacMan.forcePenLeaveTime--;

    if (pacMan.forcePenLeaveTime <= 0) {
      for (var i = 1; i <= 3; i++) {
        if (pacMan.actors[pacMan.playerCount + i].mode ==
            PM_GHOST_MODE_IN_PEN) {
          pacMan.actors[pacMan.playerCount + i].freeToLeavePen = true;
          break;
        }
      }

      pacMan.resetForcePenLeaveTime();
    }
  }
};

/**
 * Handle various game-related timers.
 */
pacMan.handleTimers = function() {
  if (pacMan.gameplayMode == PM_GAMEPLAY_GAME_IN_PROGRESS) {
    pacMan.handleForcePenLeaveTimer();
    pacMan.handleFruitTimer();
    pacMan.handleGhostModeTimer();
  }

  pacMan.handleGameplayModeTimer();
};

/**
 * Handle a tick (heartbeat) of the game -- this is called every 90 frames
 * per second, or less frequently if the framerate has been adjusted.
 */
pacMan.tick = function() {
  var time = new Date().getTime();
  pacMan.lastTimeDelta += (time - pacMan.lastTime) - pacMan.tickInterval;

  // We don't want to catch up too much because the actors will jump far
  // away
  if (pacMan.lastTimeDelta > PM_MAX_TIME_DELTA) {
    pacMan.lastTimeDelta = PM_MAX_TIME_DELTA;
  }

  // If the delta between ticks is more than 50ms more than 20 times, we
  // fall back to a lower framerate
  if (pacMan.canDecreaseFps && pacMan.lastTimeDelta > PM_TIME_SLOWNESS) {
    pacMan.lastTimeSlownessCount++;

    if (pacMan.lastTimeSlownessCount == PM_MAX_SLOWNESS_COUNT) {
      pacMan.decreaseFps();
    }
  }

  // Subtract extra clicks from the delta, allowing little changes to
  // accumulate.
  var extraTicks = 0;
  if (pacMan.lastTimeDelta > pacMan.tickInterval) {
    extraTicks = Math.floor(pacMan.lastTimeDelta / pacMan.tickInterval);
    pacMan.lastTimeDelta -= pacMan.tickInterval * extraTicks;
  }
  pacMan.lastTime = time;

  // Cutscenes get a little different treatment...
  if (pacMan.gameplayMode == PM_GAMEPLAY_CUTSCENE) {
    for (var i = 0; i < pacMan.tickMultiplier + extraTicks; i++) {
      pacMan.advanceCutscene();
      pacMan.intervalTime = (pacMan.intervalTime + 1) % PM_TARGET_FPS;
      pacMan.globalTime++;
    }
    pacMan.checkCutscene();
    pacMan.blinkScoreLabels();
  } else {
    // ...then all the other modes
    for (var i = 0; i < pacMan.tickMultiplier + extraTicks; i++) {
      pacMan.moveActors();
      if (pacMan.gameplayMode == PM_GAMEPLAY_GAME_IN_PROGRESS) {
        if (pacMan.tilesChanged) {
          pacMan.detectCollisions();
          pacMan.updateActorTargetPositions();
        }
      }

      pacMan.globalTime++;
      pacMan.intervalTime = (pacMan.intervalTime + 1) % PM_TARGET_FPS;

      pacMan.blinkEnergizers();
      pacMan.blinkScoreLabels();
      pacMan.handleTimers();
    }
  }
};

/**
 * Award an extra life to a player.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.extraLife = function(playerId) {
  pacMan.playSound(PM_SOUND_EXTRA_LIFE, PM_CHANNEL_AUX);

  pacMan.extraLifeAwarded[playerId] = true;
  pacMan.lives++;
  if (pacMan.lives > PM_MAX_LIVES) {
    pacMan.lives = PM_MAX_LIVES;
  }

  pacMan.updateChromeLives();
};

/**
 * Add score to player's counter.
 * @param {number} score Score addition.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.addToScore = function(score, playerId) {
  pacMan.score[playerId] += score;

  // Award an extra life if we crossed a 10,000 points boundary.
  if (!pacMan.extraLifeAwarded[playerId] &&
      pacMan.score[playerId] > PM_EXTRA_LIFE_SCORE) {
    pacMan.extraLife(playerId);
  }

  pacMan.updateChromeScore(playerId);
};

/**
 * Update all the chrome surrounding the playfield (level, lives, score).
 */
pacMan.updateChrome = function() {
  pacMan.updateChromeLevel();
  pacMan.updateChromeLives();
  for (var id = 0; id < pacMan.playerCount; id++) {
    pacMan.updateChromeScore(id);
  }
};

/**
 * Updates score counter.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.updateChromeScore = function(playerId) {
  var scoreString = pacMan.score[playerId].toString();

  if (scoreString.length > pacMan.scoreDigits) {
    scoreString = scoreString.substr(scoreString.length - pacMan.scoreDigits,
                                     pacMan.scoreDigits);
  }

  for (var j = 0; j < pacMan.scoreDigits; j++) {
    var el = document.getElementById('pcm-sc-' + (playerId + 1) + '-' + j);
    var digit = scoreString.substr(j, 1);
    if (!digit) {
      pacMan.changeElementBkPos(el, 48, 0, true);
    } else {
      pacMan.changeElementBkPos(el, 8 + 8 * parseInt(digit, 10), 144, true);
    }
  }
};

/**
 * Updates the display of lives (a column of Pac-Man icons in the upper-right
 * corners).
 */
pacMan.updateChromeLives = function() {
  pacMan.livesEl.innerHTML = '';
  for (var i = 0; i < pacMan.lives; i++) {
    var el = document.createElement('div');
    el.className = 'pcm-lif';
    pacMan.prepareElement(el, 64, 129);
    pacMan.livesEl.appendChild(el);
  }
};

/**
 * Update level indicator.
 */
pacMan.updateChromeLevel = function() {
  pacMan.levelEl.innerHTML = '';

  // We're only showing at most four fruit icons
  var count = pacMan.level;
  if (count > PM_LEVEL_CHROME_MAX) {
    count = PM_LEVEL_CHROME_MAX;
  }
  for (var i = pacMan.level;
       i >= Math.max(pacMan.level - PM_LEVEL_CHROME_MAX + 1, 1); i--) {
    if (i >= PM_LEVELS.length) {
      var fruit = PM_LEVELS[PM_LEVELS.length - 1].fruit;
    } else {
      var fruit = PM_LEVELS[i].fruit;
    }

    var el = document.createElement('div');
    var pos = pacMan.getFruitSprite(fruit);
    pacMan.prepareElement(el, pos[0], pos[1]);

    pacMan.levelEl.appendChild(el);
  }

  // Bottom-aligning the icons.
  pacMan.levelEl.style.marginTop =
      ((4 - Math.min(pacMan.level, PM_LEVEL_CHROME_MAX)) * 16) + 'px';
};

/**
 * Create chrome surrounding the playfield -- score displays, level indicator,
 * lives indicator.
 */
pacMan.createChrome = function() {
  // Resetting the canvas to start from scratch.
  pacMan.canvasEl.innerHTML = '';

  if (pacMan.playerCount == 1) {
    pacMan.scoreDigits = 10;
  } else {
    pacMan.scoreDigits = 5;
  }

  pacMan.scoreLabelEl = [];

  // Create the score label (1 UP).
  pacMan.scoreLabelEl[0] = document.createElement('div');
  pacMan.scoreLabelEl[0].id = 'pcm-sc-1-l';
  pacMan.prepareElement(pacMan.scoreLabelEl[0], 160, 56);
  pacMan.canvasEl.appendChild(pacMan.scoreLabelEl[0]);

  // Create the score counter
  pacMan.scoreEl = [];
  pacMan.scoreEl[0] = document.createElement('div');
  pacMan.scoreEl[0].id = 'pcm-sc-1';
  for (var j = 0; j < pacMan.scoreDigits; j++) {
    var el = document.createElement('div');
    el.id = 'pcm-sc-1-' + j;
    el.style.top = (j * 8) + 'px';
    el.style.left = 0;
    el.style.position = 'absolute';
    el.style.width = '8px';
    el.style.height = '8px';
    pacMan.prepareElement(el, 48, 0);
    pacMan.scoreEl[0].appendChild(el);
  }
  pacMan.canvasEl.appendChild(pacMan.scoreEl[0]);

  // Create the lives element (showing little Pac-Man icons for each life)
  pacMan.livesEl = document.createElement('div');
  pacMan.livesEl.id = 'pcm-li';
  pacMan.canvasEl.appendChild(pacMan.livesEl);

  // Create the level element (showing fruit depending on the current level)
  pacMan.levelEl = document.createElement('div');
  pacMan.levelEl.id = 'pcm-le';
  pacMan.canvasEl.appendChild(pacMan.levelEl);

  // Extra elements in Ms. Pac-Man mode (2 UP and second score counter)
  if (pacMan.playerCount == 2) {
    pacMan.scoreLabelEl[1] = document.createElement('div');
    pacMan.scoreLabelEl[1].id = 'pcm-sc-2-l';
    pacMan.prepareElement(pacMan.scoreLabelEl[1], 160, 64);
    pacMan.canvasEl.appendChild(pacMan.scoreLabelEl[1]);

    pacMan.scoreEl[1] = document.createElement('div');
    pacMan.scoreEl[1].id = 'pcm-sc-2';
    for (var j = 0; j < pacMan.scoreDigits; j++) {
      var el = document.createElement('div');
      el.id = 'pcm-sc-2-' + j;
      el.style.top = (j * 8) + 'px';
      el.style.left = 0;
      el.style.position = 'absolute';
      el.style.width = '8px';
      el.style.height = '8px';
      pacMan.prepareElement(el, 48, 0);
      pacMan.scoreEl[1].appendChild(el);
    }
    pacMan.canvasEl.appendChild(pacMan.scoreEl[1]);
  }

  if (pacMan.soundAvailable) {
    pacMan.soundEl = document.createElement('div');
    pacMan.soundEl.id = 'pcm-so';
    pacMan.prepareElement(pacMan.soundEl, -32, -16);
    pacMan.canvasEl.appendChild(pacMan.soundEl);
    pacMan.soundEl.onclick = pacMan.toggleSound;
    pacMan.updateSoundIcon();
  }
};

/**
 * Clear dot eating indicators. Those are used so that dot eating sounds
 * are smooth.
 */
pacMan.clearDotEatingNow = function() {
  pacMan.dotEatingNow = [false, false];
  pacMan.dotEatingNext = [false, false];
};

/**
 * Play a sound.
 * @param {string} soundId Sound id.
 * @param {number} channel Sound channel.
 * @param {boolean} opt_dontStop Whether to stop that channel or not.
 */
pacMan.playSound = function(soundId, channel, opt_dontStop) {
  if (!pacMan.soundAvailable || !google.pacManSound || pacMan.paused) {
    return;
  }

  if (!opt_dontStop) {
    pacMan.stopSoundChannel(channel);
  }

  /** @preserveTry */
  try {
    pacMan.flashSoundPlayer.playTrack(soundId, channel);
  } catch (e) {
    pacMan.soundAvailable = false;
  }
};

/**
 * Stop the sound on a given channel.
 * @param {number} channel Sound channel.
 */
pacMan.stopSoundChannel = function(channel) {
  if (!pacMan.soundAvailable) {
    return;
  }

  /** @preserveTry */
  try {
    pacMan.flashSoundPlayer.stopChannel(channel);
  } catch (e) {
    pacMan.soundAvailable = false;
  }
};

/**
 * Stop all sounds.
 */
pacMan.stopAllAudio = function() {
  if (!pacMan.soundAvailable) {
    return;
  }

  /** @preserveTry */
  try {
    pacMan.flashSoundPlayer.stopAmbientTrack();
  } catch (e) {
    pacMan.soundAvailable = false;
  }

  for (var i = 0; i < PM_SOUND_CHANNEL_COUNT; i++) {
    pacMan.stopSoundChannel(i);
  }
};

/**
 * Play the dot eating sound. We need to alternate between two sounds for
 * Pac-Man.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.playDotEatingSound = function(playerId) {
  if (!pacMan.soundAvailable || !google.pacManSound) {
    return;
  }

  if (pacMan.gameplayMode == PM_GAMEPLAY_GAME_IN_PROGRESS) {
    if (pacMan.dotEatingNow[playerId]) {
      pacMan.dotEatingNext[playerId] = true;
    } else {
      if (playerId == PM_PACMAN) {
        if (pacMan.dotEatingSoundPart[playerId] == 1) {
          var soundId = PM_SOUND_DOT_EATING_PART_1;
        } else {
          var soundId = PM_SOUND_DOT_EATING_PART_2;
        }

        pacMan.playSound(soundId,
            PM_CHANNEL_EATING + pacMan.dotEatingChannel[playerId], true);

        pacMan.dotTimer = window.setInterval(
            pacMan.repeatDotEatingSoundPacMan,
            PM_DOT_EATING_SOUND_INTERVAL);
      } else {
        pacMan.playSound(PM_SOUND_DOT_EATING_DOUBLE,
            PM_CHANNEL_EATING_DOUBLE + pacMan.dotEatingChannel[playerId],
            true);

        pacMan.dotTimerMs = window.setInterval(
            pacMan.repeatDotEatingSoundMsPacMan,
            PM_DOT_EATING_SOUND_INTERVAL);
      }

      pacMan.dotEatingChannel[playerId] =
          (pacMan.dotEatingChannel[playerId] + 1) % PM_MULTI_CHANNEL_COUNT;

      pacMan.dotEatingSoundPart[playerId] =
          3 - pacMan.dotEatingSoundPart[playerId];
    }
  }
};

/**
 * Repeat dot-eating sound if we still need to play it.
 * @param {number} playerId Player id (0 = Pac-Man, 1 = Ms. Pac-Man).
 */
pacMan.repeatDotEatingSound = function(playerId) {
  pacMan.dotEatingNow[playerId] = false;

  if (pacMan.dotEatingNext[playerId]) {
    pacMan.dotEatingNext[playerId] = false;
    pacMan.playDotEatingSound(playerId);
  }
};

/**
 * Repeat dot-eating sound for Pac-Man.
 */
pacMan.repeatDotEatingSoundPacMan = function() {
  pacMan.repeatDotEatingSound(PM_PACMAN);
};

/**
 * Repeat dot-eating sound for Ms. Pac-Man.
 */
pacMan.repeatDotEatingSoundMsPacMan = function() {
  pacMan.repeatDotEatingSound(PM_MS_PACMAN);
};

/**
 * Play an ambient sound. There's always an ambient, repeating sound in
 * the game that depends on the game mode.
 */
pacMan.playAmbientSound = function() {
  if (!pacMan.soundAvailable || !google.pacManSound) {
    return;
  }

  var soundId = 0;
  if (pacMan.gameplayMode == PM_GAMEPLAY_GAME_IN_PROGRESS ||
      pacMan.gameplayMode == PM_GAMEPLAY_GHOST_BEING_EATEN) {
    if (pacMan.ghostEyesCount) {
      soundId = PM_SOUND_AMBIENT_EYES;
    } else if (pacMan.mainGhostMode == PM_GHOST_MODE_FRIGHT) {
      soundId = PM_SOUND_AMBIENT_FRIGHT;
    } else {
      if (pacMan.dotsEaten > PM_SOUND_AMBIENT_4_DOTS) {
        soundId = PM_SOUND_AMBIENT_4;
      } else if (pacMan.dotsEaten > PM_SOUND_AMBIENT_3_DOTS) {
        soundId = PM_SOUND_AMBIENT_3;
      } else if (pacMan.dotsEaten > PM_SOUND_AMBIENT_2_DOTS) {
        soundId = PM_SOUND_AMBIENT_2;
      } else {
        soundId = PM_SOUND_AMBIENT_1;
      }
    }
  } else if (pacMan.gameplayMode == PM_GAMEPLAY_CUTSCENE) {
    soundId = PM_SOUND_AMBIENT_CUTSCENE;
  }

  if (soundId) {
    /** @preserveTry */
    try {
      pacMan.flashSoundPlayer.playAmbientTrack(soundId);
    } catch (e) {
      pacMan.soundAvailable = false;
    }
  }
};

/**
 * (Re)initialize the main tick timer. The tick timer ticks 90 times per
 * seconds and keeps the game alive.
 */
pacMan.initializeTickTimer = function() {
  window.clearInterval(pacMan.tickTimer);

  // We're starting with 90fps, but the game can decrease it to 45fps or
  // even 30fps if necessary.
  pacMan.fps = PM_ALLOWED_FPS[pacMan.fpsChoice];
  pacMan.tickInterval = 1000 / pacMan.fps;
  
  if (pacMan.debugSlower) {
    pacMan.tickInterval *= 4;
  }

  // This is 1 for 90fps, 2 for 45fps and 3 for 30fps. It means how often
  // the game logic will be updated compared to screen update.
  pacMan.tickMultiplier = PM_TARGET_FPS / pacMan.fps;

  // Translate all the timer values from seconds to ticks.
  pacMan.timing = {};
  for (var i in PM_TIMING) {

    // We're shortening the READY! screen if there's no sound as we don't
    // have to accomodate the music.
    if (!google.pacManSound &&
        (i == PM_TIMING_READY_PART_1 || i == PM_TIMING_READY_PART_2)) {
      var timing = 1;
    } else {
      var timing = PM_TIMING[i];
    }

    pacMan.timing[i] = Math.round(timing * PM_TARGET_FPS);
  }

  pacMan.lastTime = new Date().getTime();
  pacMan.lastTimeDelta = 0;
  pacMan.lastTimeSlownessCount = 0;

  pacMan.tickTimer = window.setInterval(pacMan.tick, pacMan.tickInterval);
};

/**
 * If the game seems to slow (choppy), we decrease the framerate from 90
 * to 45, or from 45 to 30 seconds.
 */
pacMan.decreaseFps = function() {
  if (pacMan.fpsChoice < PM_ALLOWED_FPS.length - 1) {
    pacMan.fpsChoice++;
    pacMan.initializeTickTimer();

    if (pacMan.fpsChoice == PM_ALLOWED_FPS.length - 1) {
      pacMan.canDecreaseFps = false;
    }
  }
};

/**
 * Add the necessary CSS rules.
 */
pacMan.addCss = function() {
  var cssCode = [
    '#pcm-c {',
    '  width: 554px;',
    '  border-top: 25px solid black;',
    '  padding-bottom: 25px;',
    '  height: 136px;',
    '  position: relative;',
    '  background: black;',
    '  outline: 0;',
    '  overflow: hidden;',
    '  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);',
    '}',
    '#pcm-c * {',
    '  position: absolute;',
    '  overflow: hidden;',
    '}',
    '#pcm-p,',
    '#pcm-cc {',
    '  left: 45px;',
    '  width: 464px;',
    '  height: 136px;',
    '  z-index: 99;',
    '  overflow: hidden;',
    '}',
    '#pcm-p .pcm-d {',
    '  width: 2px;',
    '  height: 2px;',
    '  margin-left: 3px;',
    '  margin-top: 3px;',
    '  background: #f8b090;',
    '  z-index: 100;',
    '}',
    '#pcm-p .pcm-e {',
    '  width: 8px;',
    '  height: 8px;',
    '  z-index: 101;',
    '}',
    '#pcm-sc-1 {',
    '  left: 18px;',
    '  top: 16px;',
    '  width: 8px;',
    '  height: 56px;',
    '  position: absolute;',
    '  overflow: hidden;',
    '}',
    '#pcm-sc-2 {',
    '  left: 18px;',
    '  top: 80px;',
    '  width: 8px;',
    '  height: 56px;',
    '  position: absolute;',
    '  overflow: hidden;',
    '}',
    '#pcm-le {',
    '  position: absolute;',
    '  left: 515px;',
    '  top: 74px;',
    '  height: 64px;',
    '  width: 32px;',
    '} ',
    '#pcm-le div {',
    '  position: relative;',
    '}',
    '#pcm-sc-1-l {  ',
    '  left: -2px;',
    '  top: 0;',
    '  width: 48px;',
    '  height: 8px;',
    '}',
    '#pcm-sc-2-l {  ',
    '  left: -2px;',
    '  top: 64px;',
    '  width: 48px;',
    '  height: 8px;',
    '}',
    '#pcm-so {',
    '  left: 7px;',
    '  top: 116px;',
    '  width: 12px;',
    '  height: 12px;',
    '  border: 8px solid black;',
    '  cursor: pointer;',
    '}',
    '#pcm-li {',
    '  position: absolute;',
    '  left: 523px;',
    '  top: 0;',
    '  height: 80px;',
    '  width: 16px;',
    '}',
    '#pcm-li .pcm-lif {',
    '  position: relative;',
    '  width: 16px;',
    '  height: 12px;',
    '  margin-bottom: 3px;',
    '}',
    '#pcm-p.blk .pcm-e {',
    '  visibility: hidden;',
    '}',
    '#pcm-c .pcm-ac {',
    '  width: 16px;',
    '  height: 16px;',
    '  margin-left: -4px;',
    '  margin-top: -4px;',
    '  z-index: 110;',
    '}',
    '#pcm-c .pcm-n {',
    '  z-index: 111;',
    '}',
    '#pcm-c #pcm-stck {',
    '  z-index: 109;',
    '}',
    '#pcm-c #pcm-gbug {',
    '  width: 32px;',
    '}',
    '#pcm-c #pcm-bpcm {',
    '  width: 32px;',
    '  height: 32px;',
    '  margin-left: -20px;',
    '  margin-top: -20px;',
    '}',
    '#pcm-f,',
    '#pcm-le div {',
    '  width: 32px;',
    '  height: 16px;',
    '  z-index: 105;',
    '}',
    '#pcm-f {',
    '  margin-left: -8px;',
    '  margin-top: -4px;',
    '}',
    '#pcm-do {',
    '  width: 19px;',
    '  height: 2px;',
    '  left: 279px;',
    '  top: 46px;',
    '  overflow: hidden;',
    '  position: absolute;',
    '  background: #ffaaa5;',
    '}',
    '#pcm-re {',
    '  width: 48px;',
    '  height: 8px;',
    '  z-index: 120;',
    '  left: 264px;',
    '  top: 80px;',
    '}',
    '#pcm-go {',
    '  width: 80px;',
    '  height: 8px;',
    '  z-index: 120;',
    '  left: 248px;',
    '  top: 80px;',
    '}'].join('');

  pacMan.addCssCode(cssCode);
};

pacMan.removeCssCodeByClassName = function(className) {
  do {
    var remainder = false;
    var els = document.getElementsByClassName(className);
    if (els && els[0]) {
      remainder = true;
      els[0].parentNode.removeChild(els[0]);
    }
  } while (remainder);  
};

pacMan.addCssCode = function(cssCode, className) {
  pacMan.styleElement = document.createElement('style');
  pacMan.styleElement.type = 'text/css';
  pacMan.styleElement.className = 'pacman-css';
  
  if (className) {
    pacMan.styleElement.className += ' ' + className;
  }
  
  if (pacMan.styleElement.styleSheet) {
    pacMan.styleElement.styleSheet.cssText = cssCode;
  } else {
    pacMan.styleElement.appendChild(document.createTextNode(cssCode));
  }
  document.getElementsByTagName('head')[0].appendChild(pacMan.styleElement);
};

/**
 * Creates the main canvas element
 */
pacMan.createCanvasElement = function() {
  pacMan.canvasEl = document.createElement('div');
  pacMan.canvasEl.id = 'pcm-c';
  // Fixes the annoying border when focusing on IE.
  pacMan.canvasEl.hideFocus = true;

  pacMan.masterElement.appendChild(pacMan.canvasEl);

  // Focusing on the element so that up/right arrow do not invoke things
  // in the search box or elsewhere.
  pacMan.canvasEl.tabIndex = 0;
  pacMan.canvasEl.focus();
};

/**
 * Start the process once everything's loaded.
 */
pacMan.everythingIsReady = function() {
  if (pacMan.ready) {
    return;
  }
  pacMan.ready = true;
  
  pacMan.debugPaused = false;
  pacMan.debugSlower = false;
  pacMan.debugSprites = 0;
  pacMan.debugTargetTiles = 0;

  // Remove the loading message
  var el = pacMan.masterElement.getElementsByClassName('logo-l')[0];

  el.parentNode.removeChild(el);
  // Remove the doodle (not removed if autoplay)
  //document.getElementById('logo').style.background = 'black';

  pacMan.addCss();
  
  pacMan.createCanvasElement();

  pacMan.speedIntervals = [];

  pacMan.oppositeDirections = [];
  pacMan.oppositeDirections[PM_DIR_UP] = PM_DIR_DOWN;
  pacMan.oppositeDirections[PM_DIR_DOWN] = PM_DIR_UP;
  pacMan.oppositeDirections[PM_DIR_LEFT] = PM_DIR_RIGHT;
  pacMan.oppositeDirections[PM_DIR_RIGHT] = PM_DIR_LEFT;

  pacMan.addEventListeners();
  pacMan.fpsChoice = 0;
  pacMan.canDecreaseFps = true;

  pacMan.initializeTickTimer();
  
  pacMan.newGame();
};

pacMan.cleanUp = function() {
  window.clearInterval(pacMan.tickTimer);

  pacMan.flashIframe.parentNode.removeChild(pacMan.flashIframe);
  
  pacMan.removeEventListeners(); 
  
  pacMan.removeCssCodeByClassName('pacman-css'); 

  pacMan.masterElement.style.background = '';  
  pacMan.masterElement.innerHTML = '';

}

/**
 * Checks whether both sounds and graphics have been loaded. If so,
 * proceed, but with little delay to allow Flash to find its bearings.
 */
pacMan.checkIfEverythingIsReady = function() {
  if (pacMan.soundReady || pacMan.graphicsReady) {
    pacMan.updateLoadingProgress(.67);
  }

  if (pacMan.soundReady && pacMan.graphicsReady) {
    pacMan.updateLoadingProgress(1);
    pacMan.everythingIsReady();
  }
};

/**
 * Preloads an image so that we know it's in the cache when we start the
 * game
 * @param {string} url URL of the image.
 */
pacMan.preloadImage = function(url) {
  var img = new Image();
  var isMSIE = navigator.userAgent.indexOf('MSIE') != -1;

  if (!isMSIE) {
    img.onload = pacMan.imageLoaded;
  }
  img.src = url;

  // IE doesn't call onload when the image is in the cache. In that case,
  // we assume image loaded.
  if (isMSIE) {
    pacMan.imageLoaded();
  }
};

/**
 * Gets called when the image is loaded.
 */
pacMan.imageLoaded = function() {
  pacMan.graphicsReady = true;
  pacMan.checkIfEverythingIsReady();
};

/**
 * Preload all the necessary graphics (actually, just one image).
 */
pacMan.prepareGraphics = function() {
  pacMan.graphicsReady = false;
  pacMan.preloadImage('files/sprite.png');
};

/**
 * Trims white spaces to the left and right of a string.
 * Function lifted from Closure.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
pacMan.trimString = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};

/**
 * Compares elements of a version number.
 * Function lifted from Closure.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
pacMan.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};

/**
 * Compares two version numbers.
 * Function lifted from Closure.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
pacMan.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = pacMan.trimString(String(version1)).split('.');
  var v2Subs = pacMan.trimString(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier.
      // Next, the qualifiers are compared as strings.
      order = pacMan.compareElements_(v1CompNum, v2CompNum) ||
          pacMan.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          pacMan.compareElements_(v1Comp[2], v2Comp[2]);
    // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};

/**
 * Gets/normalizes the Flash version.
 * Function lifted from google3/javascript/closure/useragent/flash.js
 * @param {string} desc Description from MIME or plugin.
 * @return {string} Three-segment version (e.g. 10.1.2).
 */
pacMan.getFlashVersion = function(desc) {
  var matches = desc.match(/[\d]+/g);
  matches.length = 3; // To standardize IE vs. FF
  return matches.join('.');
};

/**
 * Detects the presence and version of Flash.
 * Function lifted from google3/javascript/closure/useragent/flash.js
 */
pacMan.detectFlash = function() {
  var hasFlash = false;
  var flashVersion = '';

  if (navigator.plugins && navigator.plugins.length) {
    var plugin = navigator.plugins['Shockwave Flash'];
    if (plugin) {
      hasFlash = true;
      if (plugin.description) {
        flashVersion = pacMan.getFlashVersion(plugin.description);
      }
    }

    if (navigator.plugins['Shockwave Flash 2.0']) {
      hasFlash = true;
      flashVersion = '2.0.0.11';
    }

  } else if (navigator.mimeTypes && navigator.mimeTypes.length) {
    var mimeType = navigator.mimeTypes['application/x-shockwave-flash'];
    hasFlash = mimeType && mimeType.enabledPlugin;
    if (hasFlash) {
      var description = mimeType.enabledPlugin.description;
      flashVersion = pacMan.getFlashVersion(description);
    }

  } else {
    /** @preserveTry */
    try {
      // Try 7 first, since we know we can use GetVariable with it
      var ax = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.7');
      hasFlash = true;
      flashVersion = pacMan.getFlashVersion(ax.GetVariable('$version'));
    } catch (e) {
      // Try 6 next, some versions are known to crash with GetVariable calls
      /** @preserveTry */
      try {
        var ax = new ActiveXObject('ShockwaveFlash.ShockwaveFlash.6');
        hasFlash = true;
        flashVersion = '6.0.21'; // First public version of Flash 6
      } catch (e2) {
        /** @preserveTry */
        try {
          // Try the default activeX
          var ax = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
          hasFlash = true;
          flashVersion = pacMan.getFlashVersion(ax.GetVariable('$version'));
        } catch (e3) {
          // No flash
        }
      }
    }
  }

  pacMan.hasFlash = hasFlash;
  pacMan.flashVersion = flashVersion;
};

/**
 * Test whether the version of installed Flash is the same or higher than
 * required.
 * @param {string} version Version of Flash required (e.g. 10.0.0.0).
 * @return {boolean} True if compatible, false if not.
 */
pacMan.isFlashVersion = function(version) {
  return pacMan.compareVersions(pacMan.flashVersion, version) >= 0;
};

/**
 * Create a Flash controller to host sound, if Flash is available.
 * Originally, we tried to do HTML5 audio, but it proved unreliable even
 * to use in browsers that nominally support it.
 */
pacMan.prepareSound = function() {
  pacMan.soundAvailable = false;
  pacMan.soundReady = false;

  pacMan.detectFlash();

  // Don't even try if no Flash.
  if (!pacMan.hasFlash || !pacMan.isFlashVersion(PM_MIN_FLASH_VERSION)) {
    pacMan.soundReady = true;
    pacMan.checkIfEverythingIsReady();
    return;
  }

  // For some reason, creating an <object> in DOM failed in IE. We need
  // to put it in separate iframe to use document.write. The frame also
  // needs to be a certain size for IE to use it.
  pacMan.flashIframe = document.createElement('iframe');
  pacMan.flashIframe.name = 'pm-sound';
  pacMan.flashIframe.style.position = 'absolute';
  pacMan.flashIframe.style.top = '-150px';
  pacMan.flashIframe.style.border = 0;
  pacMan.flashIframe.style.width = '100px';
  pacMan.flashIframe.style.height = '100px';
  document.body.appendChild(pacMan.flashIframe);

  pacMan.flashIframeDoc = pacMan.flashIframe.contentDocument;
  if (pacMan.flashIframeDoc == undefined || pacMan.flashIframeDoc == null) {
    pacMan.flashIframeDoc = pacMan.flashIframe.contentWindow.document;
  }

  pacMan.flashIframeDoc.open();
  pacMan.flashIframeDoc.write(
    '<html><head></head><body>' +
    '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" ' +
    'codebase="http://download.macromedia.com/pub/shockwave/' +
    'cabs/flash/swflash.cab#version=9,0,0,0" width="0" height="0" ' +
    'id="pacman-sound-player" type="application/x-shockwave-flash"> ' +
    '<param name="movie" value="files/sound.swf"> ' +
    '<param name="allowScriptAccess" value="always"> ' +
    '<object id="pacman-sound-player-2"  ' +
    'type="application/x-shockwave-flash" ' +
    'data="files/sound.swf" ' +
    'width="0" height="0"><param name="allowScriptAccess" value="always"> ' +
    '</object></object></body></html>');
  pacMan.flashIframeDoc.close();

  window.setTimeout(pacMan.flashNotReady, PM_FLASH_NOT_READY_TIMEOUT);
};

/**
 * Flash is not ready or available in time. We proceed as if Flash wasn't
 * present.
 */
pacMan.flashNotReady = function() {
  if (!pacMan.ready) {
    pacMan.soundAvailable = false;
    pacMan.soundReady = true;
    pacMan.checkIfEverythingIsReady();
  }
};

/**
 * Flash is ready.
 * @param {Element} el DOM element.
 */
pacMan.flashReady = function(el) {
  pacMan.flashSoundPlayer = el;
  //pacMan.soundAvailable = true;
  //pacMan.soundReady = true;
  pacMan.soundAvailable = false;
  pacMan.soundReady = false;
  pacMan.checkIfEverythingIsReady();
};

/**
 * Callback function whenever the Flash sound controller loads and reports
 * ready. We try to find the controller, and then proceed with game loading.
 */
pacMan.flashLoaded = function() {
  if (pacMan.flashIframeDoc) {
    var el = pacMan.flashIframeDoc.getElementById('pacman-sound-player');

    if (el && el.playTrack) {
      pacMan.flashReady(el);
      return;
    } else {
      var el = pacMan.flashIframeDoc.getElementById('pacman-sound-player-2');

      if (el && el.playTrack) {
        pacMan.flashReady(el);
        return;
      }
    }
  }

  // In this case, Flash loads, but we can't find the controller. We fall
  // back to no sound.
  pacMan.flashNotReady();
};

/**
 * Export external function calls.
 */
pacMan.exportFunctionCalls = function() {
  google = {};
  
  google.pacman = {};
  
  // google.pacManSound = true;
  google.pacManSound = false;

  // This function is called when pressing the button on the homepage
  google.pacman.insertCoin = pacMan.insertCoin;

  // This function is called from Flash sound controller
  google.pacman.flashLoaded = pacMan.flashLoaded;
};

/**
 * Update the loading progress bar shown before the game loads.
 * @param {number} progress Number from 0.0 to 1.0.
 */
pacMan.updateLoadingProgress = function(progress) {
  var val = Math.round(progress * 200);
  pacMan.masterElement.getElementsByClassName('logo-b')[0].style.width = val + 'px';
};

/**
 * Start the loading process.
 */
pacMan.init = function(el, mode) {
  pacMan.masterElement = el;
  
  pacMan.mode = mode;
  
  pacMan.masterElement.style.background = 'black';
  
  pacMan.masterElement.innerHTML = '<div class="logo-l"><div class="logo-b"></div></div>';
  
  pacMan.ready = false;

  // Remove the alt text from the doodle so it doesn't appear when the user
  // hovers the mouse over the game.
  pacMan.masterElement.title = '';
  
  pacMan.updateLoadingProgress(.33);
  pacMan.exportFunctionCalls();

  // In case of old Internet Explorers we give up on using CSS for spriting
  // because of the bugs that make IE reload the same image over and over
  // again.
  if (navigator.userAgent.indexOf('MSIE 5.') != -1 ||
      navigator.userAgent.indexOf('MSIE 6.') != -1 ||
      navigator.userAgent.indexOf('MSIE 7.') != -1) {
    pacMan.useCss = false;
  } else {
    pacMan.useCss = true;
  }
  
  
  /* DEBUG */
  pacMan.useCss = false;
  

  pacMan.prepareGraphics();
  pacMan.prepareSound();
};
