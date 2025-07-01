/**
 * Main Game Setup and Scene Management
 * 
 * This is the entry point of the game. It handles:
 * - Loading all game assets (sprites, animations)
 * - Creating game scenes (levels)
 * - Setting up game mechanics for each level
 * - Managing scene transitions
 */

import { k } from "./kaboomCtx";
import { makeMap } from "./utils";
import {
    makeBirdEnemy,
    makeFlameEnemy,
    makeGuyEnemy,
    makePlayer,
    setControls,
} from "./entities";
import { globalGameState } from "./state";

/**
 * Main game initialization function
 * Loads all assets, creates scenes, and starts the game
 */
async function gameSetup() {
    // Load the main sprite sheet with all character animations
    // The sprite sheet is divided into a 9x10 grid of frames
    k.loadSprite("assets", "./kirby-like.png", {
        sliceX: 9,          // 9 columns of sprites
        sliceY: 10,         // 10 rows of sprites
        anims: {
            // Kirby animations (frames 0-8 on first row)
            kirbIdle: 0,                                            // Idle state
            kirbInhaling: 1,                                        // Inhaling pose
            kirbFull: 2,                                            // Full/swollen state
            kirbInhaleEffect: { from: 3, to: 8, speed: 15, loop: true },  // Swirling inhale effect
            shootingStar: 9,                                        // Star projectile

            // Flame enemy animation (frames 36-37)
            flame: { from: 36, to: 37, speed: 4, loop: true },

            // Guy enemy animations (frames 18-19)
            guyIdle: 18,                                            // Standing still
            guyWalk: { from: 18, to: 19, speed: 4, loop: true },   // Walking animation

            // Bird enemy animation (frames 27-28)
            bird: { from: 27, to: 28, speed: 4, loop: true },      // Flying animation
        },
    });

    // Load level background images
    k.loadSprite("level-1", "./level-1.png");                      // First level background
    k.loadSprite("level-2", "./level-2.png");                      // Second level background

    // Load map data and create level layouts from Tiled JSON files
    // This processes collision areas, spawn points, and level geometry
    const { map: level1Layout, spawnPoints: level1SpawnPoints } = await makeMap(
        k,
        "level-1"
    );

    const { map: level2Layout, spawnPoints: level2SpawnPoints } = await makeMap(
        k,
        "level-2"
    );

    /**
     * LEVEL 1 SCENE
     * First level with basic enemies and mechanics introduction
     */
    k.scene("level-1", async () => {
        // Set up scene state
        globalGameState.setCurrentScene("level-1");
        globalGameState.setNextScene("level-2");

        // Configure physics
        k.setGravity(2100);                                         // Gravity strength

        // Add background color (pink background)
        k.add([
            k.rect(k.width(), k.height()),                          // Full screen rectangle
            k.color(k.Color.fromHex("#f7d7db")),                   // Light pink color
            k.fixed(),                                              // Fixed position (doesn't move with camera)
        ]);

        // Add the level layout (platforms, background, etc.)
        k.add(level1Layout);

        // Create and configure the player character
        const kirb = makePlayer(
            k,
            level1SpawnPoints.player[0].x,                          // X position from map data
            level1SpawnPoints.player[0].y                           // Y position from map data
        );

        // Set up player controls
        setControls(k, kirb);
        k.add(kirb);                                                // Add player to scene

        // Configure camera
        k.camScale(k.vec2(0.7));                                   // Zoom out slightly for better view
        k.onUpdate(() => {
            // Follow player with camera, but stop at level boundary
            if (kirb.pos.x < level1Layout.pos.x + 432)
                k.camPos(kirb.pos.x + 500, 800);                   // Offset camera position
        });

        // Spawn flame enemies at designated spawn points
        for (const flame of level1SpawnPoints.flame) {
            makeFlameEnemy(k, flame.x, flame.y);
        }

        // Spawn guy enemies at designated spawn points
        for (const guy of level1SpawnPoints.guy) {
            makeGuyEnemy(k, guy.x, guy.y);
        }

        // Spawn bird enemies periodically at designated spawn points
        for (const bird of level1SpawnPoints.bird) {
            const possibleSpeeds = [100, 200, 300];                // Random speed options
            k.loop(10, () => {                                      // Spawn every 10 seconds
                makeBirdEnemy(
                    k,
                    bird.x,
                    bird.y,
                    possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]  // Random speed
                );
            });
        }
    });

    /**
     * LEVEL 2 SCENE
     * Second level with increased difficulty and more enemies
     */
    k.scene("level-2", () => {
        // Set up scene state
        globalGameState.setCurrentScene("level-2");
        globalGameState.setNextScene("level-1");                   // Loop back to level 1 for now

        // Configure physics
        k.setGravity(2100);

        // Add background color
        k.add([
            k.rect(k.width(), k.height()),
            k.color(k.Color.fromHex("#f7d7db")),
            k.fixed(),
        ]);

        // Add the level layout
        k.add(level2Layout);

        // Create and configure the player character
        const kirb = makePlayer(
            k,
            level2SpawnPoints.player[0].x,
            level2SpawnPoints.player[0].y
        );

        setControls(k, kirb);
        k.add(kirb);

        // Configure camera for level 2 (different boundaries)
        k.camScale(k.vec2(0.7));
        k.onUpdate(() => {
            if (kirb.pos.x < level2Layout.pos.x + 2100)            // Different boundary for level 2
                k.camPos(kirb.pos.x + 500, 800);
        });

        // Spawn all enemy types for level 2
        for (const flame of level2SpawnPoints.flame) {
            makeFlameEnemy(k, flame.x, flame.y);
        }

        for (const guy of level2SpawnPoints.guy) {
            makeGuyEnemy(k, guy.x, guy.y);
        }

        for (const bird of level2SpawnPoints.bird) {
            const possibleSpeeds = [100, 200, 300];
            k.loop(10, () => {
                makeBirdEnemy(
                    k,
                    bird.x,
                    bird.y,
                    possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
                );
            });
        }
    });

    // End scene (placeholder for game completion)
    k.scene("end", () => { });

    // Start the game with level 1
    k.go("level-1");
}

// Initialize and start the game
gameSetup();