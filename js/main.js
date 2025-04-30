window.addEventListener('DOMContentLoaded', () => {
    const phaserConfig = {
        type: Phaser.AUTO,
        width: gameConfig.SCREEN_WIDTH,
        height: gameConfig.SCREEN_HEIGHT,
        parent: 'game-container',
        backgroundColor: gameConfig.COLORS.BLACK,
        scene: [BootScene, MainScene],
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
    const game = new Phaser.Game(phaserConfig);
    console.log('Game instance created:', game);
});