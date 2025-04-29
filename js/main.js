// Configuración para el juego de Phaser
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
    }
};

// Crear instancia del juego
const game = new Phaser.Game(phaserConfig);