/**
 * Kaboom.js Context Configuration
 * 
 * This file initializes and exports the main Kaboom.js game engine instance.
 * Kaboom.js is a JavaScript library for making games quickly and easily.
 */

import kaboom from "kaboom";
import { scale } from "./constants";

// Create and configure the main Kaboom.js game context
export const k = kaboom({
    global: false,          // Don't attach kaboom functions to global scope (better practice)
    width: 256 * scale,     // Canvas width: 256 pixels * scale factor
    height: 144 * scale,    // Canvas height: 144 pixels * scale factor (16:9 aspect ratio)
    scale: scale,           // Overall scaling factor for the game
    letterbox: true,        // Add black bars to maintain aspect ratio when resizing
});