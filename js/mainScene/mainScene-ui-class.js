// Define MainSceneUI class to be imported in main.js
class MainSceneUI extends Phaser.Scene {
    constructor() {
        super({ key: 'MainSceneUI' });
    }

    create() {
        // This is a wrapper scene that doesn't need functionality
        // The actual UI functionality is in MainScene's prototype
        console.log('MainSceneUI initialized');
    }
}