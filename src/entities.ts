/**
 * Game Entities and Character Logic
 * 
 * This module defines all the game entities (player, enemies) and their behaviors.
 * It includes the player character (Kirby), enemy types, and their interaction systems.
 * Each entity has specific behaviors, animations, and collision handling.
 */

import type {
    AreaComp,
    BodyComp,
    DoubleJumpComp,
    GameObj,
    HealthComp,
    KaboomCtx,
    OpacityComp,
    PosComp,
    ScaleComp,
    SpriteComp,
} from "kaboom";
import { scale } from "./constants";
import { globalGameState } from "./state";

// Type definition for the player game object with all required components
type PlayerGameObj = GameObj<
    SpriteComp &        // Sprite rendering
    AreaComp &          // Collision detection
    BodyComp &          // Physics body
    PosComp &           // Position
    ScaleComp &         // Scaling
    DoubleJumpComp &    // Double jump ability
    HealthComp &        // Health system
    OpacityComp & {     // Transparency for damage effects
        speed: number;           // Movement speed
        direction: string;       // Current facing direction
        isInhaling: boolean;     // Whether Kirby is currently inhaling
        isFull: boolean;         // Whether Kirby has inhaled an enemy
    }
>;

/**
 * Creates the player character (Kirby) with all necessary components and behaviors
 * 
 * @param k - Kaboom.js context
 * @param posX - Initial X position (in tile coordinates)
 * @param posY - Initial Y position (in tile coordinates)
 * @returns The player game object
 */
export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
    const player = k.make([
        k.sprite("assets", { anim: "kirbIdle" }),                    // Kirby sprite with idle animation
        k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10) }),      // Collision box
        k.body(),                                                    // Physics body for gravity/movement
        k.pos(posX * scale, posY * scale),                          // Position scaled from tile coordinates
        k.scale(scale),                                             // Scale the sprite
        k.doubleJump(10),                                           // Enable double jump with height 10
        k.health(3),                                                // 3 health points
        k.opacity(1),                                               // Full opacity initially
        {
            speed: 300,           // Movement speed in pixels per second
            direction: "right",   // Start facing right
            isInhaling: false,    // Not inhaling initially
            isFull: false,        // Not full initially
        },
        "player",  // Tag for identification
    ]);

    // Handle collision with enemies
    player.onCollide("enemy", async (enemy: GameObj) => {
        // If inhaling and enemy can be inhaled, consume the enemy
        if (player.isInhaling && enemy.isInhalable) {
            player.isInhaling = false;
            k.destroy(enemy);      // Remove enemy from game
            player.isFull = true;  // Kirby becomes full
            return;
        }

        // If player dies, restart the current scene
        if (player.hp() === 0) {
            k.destroy(player);
            k.go(globalGameState.currentScene);
            return;
        }

        // Take damage and show damage effect with opacity animation
        player.hurt();
        await k.tween(
            player.opacity,
            0,                    // Fade to transparent
            0.05,                 // Duration
            (val) => (player.opacity = val),
            k.easings.linear
        );
        await k.tween(
            player.opacity,
            1,                    // Fade back to solid
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
    });

    // Handle collision with level exit
    player.onCollide("exit", () => {
        k.go(globalGameState.nextScene);  // Go to next level
    });

    // Create the inhale effect visual (the swirling effect when inhaling)
    const inhaleEffect = k.add([
        k.sprite("assets", { anim: "kirbInhaleEffect" }),
        k.pos(),
        k.scale(scale),
        k.opacity(0),  // Start invisible
        "inhaleEffect",
    ]);

    // Create the inhale zone (invisible collision area for inhaling enemies)
    const inhaleZone = player.add([
        k.area({ shape: new k.Rect(k.vec2(0), 20, 4) }),  // Wide, thin rectangle
        k.pos(),
        "inhaleZone",
    ]);

    // Update inhale zone and effect position based on player direction
    // Update inhale zone and effect position based on player direction
    inhaleZone.onUpdate(() => {
        if (player.direction === "left") {
            inhaleZone.pos = k.vec2(-14, 8);                        // Position zone to the left
            inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);  // Position effect to the left
            inhaleEffect.flipX = true;                              // Flip effect sprite
            return;
        }
        inhaleZone.pos = k.vec2(14, 8);                             // Position zone to the right
        inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0);     // Position effect to the right
        inhaleEffect.flipX = false;                                 // Don't flip effect sprite
    });

    // Check if player falls off the level (death condition)
    player.onUpdate(() => {
        if (player.pos.y > 2000) {                                  // If player falls too far down
            k.go(globalGameState.currentScene);                     // Restart current scene
        }
    });

    return player;
}

/**
 * Sets up input controls for the player character
 * 
 * @param k - Kaboom.js context
 * @param player - The player game object to control
 */
export function setControls(k: KaboomCtx, player: PlayerGameObj) {
    const inhaleEffectRef = k.get("inhaleEffect")[0];  // Get reference to inhale effect

    // Handle continuous key presses (movement and inhaling)
    k.onKeyDown((key) => {
        switch (key) {
            case "left":
                player.direction = "left";                          // Set direction
                player.flipX = true;                                // Flip sprite to face left
                player.move(-player.speed, 0);                     // Move left
                break;
            case "right":
                player.direction = "right";                         // Set direction
                player.flipX = false;                               // Don't flip sprite (face right)
                player.move(player.speed, 0);                      // Move right
                break;
            case "z":
                if (player.isFull) {
                    player.play("kirbFull");                        // Show full animation
                    inhaleEffectRef.opacity = 0;                    // Hide inhale effect
                    break;
                }

                player.isInhaling = true;                           // Start inhaling
                player.play("kirbInhaling");                        // Play inhaling animation
                inhaleEffectRef.opacity = 1;                        // Show inhale effect
                break;
            default:
        }
    });

    // Handle single key presses (jumping)
    k.onKeyPress((key) => {
        switch (key) {
            case "x":
                player.doubleJump();                                // Perform double jump
                break;
            default:
        }
    });

    // Handle key releases (stop inhaling, shoot projectile)
    k.onKeyRelease((key) => {
        switch (key) {
            case "z":
                if (player.isFull) {
                    player.play("kirbInhaling");                    // Switch to inhaling animation

                    // Create and shoot a star projectile
                    const shootingStar = k.add([
                        k.sprite("assets", {
                            anim: "shootingStar",
                            flipX: player.direction === "right",    // Flip based on direction
                        }),
                        k.area({ shape: new k.Rect(k.vec2(5, 4), 6, 6) }),  // Collision box
                        k.pos(
                            player.direction === "left"
                                ? player.pos.x - 80                 // Shoot left
                                : player.pos.x + 80,               // Shoot right
                            player.pos.y + 5
                        ),
                        k.scale(scale),
                        player.direction === "left"
                            ? k.move(k.LEFT, 800)                   // Move projectile left
                            : k.move(k.RIGHT, 800),                 // Move projectile right
                        "shootingStar",
                    ]);

                    // Destroy projectile when it hits a platform
                    shootingStar.onCollide("platform", () => k.destroy(shootingStar));

                    player.isFull = false;                          // Kirby is no longer full
                    k.wait(1, () => player.play("kirbIdle"));      // Return to idle after 1 second
                    break;
                }

                // Stop inhaling
                inhaleEffectRef.opacity = 0;                        // Hide inhale effect
                player.isInhaling = false;                          // Stop inhaling
                player.play("kirbIdle");                            // Return to idle animation
                break;
            default:
        }
    });
}

/**
 * Makes an enemy inhalable by Kirby and reactive to star projectiles
 * This function adds the necessary collision detection and behavior
 * 
 * @param k - Kaboom.js context
 * @param enemy - The enemy game object to make inhalable
 */
export function makeInhalable(k: KaboomCtx, enemy: GameObj) {
    // When enemy enters inhale zone, mark it as inhalable
    enemy.onCollide("inhaleZone", () => {
        enemy.isInhalable = true;
    });

    // When enemy leaves inhale zone, mark it as not inhalable
    enemy.onCollideEnd("inhaleZone", () => {
        enemy.isInhalable = false;
    });

    // Handle collision with star projectiles
    enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
        k.destroy(enemy);                                           // Destroy enemy
        k.destroy(shootingStar);                                    // Destroy projectile
    });

    // Get reference to player for inhaling behavior
    const playerRef = k.get("player")[0];

    // Update enemy behavior when being inhaled
    enemy.onUpdate(() => {
        if (playerRef.isInhaling && enemy.isInhalable) {
            // Pull enemy toward Kirby when being inhaled
            if (playerRef.direction === "right") {
                enemy.move(-800, 0);                                // Pull left (toward Kirby facing right)
                return;
            }
            enemy.move(800, 0);                                     // Pull right (toward Kirby facing left)
        }
    });
}

/**
 * Creates a flame enemy with jumping behavior
 * 
 * @param k - Kaboom.js context
 * @param posX - X position in tile coordinates
 * @param posY - Y position in tile coordinates
 * @returns The flame enemy game object
 */
export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number) {
    const flame = k.add([
        k.sprite("assets", { anim: "flame" }),                      // Flame sprite with animation
        k.scale(scale),
        k.pos(posX * scale, posY * scale),                          // Position scaled from tile coordinates
        k.area({
            shape: new k.Rect(k.vec2(4, 6), 8, 10),                // Collision box
            collisionIgnore: ["enemy"],                             // Don't collide with other enemies
        }),
        k.body(),                                                   // Physics body for gravity
        k.state("idle", ["idle", "jump"]),                         // State machine: idle or jumping
        "enemy",
    ]);

    makeInhalable(k, flame);  // Make this enemy inhalable

    // State: idle - wait then jump
    flame.onStateEnter("idle", async () => {
        await k.wait(1);                                            // Wait 1 second
        flame.enterState("jump");                                   // Switch to jump state
    });

    // State: jump - perform jump
    flame.onStateEnter("jump", async () => {
        flame.jump(1000);                                           // Jump with force 1000
    });

    // While jumping, check if grounded to return to idle
    flame.onStateUpdate("jump", async () => {
        if (flame.isGrounded()) {                                   // If touching ground
            flame.enterState("idle");                               // Return to idle state
        }
    });

    return flame;
}

/**
 * Creates a guy enemy that walks back and forth
 * 
 * @param k - Kaboom.js context
 * @param posX - X position in tile coordinates
 * @param posY - Y position in tile coordinates
 * @returns The guy enemy game object
 */
export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number) {
    const guy = k.add([
        k.sprite("assets", { anim: "guyWalk" }),                    // Walking animation
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(2, 3.9), 12, 12),             // Collision box
            collisionIgnore: ["enemy"],                             // Don't collide with other enemies
        }),
        k.body(),                                                   // Physics body
        k.state("idle", ["idle", "left", "right", "jump"]),        // State machine for movement
        { isInhalable: false, speed: 100 },                        // Custom properties
        "enemy",
    ]);

    makeInhalable(k, guy);  // Make this enemy inhalable

    // State transitions for walking pattern
    guy.onStateEnter("idle", async () => {
        await k.wait(1);                                            // Brief pause
        guy.enterState("left");                                     // Start walking left
    });

    guy.onStateEnter("left", async () => {
        guy.flipX = false;                                          // Face left
        await k.wait(2);                                            // Walk left for 2 seconds
        guy.enterState("right");                                    // Switch to walking right
    });

    guy.onStateUpdate("left", () => {
        guy.move(-guy.speed, 0);                                    // Move left continuously
    });

    guy.onStateEnter("right", async () => {
        guy.flipX = true;                                           // Face right
        await k.wait(2);                                            // Walk right for 2 seconds
        guy.enterState("left");                                     // Switch to walking left
    });

    guy.onStateUpdate("right", () => {
        guy.move(guy.speed, 0);                                     // Move right continuously
    });

    return guy;
}

/**
 * Creates a bird enemy that flies across the screen
 * 
 * @param k - Kaboom.js context
 * @param posX - X position in tile coordinates
 * @param posY - Y position in tile coordinates
 * @param speed - Flying speed in pixels per second
 * @returns The bird enemy game object
 */
export function makeBirdEnemy(
    k: KaboomCtx,
    posX: number,
    posY: number,
    speed: number
) {
    const bird = k.add([
        k.sprite("assets", { anim: "bird" }),                       // Bird sprite with flapping animation
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(4, 6), 8, 10),                // Collision box
            collisionIgnore: ["enemy"],                             // Don't collide with other enemies
        }),
        k.body({ isStatic: true }),                                 // Static body (not affected by gravity)
        k.move(k.LEFT, speed),                                      // Move left at specified speed
        k.offscreen({ destroy: true, distance: 400 }),             // Destroy when off-screen
        "enemy",
    ]);

    makeInhalable(k, bird);  // Make this enemy inhalable

    return bird;
}