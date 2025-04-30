class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.audioManager = null;
    }

    preload() {
        console.log('BootScene preloading assets...');
        
        // Load progress handling
        this.load.on('progress', (value) => {
            const progressElement = document.getElementById('loading-progress');
            if (progressElement) {
                progressElement.style.width = `${value * 100}%`;
            }
            console.log(`Loading progress: ${Math.floor(value * 100)}%`);
        });
        
        this.load.on('complete', () => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
            console.log('All visual assets loaded');
        });

        // Load CSS for the webfont
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

        // Initialize audio manager and let it handle audio preloading
        this.audioManager = new AudioManager(this);
        this.audioManager.preload();
        
        // Load heart/soul sprite
        this.load.image('heart', 'img/heart.webp');
        
        // Load menu button sprites
        this.load.image('fight', 'img/fight.png');
        this.load.image('act', 'img/act.png');
        this.load.image('item', 'img/item.png');
        this.load.image('mercy', 'img/mercy.png');
        this.load.image('fightHover', 'img/fightHover.png');
        this.load.image('actHover', 'img/actHover.png');
        this.load.image('itemHover', 'img/itemHover.png');
        this.load.image('mercyHover', 'img/mercyHover.png');
    }

    create() {
        console.log('BootScene create started');
        
        // Initialize audio system
        this.audioManager.create();
        
        // Pre-load sounds by playing them silently
        console.log('Pre-loading sounds...');
        const allSounds = ['button', 'encounter', 'text', 'damage', 'heal', 'attack'];
        allSounds.forEach(key => {
            try {
                if (this.sound.exists(key)) {
                    const sound = this.sound.get(key);
                    sound.setVolume(0);
                    sound.play();
                    sound.stop();
                    console.log(`Pre-loaded sound: ${key}`);
                }
            } catch (e) {
                console.warn(`Couldn't pre-load sound: ${key}`, e);
            }
        });
        
        // Make the audio manager available to other scenes
        this.game.registry.set('audioManager', this.audioManager);
        
        // Ensure font is loaded
        this.loadFont();
        
        // Add a loading delay to ensure resources are loaded properly
        console.log('Waiting to ensure all resources are loaded...');
        this.time.delayedCall(1200, () => {
            console.log('Starting MainScene...');
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
        console.log('Font loading initialized');
    }
}