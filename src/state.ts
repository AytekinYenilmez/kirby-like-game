/**
 * Global Game State Management
 * 
 * This module manages the overall state of the game, including scene transitions
 * and tracking the current game state. It provides a centralized way to handle
 * navigation between different levels and game states.
 */

// Global state object that tracks game progression and scene management
export const globalGameState: {
    scenes: string[];                                    // Array of all available scenes
    nextScene: string;                                   // The scene to transition to next
    currentScene: string;                                // The currently active scene
    setNextScene: (sceneName: string) => void;          // Method to set the next scene
    setCurrentScene: (sceneName: string) => void;       // Method to set the current scene
} = {
    // Available scenes in the game
    scenes: ["level-1", "level-2", "end"],
    nextScene: "",
    currentScene: "level-1",  // Start with level-1

    /**
     * Sets the current scene if it exists in the scenes array
     * @param sceneName - Name of the scene to set as current
     */
    setCurrentScene(sceneName: string) {
        if (this.scenes.includes(sceneName)) {
            this.currentScene = sceneName;
        }
    },

    /**
     * Sets the next scene to transition to if it exists in the scenes array
     * @param sceneName - Name of the scene to transition to next
     */
    setNextScene(sceneName: string) {
        if (this.scenes.includes(sceneName)) {
            this.nextScene = sceneName;
        }
    },
};