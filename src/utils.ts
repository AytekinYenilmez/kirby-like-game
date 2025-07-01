/**
 * Utility Functions for Map Generation
 * 
 * This module contains helper functions for creating game maps from Tiled map data.
 * It processes JSON data exported from Tiled map editor and creates Kaboom.js game objects.
 */

import type { KaboomCtx } from "kaboom";
import { scale } from "./constants";

/**
 * Creates a game map from Tiled JSON data
 * 
 * This function fetches map data from a JSON file, processes the layers,
 * and creates the corresponding game objects for the level background,
 * collision areas, and spawn points for entities.
 * 
 * @param k - The Kaboom.js context
 * @param name - The name of the map file (without .json extension)
 * @returns Promise containing the map object and spawn points
 */
export async function makeMap(k: KaboomCtx, name: string) {
    // Fetch the map data from the JSON file in the public directory
    const mapData = await (await fetch(`${name}.json`)).json();

    // Create the main map sprite object with scaling and positioning
    const map = k.make([k.sprite(name), k.scale(scale), k.pos(0)])

    // Object to store spawn points for different entity types
    const spawnPoints: { [key: string]: { x: number, y: number }[] } = {};

    // Process each layer in the Tiled map data
    for (const layer of mapData.layers) {
        // Handle collision layer - creates invisible collision boxes
        if (layer.name === "colliders") {
            for (const collider of layer.objects) {
                map.add([
                    // Create collision area with specified dimensions
                    k.area({
                        shape: new k.Rect(k.vec2(0), collider.width, collider.height),
                        collisionIgnore: ["platform", "exit"],  // Ignore collisions with other platforms
                    }),
                    // Add physics body for platforms, but not for exits
                    collider.name !== "exit" ? k.body({ isStatic: true }) : null,
                    // Position the collider
                    k.pos(collider.x, collider.y),
                    // Tag the object for identification
                    collider.name !== "exit" ? "platform" : "exit",
                ])
            }
            continue;
        }

        // Handle spawn points layer - defines where entities should be placed
        if (layer.name === "spawnpoints") {
            for (const spawnPoint of layer.objects) {
                // Group spawn points by type (player, enemy, etc.)
                if (spawnPoints[spawnPoint.name]) {
                    spawnPoints[spawnPoint.name].push({ x: spawnPoint.x, y: spawnPoint.y });
                    continue;
                }
                // Create new array for this spawn point type
                spawnPoints[spawnPoint.name] = [{ x: spawnPoint.x, y: spawnPoint.y }];
            }
        }
    }

    // Return the complete map object and all spawn points
    return {
        map,
        spawnPoints,
    };
}

