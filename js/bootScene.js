// bootScene.js - Fixed version
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

        // Load custom CSS for the webfont instead of trying to load with binaryFont
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'DeterminationMono';
                src: url('Fonts/DTM-Mono.otf') format('opentype');
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(style);

        // Cargar assets con los nombres de archivo correctos
        this.load.audio('button', './sounds/buttonMove.mp3');
        this.load.audio('encounter', './sounds/encounter.mp3');
        this.load.audio('text', './sounds/text.mp3');
        this.load.audio('damage', './sounds/damageTaken.mp3');
        this.load.audio('heal', './sounds/heal.mp3');
        this.load.audio('attack', './sounds/attack.mp3');
        
        // Load heart/soul sprite
        this.load.image('heart', './img/heart.png');
        
        // Load menu button sprites
        this.load.image('fight', './img/fight.png');
        this.load.image('act', './img/act.png');
        this.load.image('item', './img/item.png');
        this.load.image('mercy', './img/mercy.png');
        this.load.image('fightHover', './img/fightHover.png');
        this.load.image('actHover', './img/actHover.png');
        this.load.image('itemHover', './img/itemHover.png');
        this.load.image('mercyHover', './img/mercyHover.png');
    }

    create() {
        // Add a WebFontFile to ensure the font is loaded properly
        this.loadFont();
        
        // Add a loading delay to ensure font is loaded properly
        this.time.delayedCall(1000, () => {
            this.scene.start('MainScene');
        });
    }
    
    loadFont() {
        // Create a div with the font to force the browser to load it
        const element = document.createElement('div');
        element.style.fontFamily = 'DeterminationMono';
        element.style.position = 'absolute';
        element.style.left = '-1000px';
        element.style.visibility = 'hidden';
        element.textContent = 'Font Loading';
        document.body.appendChild(element);
        
    }
}