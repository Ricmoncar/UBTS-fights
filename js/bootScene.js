// Escena de carga
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Manejo de progreso de carga
        this.load.on('progress', (value) => {
            document.getElementById('loading-progress').style.width = `${value * 100}%`;
        });
        
        this.load.on('complete', () => {
            document.getElementById('loading-screen').style.display = 'none';
        });

        // Cargar assets con los nombres de archivo correctos
        this.load.audio('button', './sounds/buttonMove.mp3');
        this.load.audio('encounter', './sounds/encounter.mp3');
        this.load.audio('text', './sounds/text.mp3');
        this.load.audio('damage', './sounds/damageTaken.mp3');
        this.load.audio('heal', './sounds/heal.mp3');
        this.load.audio('attack', './sounds/attack.mp3');
    }

    create() {
        this.scene.start('MainScene');
    }
}