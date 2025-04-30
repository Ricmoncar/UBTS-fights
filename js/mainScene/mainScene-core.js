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
            const buttonX = 130 + i * 140;
            const buttonY = 435;
            
            // Create button sprite - ensure consistent size
            const buttonSprite = this.add.sprite(buttonX, buttonY, buttonKeys[i]);
            buttonSprite.setScale(1.2);
            buttonSprite.setDisplaySize(100, 30); // Set consistent size
            buttonSprite.alpha = 0.9;
            this.buttonSprites.push(buttonSprite);
            
            // Create button text
            this.buttons.push(
                this.add.text(buttonX, buttonY + 25, buttonLabels[i], {
                    fontFamily: 'DeterminationMono, monospace',
                    fontSize: '20px',
                    color: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5)
            );
        }
        
        // Create player's soul as sprite instead of rectangle
        this.heart = this.add.sprite(this.player.x, this.player.y, 'heart');
        this.heart.setScale(1.3);
        this.heart.visible = false;
        
        // Add pulsing animation to the heart
        this.tweens.add({
            targets: this.heart,
            scale: 1.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
        
        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        
        // Set up mouse click handling
        this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer.x, pointer.y);
        });
        
        // Initialize audio with the audio manager
        this.initializeAudio();
        
        // Start with the start screen
        this.renderStartScreen();
    }
    
    // Initialize audio using AudioManager
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
        // This allows existing code to continue working while we migrate
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
    }
    
    createAnimatedBackground() {
        // Create gradient elements at the bottom of the screen
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
                0.2
            );
            
            // Add animation to each element
            this.tweens.add({
                targets: gradientElement,
                y: gameConfig.SCREEN_HEIGHT - 100 + Math.random() * 50,
                alpha: { from: 0.1, to: 0.3 },
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
        // Create static UI elements - Moved to the bottom of the screen
        this.dialogueBox = this.add.rectangle(
            gameConfig.dialogueBox.x, 
            gameConfig.dialogueBox.y, 
            gameConfig.dialogueBox.width, 
            gameConfig.dialogueBox.height, 
            0x000000
        );
        this.dialogueBox.setStrokeStyle(4, gameConfig.COLORS.WHITE);
        
        // Add animation to dialogue box
        this.tweens.add({
            targets: this.dialogueBox,
            strokeAlpha: 0.7,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
    
    createUI() {
        // Move player stats text below the dialogue box
        const statsY = gameConfig.dialogueBox.y + gameConfig.dialogueBox.height/2 + 30;
        
        // Player stats text
        this.playerNameText = this.add.text(
            20, statsY, 
            `${this.player.name} LV ${this.player.lv}`, 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: '#FFFFFF'
            }
        );
        this.hpText = this.add.text(
            160, statsY, 
            "HP", 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: '#FFFFFF'
            }
        );
        
        // HP Bar
        this.hpBarBg = this.add.rectangle(240, statsY, 120, 24, gameConfig.COLORS.RED);
        this.hpBarFill = this.add.rectangle(180, statsY, 120, 24, gameConfig.COLORS.YELLOW);
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
            310, statsY, 
            `${this.player.hp}/${this.player.maxhp}`, 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: '#FFFFFF'
            }
        );
        
        // Battle box (initially invisible)
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
        
        // Now that all UI elements exist, we can hide them
        this.hideUIElements();
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
        this.hpBarFill.width = 120 * hpPercent;
        this.hpValuesText.setText(`${this.player.hp}/${this.player.maxhp}`);
    }
    
    updateStartScreen() {
        // Check for game start
        if (Phaser.Input.Keyboard.JustDown(this.keyZ) || this.justClicked) {
            this.justClicked = false;
            this.startGame();
        }
    }
    
    updateIntro() {
        // Handle dialogue advancement
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
        // Handle button selection
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.currentSelectedButton = Math.max(0, this.currentSelectedButton - 1);
            
            // Use direct audioManager if available, fall back to legacy approach
            if (this.audioManager) {
                this.audioManager.playButton();
            } else if (this.buttonSound) {
                this.buttonSound.play();
            }
            
            this.updateButtonsColors();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.currentSelectedButton = Math.min(this.buttons.length - 1, this.currentSelectedButton + 1);
            
            // Use direct audioManager if available, fall back to legacy approach
            if (this.audioManager) {
                this.audioManager.playButton();
            } else if (this.buttonSound) {
                this.buttonSound.play();
            }
            
            this.updateButtonsColors();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.selectCurrentButton();
        }
    }
}