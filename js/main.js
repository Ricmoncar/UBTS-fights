
import MainSceneActItemMercy from './mainScene/mainScene-act-item-mercy.js';
import MainSceneBattle from './mainScene/mainScene-battle.js';
import MainSceneCore from './mainScene/mainScene-core.js';
import MainSceneEnemyTurn from './mainScene/mainScene-enemy-turn.js';
import MainSceneLoader from './mainScene/mainScene-loader.js';
import MainSceneStartScreen from './mainScene/mainScene-start-screen.js';

const phaserConfig = {
    type: Phaser.AUTO,
    width: gameConfig.SCREEN_WIDTH,
    height: gameConfig.SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: gameConfig.COLORS.BLACK,
        scene: [
            BootScene,
            MainSceneActItemMercy,
            MainSceneBattle,
            MainSceneCore,
            MainSceneEnemyTurn,
            MainSceneLoader,
            MainSceneStartScreen,
            MainSceneUI
        ],
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// Create the game instance
// Create the game instance
const game = new Phaser.Game(phaserConfig);
console.log('Game instance created:', game);