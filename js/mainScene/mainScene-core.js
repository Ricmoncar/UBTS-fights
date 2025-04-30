class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // Initialize state
        this.currentState = gameConfig.STATES.START_SCREEN;
        this.currentSelectedButton = 0;
        this.currentSelectedOption = 0;
        this.currentSelectedMonster = 0;
        this.selectedMonsterForAct = false;
        this.gameStarted = false;
        this.justClicked = false;
        this.actMenuRow = 0;
        this.actMenuCol = 0;
        
        // Initialize game objects
        this.player = { ...gameConfig.player };
        this.monsters = JSON.parse(JSON.stringify(gameConfig.monsters));
        
        // Configure text with proper font
        this.textConfig = {
            fontFamily: 'DeterminationMono, monospace',
            fontSize: '24px',
            color: '#FFFFFF',
            align: 'left'
        };
        
        // Create animated background
        this.createAnimatedBackground();
        
        // Initialize core UI elements
        this.initializeUI();
        
        // Create main dialogue text - this must be created BEFORE calling hideUIElements
        this.dialogueText = this.add.text(
            gameConfig.dialogueBox.x - gameConfig.dialogueBox.width/2 + gameConfig.dialogueBox.padding, 
            gameConfig.dialogueBox.y - gameConfig.dialogueBox.height/2 + gameConfig.dialogueBox.padding, 
            '', 
            this.textConfig
        );
        this.dialogueCharIndex = 0;
        this.dialogueFullText = '';
        this.isTyping = false;
        this.textSpeed = 2;
        
        // Initialize typewriter timer
        this.typewriterTimer = null;
        
        // Now create the full UI - dialogueText now exists
        this.createUI();
        
        // Create action buttons with sprites instead of text
        this.buttons = [];
        this.buttonSprites = [];
        const buttonLabels = ["FIGHT", "ACT", "ITEM", "MERCY"];
        const buttonKeys = ["fight", "act", "item", "mercy"];
        
        for (let i = 0; i < buttonLabels.length; i++) {
            const buttonX = 120 + i * gameConfig.ui.buttonSpacing;
            const buttonY = gameConfig.ui.buttonY;
            
            // Create button sprite with larger size
            const buttonSprite = this.add.sprite(buttonX, buttonY, buttonKeys[i]);
            buttonSprite.setScale(gameConfig.ui.buttonScale);
            buttonSprite.setDisplaySize(130, 40); // Bigger buttons
            buttonSprite.alpha = 0.9;
            this.buttonSprites.push(buttonSprite);
            
            // Create button text (hidden if configured)
            const buttonText = this.add.text(
                buttonX, buttonY + 30, 
                buttonLabels[i], 
                {
                    fontFamily: 'DeterminationMono, monospace',
                    fontSize: '20px',
                    color: '#FFFFFF',
                    align: 'center'
                }
            ).setOrigin(0.5);
            
            // Hide button labels if configured
            if (gameConfig.ui.hideButtonLabels) {
                buttonText.visible = false;
            }
            
            this.buttons.push(buttonText);
        }
        
        // Create player's soul as sprite with TINY size
        this.heart = this.add.sprite(this.player.x, this.player.y, 'heart');
        this.heart.setScale(gameConfig.ui.heartScale); // Tiny heart size from config
        this.heart.visible = false;
        
        // Add gentle pulsing animation to the heart
        this.tweens.add({
            targets: this.heart,
            scale: gameConfig.effects.heartbeat.scale.max, // Very small pulse range
            duration: gameConfig.effects.heartbeat.duration,
            yoyo: true,
            repeat: -1
        });
        
        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        
        // Disable mouse input completely
        // Remove any existing pointer down listeners to ensure mouse is fully disabled
        this.input.off('pointerdown');
        
        // Initialize audio with the audio manager
        this.initializeAudio();
        
        // Make sure battle box is created and initially hidden
        this.createBattleBox();
        
        // Start with the start screen - ensure UI elements are properly hidden
        this.hideUIElements();
        this.renderStartScreen();
    }
    
    // Create battle box properly
    createBattleBox() {
        this.battleBox = this.add.rectangle(
            gameConfig.battleBox.x + gameConfig.battleBox.width / 2, 
            gameConfig.battleBox.y + gameConfig.battleBox.height / 2, 
            gameConfig.battleBox.width, 
            gameConfig.battleBox.height, 
            0x000000
        );
        this.battleBox.setStrokeStyle(4, gameConfig.COLORS.WHITE);
        this.battleBox.visible = false;
        
        // Add animation to battle box
        this.battleBoxAnimation = this.tweens.add({
            targets: this.battleBox,
            strokeAlpha: 0.7,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            paused: true
        });
    }
    
    // Initialize audio using improved AudioManager
    initializeAudio() {
        console.log('MainScene initializing audio...');
        
        // Get the audio manager from the registry
        this.audioManager = this.game.registry.get('audioManager');
        
        if (!this.audioManager) {
            console.warn('Audio manager not found in registry, creating a new one');
            this.audioManager = new AudioManager(this);
            this.audioManager.preload();
            this.audioManager.create();
        }
        
        // For backwards compatibility, create these references
        this.buttonSound = {
            play: (config) => this.audioManager.playButton(config)
        };
        this.encounterSound = {
            play: (config) => this.audioManager.playEncounter(config)
        };
        this.textSound = {
            play: (config) => this.audioManager.playText(config)
        };
        this.damageSound = {
            play: (config) => this.audioManager.playDamage(config)
        };
        this.healSound = {
            play: (config) => this.audioManager.playHeal(config)
        };
        this.attackSound = {
            play: (config) => this.audioManager.playAttack(config)
        };
        
        console.log('Audio system initialized');
        
        // Preload HTML5 audio as fallback
        this.loadHTML5AudioFallbacks();
    }
    
    // Add HTML5 audio preloading
    loadHTML5AudioFallbacks() {
        // Directly create and preload HTML5 audio elements
        const audioFiles = [
            { key: 'button', path: 'sounds/buttonMove.mp3' },
            { key: 'encounter', path: 'sounds/encounter.mp3' },
            { key: 'text', path: 'sounds/text.mp3' },
            { key: 'damage', path: 'sounds/damageTaken.mp3' },
            { key: 'heal', path: 'sounds/heal.mp3' },
            { key: 'attack', path: 'sounds/attack.mp3' }
        ];
        
        this.html5Audio = {};
        
        audioFiles.forEach(file => {
            try {
                const audio = new Audio(file.path);
                audio.volume = 0.5; // Lower volume
                // Force preload
                audio.load();
                
                this.html5Audio[file.key] = audio;
                
                // Add a play method that matches our interface
                this.html5Audio[file.key].playSound = function(config) {
                    this.currentTime = 0;
                    this.volume = config?.volume || 0.5;
                    const playPromise = this.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn(`Failed to play sound: ${error}`);
                        });
                    }
                };
                
                console.log(`Preloaded HTML5 audio: ${file.key}`);
            } catch (e) {
                console.warn(`Failed to preload audio: ${file.key}`, e);
            }
        });
    }
    
    // Play sound with fallback to HTML5 Audio
    playSound(key, config = { volume: 0.5 }) {
        // Try the Phaser sound system first
        if (this.audioManager) {
            this.audioManager.play(key, config);
        }
        
        // Fallback to HTML5 audio
        if (this.html5Audio && this.html5Audio[key]) {
            this.html5Audio[key].playSound(config);
        }
    }
    
    createAnimatedBackground() {
        // Create subtle gradient elements at the bottom of the screen
        this.gradientElements = [];
        const numElements = 8;
        const elementWidth = gameConfig.SCREEN_WIDTH / numElements;
        
        for (let i = 0; i < numElements; i++) {
            const gradientElement = this.add.rectangle(
                i * elementWidth + elementWidth/2, 
                gameConfig.SCREEN_HEIGHT + 100, 
                elementWidth, 
                300, 
                gameConfig.COLORS.LIGHT_BLUE, 
                0.1 // Reduced alpha for subtlety
            );
            
            // Add gentle animation to each element
            this.tweens.add({
                targets: gradientElement,
                y: gameConfig.SCREEN_HEIGHT - 100 + Math.random() * 50,
                alpha: { from: 0.05, to: 0.15 }, // Very subtle
                duration: 3000 + i * 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
                delay: i * 400
            });
            
            this.gradientElements.push(gradientElement);
        }
    }
    
    // Initialize just the basic UI elements
    initializeUI() {
        // Create static UI elements - Positioned at the bottom of the screen
        this.dialogueBox = this.add.rectangle(
            gameConfig.dialogueBox.x, 
            gameConfig.dialogueBox.y, 
            gameConfig.dialogueBox.width, 
            gameConfig.dialogueBox.height, 
            0x000000
        );
        this.dialogueBox.setStrokeStyle(4, gameConfig.COLORS.WHITE);
        
        // Add subtle animation to dialogue box
        this.tweens.add({
            targets: this.dialogueBox,
            strokeAlpha: 0.7,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
    
    createUI() {
        // First check if healthBar config exists in gameConfig
        if (!gameConfig.healthBar) {
            // Create default healthBar settings if they don't exist
            gameConfig.healthBar = {
                y: gameConfig.dialogueBox.y + gameConfig.dialogueBox.height/2 + 30,
                playerNameX: 20,
                hpTextX: 160,
                hpBarX: 240,
                hpBarStartX: 180,
                hpValuesX: 310,
                barWidth: 120,
                barHeight: 24,
                fontSize: 24
            };
        }
        
        // Use config values
        const hp = gameConfig.healthBar;
        
        // Player stats text
        this.playerNameText = this.add.text(
            hp.playerNameX, hp.y, 
            `${this.player.name} LV ${this.player.lv}`, 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: `${hp.fontSize}px`,
                color: '#FFFFFF'
            }
        );
        
        this.hpText = this.add.text(
            hp.hpTextX, hp.y, 
            "HP", 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: `${hp.fontSize}px`,
                color: '#FFFFFF'
            }
        );
        
        // HP Bar
        this.hpBarBg = this.add.rectangle(hp.hpBarX, hp.y, hp.barWidth, hp.barHeight, gameConfig.COLORS.RED);
        this.hpBarFill = this.add.rectangle(hp.hpBarStartX, hp.y, hp.barWidth, hp.barHeight, gameConfig.COLORS.YELLOW);
        this.hpBarFill.setOrigin(0, 0.5);
        
        // Add animation to HP bar
        this.tweens.add({
            targets: this.hpBarFill,
            fillAlpha: 0.8,
            duration: 1500,
            yoyo: true,
            repeat: -1
        });
        
        // HP Values
        this.hpValuesText = this.add.text(
            hp.hpValuesX, hp.y, 
            `${this.player.hp}/${this.player.maxhp}`, 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: `${hp.fontSize}px`,
                color: '#FFFFFF'
            }
        );
    }
    
    update() {
        // Update game state
        switch (this.currentState) {
            case gameConfig.STATES.START_SCREEN:
                this.updateStartScreen();
                break;
                
            case gameConfig.STATES.INTRO:
                this.updateIntro();
                break;
                
            case gameConfig.STATES.PLAYER_CHOICE:
                this.updatePlayerChoice();
                break;
                
            case gameConfig.STATES.FIGHT:
                this.updateFight();
                break;
                
            case gameConfig.STATES.ACT:
                this.updateAct();
                break;
                
            case gameConfig.STATES.ITEM:
                this.updateItem();
                break;
                
            case gameConfig.STATES.MERCY:
                this.updateMercy();
                break;
                
            case gameConfig.STATES.ENEMY_TURN:
                this.updateEnemyTurn();
                break;
                
            case gameConfig.STATES.BATTLE_ANIMATION:
                // Nothing to do during animation, wait for it to finish
                break;
        }
        
        // Update HP bar position
        this.updateHPBar();
    }
    
    updateHPBar() {
        const hpPercent = this.player.hp / this.player.maxhp;
        
        // Use configured width if available, otherwise default to 120
        const barWidth = gameConfig.healthBar ? gameConfig.healthBar.barWidth : 120;
        
        // Update the HP bar fill width based on percentage and configured width
        this.hpBarFill.width = barWidth * hpPercent;
        
        // Update the HP text
        this.hpValuesText.setText(`${this.player.hp}/${this.player.maxhp}`);
    }
    
    updateStartScreen() {
        // Check for game start - ONLY Z key (mouse disabled)
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.startGame();
        }
    }
    
    updateIntro() {
        // Handle dialogue advancement with keyboard only
        if (Phaser.Input.Keyboard.JustDown(this.keyZ) || Phaser.Input.Keyboard.JustDown(this.keyX)) {
            if (!this.isTyping) {
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                this.updateButtonsColors();
            } else {
                this.completeText();
            }
        }
    }
    
    updatePlayerChoice() {
        // Handle button selection with keyboard only
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.currentSelectedButton = Math.max(0, this.currentSelectedButton - 1);
            this.playSound('button');
            this.updateButtonsColors();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.currentSelectedButton = Math.min(this.buttons.length - 1, this.currentSelectedButton + 1);
            this.playSound('button');
            this.updateButtonsColors();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.selectCurrentButton();
        }
    }
    
    // Modified to use keyboard only
    startGame() {
        this.currentState = gameConfig.STATES.INTRO;
        this.gameStarted = true;
        
        // Add animated entry for dialogue text
        this.setDialogueText(gameConfig.dialogues.intro);
        this.playSound('encounter');
        
        // Clean start screen and show battle elements
        this.cleanStartScreen();
        this.showUIElements();
        
        // Animate battle scene entry
        this.drawBattleScene();
    }
    
    // Handle all UI updates with keyboard controls only
    handleUIControls() {
        // No mouse controls - this method intentionally empty
        // All controls are handled in their respective update methods
    }
}