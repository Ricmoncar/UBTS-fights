class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // Create animated gradient background
        this.createAnimatedBackground();
        
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
        
        // Create main dialogue text
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
        
        // Create action buttons with sprites instead of text
        this.buttons = [];
        this.buttonSprites = [];
        const buttonLabels = ["FIGHT", "ACT", "ITEM", "MERCY"];
        const buttonKeys = ["fight", "act", "item", "mercy"];
        
        for (let i = 0; i < buttonLabels.length; i++) {
            const buttonX = 130 + i * 140;
            const buttonY = 435;
            
            // Create button sprite
            const buttonSprite = this.add.sprite(buttonX, buttonY, buttonKeys[i]);
            buttonSprite.setScale(1.2);
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
        
        // Create UI elements
        this.createUI();
        
        // Set up keyboard input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        
        // Set up mouse click handling
        this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer.x, pointer.y);
        });
        
        // Add sounds
        this.buttonSound = this.sound.add('button');
        this.encounterSound = this.sound.add('encounter');
        this.textSound = this.sound.add('text');
        this.damageSound = this.sound.add('damage');
        this.healSound = this.sound.add('heal');
        this.attackSound = this.sound.add('attack');
        
        // Start with the start screen
        this.renderStartScreen();
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
    
    createUI() {
        // Create static UI elements
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
        
        // Player stats text
        this.playerNameText = this.add.text(
            20, 400, 
            `${this.player.name} LV ${this.player.lv}`, 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: '#FFFFFF'
            }
        );
        this.hpText = this.add.text(
            160, 400, 
            "HP", 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: '#FFFFFF'
            }
        );
        
        // HP Bar
        this.hpBarBg = this.add.rectangle(240, 400, 120, 24, gameConfig.COLORS.RED);
        this.hpBarFill = this.add.rectangle(180, 400, 120, 24, gameConfig.COLORS.YELLOW);
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
            310, 400, 
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
        
        // Initially hide UI elements
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
            this.buttonSound.play();
            this.updateButtonsColors();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.currentSelectedButton = Math.min(this.buttons.length - 1, this.currentSelectedButton + 1);
            this.buttonSound.play();
            this.updateButtonsColors();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.selectCurrentButton();
        }
    }
    
    updateButtonsColors() {
        for (let i = 0; i < this.buttons.length; i++) {
            if (i === this.currentSelectedButton) {
                this.buttons[i].setColor('#FFFF00');
                // Use the hover version of the sprite
                this.buttonSprites[i].setTexture(["fightHover", "actHover", "itemHover", "mercyHover"][i]);
                this.buttonSprites[i].setScale(1.3);
                // Add a little bounce effect
                this.tweens.add({
                    targets: this.buttonSprites[i],
                    y: 430,
                    duration: 100,
                    yoyo: true,
                    ease: 'Bounce.Out'
                });
            } else {
                this.buttons[i].setColor('#FFFFFF');
                // Use the normal version of the sprite
                this.buttonSprites[i].setTexture(["fight", "act", "item", "mercy"][i]);
                this.buttonSprites[i].setScale(1.2);
            }
        }
    }
    
    selectCurrentButton() {
        this.buttonSound.play();
        
        switch (this.currentSelectedButton) {
            case 0: // FIGHT
                this.currentState = gameConfig.STATES.FIGHT;
                this.currentSelectedMonster = 0;
                this.showFightScene();
                break;
            case 1: // ACT
                this.currentState = gameConfig.STATES.ACT;
                this.currentSelectedMonster = 0;
                this.currentSelectedOption = 0;
                this.actMenuRow = 0;
                this.actMenuCol = 0;
                this.selectedMonsterForAct = false;
                this.showActScene();
                break;
            case 2: // ITEM
                this.currentState = gameConfig.STATES.ITEM;
                this.currentSelectedOption = 0;
                this.showItemScene();
                break;
            case 3: // MERCY
                this.currentState = gameConfig.STATES.MERCY;
                this.currentSelectedOption = 0;
                this.showMercyScene();
                break;
        }
    }
    
    updateFight() {
        // Monster selector
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.currentSelectedMonster = Math.max(0, this.currentSelectedMonster - 1);
            this.buttonSound.play();
            this.drawFightScene();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.currentSelectedMonster = Math.min(this.monsters.length - 1, this.currentSelectedMonster + 1);
            this.buttonSound.play();
            this.drawFightScene();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.selectMonsterToFight();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
            this.returnToMainMenu();
        }
    }
    
    updateAct() {
        // First phase: select monster
        if (!this.selectedMonsterForAct) {
            if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
                this.currentSelectedMonster = Math.max(0, this.currentSelectedMonster - 1);
                this.buttonSound.play();
                this.drawActMonsterScene();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
                this.currentSelectedMonster = Math.min(this.monsters.length - 1, this.currentSelectedMonster + 1);
                this.buttonSound.play();
                this.drawActMonsterScene();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
                this.selectedMonsterForAct = true;
                this.actMenuRow = 0;
                this.actMenuCol = 0;
                this.currentSelectedOption = 0;
                this.buttonSound.play();
                this.drawActOptionScene();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
                this.returnToMainMenu();
            }
        }
        // Second phase: select action
        else {
            const monster = this.monsters[this.currentSelectedMonster];
            const actOptions = gameConfig.actOptions[monster.name];
            
            // Navigation with all four arrow keys for a 2x2 grid
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                if (this.actMenuRow > 0) {
                    this.actMenuRow--;
                    this.currentSelectedOption = this.actMenuRow * 2 + this.actMenuCol;
                    this.buttonSound.play();
                    this.drawActOptionScene();
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                if (this.actMenuRow < 1 && this.actMenuRow * 2 + this.actMenuCol + 2 < actOptions.length) {
                    this.actMenuRow++;
                    this.currentSelectedOption = this.actMenuRow * 2 + this.actMenuCol;
                    this.buttonSound.play();
                    this.drawActOptionScene();
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
                if (this.actMenuCol > 0) {
                    this.actMenuCol--;
                    this.currentSelectedOption = this.actMenuRow * 2 + this.actMenuCol;
                    this.buttonSound.play();
                    this.drawActOptionScene();
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
                if (this.actMenuCol < 1 && this.actMenuRow * 2 + this.actMenuCol + 1 < actOptions.length) {
                    this.actMenuCol++;
                    this.currentSelectedOption = this.actMenuRow * 2 + this.actMenuCol;
                    this.buttonSound.play();
                    this.drawActOptionScene();
                }
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
                this.selectActOption();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
                this.selectedMonsterForAct = false;
                this.buttonSound.play();
                this.drawActMonsterScene();
            }
        }
    }
    
    updateItem() {
        // Item selector
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.currentSelectedOption = Math.max(0, this.currentSelectedOption - 1);
            this.buttonSound.play();
            this.drawItemScene();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.currentSelectedOption = Math.min(gameConfig.items.length - 1, this.currentSelectedOption + 1);
            this.buttonSound.play();
            this.drawItemScene();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.useItem();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
            this.returnToMainMenu();
        }
    }
    
    updateMercy() {
        // MERCY options selector
        const options = ["Spare", "Flee"];
        
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.currentSelectedOption = Math.max(0, this.currentSelectedOption - 1);
            this.buttonSound.play();
            this.drawMercyScene();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.currentSelectedOption = Math.min(options.length - 1, this.currentSelectedOption + 1);
            this.buttonSound.play();
            this.drawMercyScene();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.selectMercyOption();
        }
        else if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
            this.returnToMainMenu();
        }
    }
    
    updateEnemyTurn() {
        // Move the soul/heart during enemy turn with improved controls
        const speed = this.player.speed;
        
        if (this.cursors.left.isDown) {
            this.player.x = Math.max(gameConfig.battleBox.x + 10, this.player.x - speed);
        }
        if (this.cursors.right.isDown) {
            this.player.x = Math.min(gameConfig.battleBox.x + gameConfig.battleBox.width - 10, this.player.x + speed);
        }
        if (this.cursors.up.isDown) {
            this.player.y = Math.max(gameConfig.battleBox.y + 10, this.player.y - speed);
        }
        if (this.cursors.down.isDown) {
            this.player.y = Math.min(gameConfig.battleBox.y + gameConfig.battleBox.height - 10, this.player.y + speed);
        }
        
        // Update heart position
        this.heart.x = this.player.x;
        this.heart.y = this.player.y;
        
        // Update projectiles
        if (this.enemyProjectiles && this.enemyProjectiles.length > 0) {
            this.updateProjectiles();
        }
        
        // Debug: End turn with Z (will be automatic in final version)
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.endEnemyTurn();
        }
    }
    
    // Methods for starting actions
    startGame() {
        this.currentState = gameConfig.STATES.INTRO;
        this.gameStarted = true;
        
        // Add animated entry for dialogue text
        this.setDialogueText(gameConfig.dialogues.intro);
        this.encounterSound.play();
        
        // Clean start screen and show battle elements
        this.cleanStartScreen();
        this.showUIElements();
        
        // Animate battle scene entry
        this.drawBattleScene();
    }
    
    showFightScene() {
        this.cleanMenuOptions();
        this.drawFightScene();
        
        // Show the soul in the FIGHT menu
        this.heart.visible = true;
    }
    
    showActScene() {
        this.cleanMenuOptions();
        this.drawActMonsterScene();
        
        // Show the soul in the ACT menu
        this.heart.visible = true;
    }
    
    showItemScene() {
        this.cleanMenuOptions();
        this.drawItemScene();
        
        // Show the soul in the ITEM menu
        this.heart.visible = true;
    }
    
    showMercyScene() {
        this.cleanMenuOptions();
        this.drawMercyScene();
        
        // Show the soul in the MERCY menu
        this.heart.visible = true;
    }
    
    // Methods for drawing scenes
    cleanStartScreen() {
        // Clean any start screen specific elements
        if (this.titleText) {
            this.titleText.destroy();
            this.startText.destroy();
            if (this.startHeart) {
                this.startHeart.destroy();
            }
        }
    }
    
    hideUIElements() {
        // Hide UI elements for start screen
        this.dialogueBox.visible = false;
        this.dialogueText.visible = false;
        this.playerNameText.visible = false;
        this.hpText.visible = false;
        this.hpBarBg.visible = false;
        this.hpBarFill.visible = false;
        this.hpValuesText.visible = false;
        this.heart.visible = false;
        
        // Hide buttons
        this.buttons.forEach(button => button.visible = false);
        this.buttonSprites.forEach(sprite => sprite.visible = false);
        
        if (this.monsterSprites) {
            this.monsterSprites.forEach(sprite => sprite.visible = false);
            this.monsterTexts.forEach(text => text.visible = false);
        }
    }
    
    showUIElements() {
        // Show UI elements for battle
        this.dialogueBox.visible = true;
        this.dialogueText.visible = true;
        this.playerNameText.visible = true;
        this.hpText.visible = true;
        this.hpBarBg.visible = true;
        this.hpBarFill.visible = true;
        this.hpValuesText.visible = true;
        
        // Show buttons with animated entry
        this.buttons.forEach((button, index) => {
            button.visible = true;
            this.buttonSprites[index].visible = true;
            
            // Add entry animation for buttons
            this.buttonSprites[index].y = 460;
            this.buttons[index].y = 485;
            
            this.tweens.add({
                targets: [this.buttonSprites[index], this.buttons[index]],
                y: '-=25',
                duration: 300,
                ease: 'Back.easeOut',
                delay: index * 100
            });
        });
    }
    
    cleanMenuOptions() {
        // Clean previous options
        if (this.optionTexts && this.optionTexts.length > 0) {
            this.optionTexts.forEach(text => text.destroy());
            this.optionTexts = [];
        }
        
        if (this.selectionHeart) {
            this.selectionHeart.destroy();
            this.selectionHeart = null;
        }
    }
    
    drawBattleScene() {
        // Draw monsters with animated entry
        if (!this.monsterSprites) {
            this.monsterSprites = [];
            this.monsterTexts = [];
            
            this.monsters.forEach((monster, index) => {
                // Create monster sprite/emoji
                const monsterText = this.add.text(monster.x, -50, monster.sprite, {
                    fontFamily: 'Arial',
                    fontSize: '60px',  // Increased size
                    color: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5);
                
                // Add entry animation
                this.tweens.add({
                    targets: monsterText,
                    y: monster.y,
                    duration: 800,
                    ease: 'Bounce.easeOut',
                    delay: index * 200
                });
                
                // Create monster name
                const nameText = this.add.text(monster.x, -20, monster.name, {
                    fontFamily: 'DeterminationMono, monospace',
                    fontSize: '20px',
                    color: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5);
                
                // Add entry animation for name
                this.tweens.add({
                    targets: nameText,
                    y: monster.y + 50,
                    duration: 800,
                    ease: 'Bounce.easeOut',
                    delay: index * 200 + 100
                });
                
                this.monsterSprites.push(monsterText);
                this.monsterTexts.push(nameText);
            });
        } else {
            // Make monsters visible if they were hidden
            this.monsterSprites.forEach((sprite, index) => {
                if (this.monsters[index].hp > 0) {
                    sprite.visible = true;
                    this.monsterTexts[index].visible = true;
                }
            });
        }
        
        // Update button colors
        this.updateButtonsColors();
    }
    
    drawFightScene() {
        this.cleanMenuOptions();
        
        // Draw selectable monster names
        this.optionTexts = [];
        this.monsters.forEach((monster, index) => {
            if (monster.hp <= 0) return; // Skip defeated monsters
            
            const isSelected = index === this.currentSelectedMonster;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            const textX = 160 + index * 160;
            const textY = 340;
            
            const optionText = this.add.text(textX, textY, monster.name, {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: color,
                align: 'center'
            }).setOrigin(0.5);
            
            this.optionTexts.push(optionText);
            
            // Draw selection heart
            if (isSelected) {
                this.heart.x = textX - 60;
                this.heart.y = textY;
            }
        });
    }
    
    drawActMonsterScene() {
        this.cleanMenuOptions();
        
        // Draw selectable monster names
        this.optionTexts = [];
        this.monsters.forEach((monster, index) => {
            if (monster.hp <= 0) return; // Skip defeated monsters
            
            const isSelected = index === this.currentSelectedMonster;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            const textX = 160 + index * 160;
            const textY = 340;
            
            const optionText = this.add.text(textX, textY, monster.name, {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: color,
                align: 'center'
            }).setOrigin(0.5);
            
            this.optionTexts.push(optionText);
            
            // Draw selection heart
            if (isSelected) {
                this.heart.x = textX - 60;
                this.heart.y = textY;
            }
        });
    }
    
    drawActOptionScene() {
        this.cleanMenuOptions();
        
        // Get options for selected monster
        const monster = this.monsters[this.currentSelectedMonster];
        const actOptions = gameConfig.actOptions[monster.name];
        
        // Draw options in 2x2 grid
        this.optionTexts = [];
        
        // Calculate positions for grid layout
        const gridX = 160;
        const gridY = 320;
        const colWidth = 240;
        const rowHeight = 40;
        
        actOptions.forEach((option, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            
            const isSelected = index === this.currentSelectedOption;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            
            const textX = gridX + col * colWidth;
            const textY = gridY + row * rowHeight;
            
            const optionText = this.add.text(textX, textY, `* ${option}`, {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: color,
                align: 'left'
            });
            
            this.optionTexts.push(optionText);
            
            // Position heart for selected option
            if (isSelected) {
                this.heart.x = textX - 25;
                this.heart.y = textY + 12;
            }
        });
    }
    
    drawItemScene() {
        this.cleanMenuOptions();
        
        // Draw item list
        this.optionTexts = [];
        
        gameConfig.items.forEach((item, index) => {
            const isSelected = index === this.currentSelectedOption;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            
            const textX = 50;
            const textY = 320 + index * 35;
            
            const optionText = this.add.text(textX, textY, `* ${item.name}`, {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: color,
                align: 'left'
            });
            
            this.optionTexts.push(optionText);
            
            // Position heart for selected item
            if (isSelected) {
                this.heart.x = textX - 25;
                this.heart.y = textY + 12;
            }
        });
    }
    
    drawMercyScene() {
        this.cleanMenuOptions();
        
        // MERCY options
        const options = ["Spare", "Flee"];
        
        // Draw options
        this.optionTexts = [];
        
        options.forEach((option, index) => {
            const isSelected = index === this.currentSelectedOption;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            
            const textX = 50;
            const textY = 320 + index * 35;
            
            const optionText = this.add.text(textX, textY, `* ${option}`, {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: color,
                align: 'left'
            });
            
            this.optionTexts.push(optionText);
            
            // Position heart for selected option
            if (isSelected) {
                this.heart.x = textX - 25;
                this.heart.y = textY + 12;
            }
        });
    }
    
    // Methods for selection actions
    selectMonsterToFight() {
        // Simple attack simulation
        const monster = this.monsters[this.currentSelectedMonster];
        
        // Set battle state for animation
        this.currentState = gameConfig.STATES.BATTLE_ANIMATION;
        this.cleanMenuOptions();
        
        // Create attack animation
        this.createAttackAnimation(monster);
    }
    
    createAttackAnimation(monster) {
        // Hide heart during animation
        this.heart.visible = false;
        
        // Create attack meter
        const meterWidth = 400;
        const meterHeight = 30;
        const meterX = this.cameras.main.width / 2 - meterWidth / 2;
        const meterY = 340;
        
        const meterBg = this.add.rectangle(
            this.cameras.main.width / 2, 
            meterY, 
            meterWidth, 
            meterHeight, 
            0x000000
        );
        meterBg.setStrokeStyle(2, gameConfig.COLORS.WHITE);
        
        // Create sliding marker
        const marker = this.add.rectangle(
            meterX, 
            meterY, 
            5, 
            meterHeight + 10, 
            gameConfig.COLORS.RED
        );
        
        // Create target zones for better timing
        const perfectZone = this.add.rectangle(
            this.cameras.main.width / 2, 
            meterY, 
            50, 
            meterHeight, 
            gameConfig.COLORS.RED, 
            0.3
        );
        
        const goodZone = this.add.rectangle(
            this.cameras.main.width / 2, 
            meterY, 
            100, 
            meterHeight, 
            gameConfig.COLORS.YELLOW, 
            0.3
        );
        
        // Animate the marker
        this.tweens.add({
            targets: marker,
            x: meterX + meterWidth,
            duration: 1500,
            onComplete: () => {
                // Auto-hit at the end if player didn't press
                this.processAttackHit(monster, marker, meterX, meterWidth, perfectZone, goodZone, meterBg);
            }
        });
        
        // Listen for attack timing
        const hitListener = this.keyZ.on('down', () => {
            this.processAttackHit(monster, marker, meterX, meterWidth, perfectZone, goodZone, meterBg);
            this.keyZ.off('down', hitListener); // Remove listener after hit
        });
    }
    
    processAttackHit(monster, marker, meterX, meterWidth, perfectZone, goodZone, meterBg) {
        // Stop the marker animation
        this.tweens.killTweensOf(marker);
        
        // Calculate damage based on position
        const hitPosition = (marker.x - meterX) / meterWidth;
        let damage = 1; // Minimum damage
        
        // Check if hit was in perfect zone
        if (Math.abs(marker.x - perfectZone.x) < perfectZone.width / 2) {
            // Perfect hit!
            damage = 10 + Math.floor(Math.random() * 5); // 10-14 damage
            this.createFloatingText(monster.x, monster.y - 20, "PERFECT!", "#FF0000");
        }
        // Check if hit was in good zone
        else if (Math.abs(marker.x - goodZone.x) < goodZone.width / 2) {
            // Good hit
            damage = 5 + Math.floor(Math.random() * 4); // 5-8 damage
            this.createFloatingText(monster.x, monster.y - 20, "Good!", "#FFFF00");
        }
        else {
            // Poor hit
            damage = 1 + Math.floor(Math.random() * 3); // 1-3 damage
            this.createFloatingText(monster.x, monster.y - 20, "Miss!", "#FFFFFF");
        }
        
        // Flash the monster
        const monsterSprite = this.monsterSprites[this.currentSelectedMonster];
        
        // Clean up meter elements
        marker.destroy();
        perfectZone.destroy();
        goodZone.destroy();
        meterBg.destroy();
        
        // Create slash animation
        this.createSlashEffect(monster.x, monster.y);
        
        // Play attack sound
        this.attackSound.play();
        
        // Create damage animation
        this.tweens.add({
            targets: monsterSprite,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Apply damage
                monster.hp = Math.max(0, monster.hp - damage);
                
                // Play damage sound
                this.damageSound.play();
                
                // Show result dialogue
                this.setDialogueText(`* You hit ${monster.name} for ${damage} damage!`);
                this.currentState = gameConfig.STATES.INTRO;
                
                // Check if monster is defeated
                if (monster.hp <= 0) {
                    // Hide monster sprite
                    monsterSprite.visible = false;
                    this.monsterTexts[this.currentSelectedMonster].visible = false;
                    
                    // Show victory message
                    this.setDialogueText(`* ${monster.name} has been defeated!\n* You earned 10 EXP and 20 GOLD.`);
                } else {
                    // Schedule enemy turn
                    this.time.delayedCall(2000, this.startEnemyTurn, [], this);
                }
            }
        });
    }
    
    createSlashEffect(x, y) {
        // Create slash line
        const slash = this.add.graphics();
        slash.lineStyle(5, gameConfig.COLORS.WHITE, 1);
        slash.lineBetween(x - 50, y - 50, x + 50, y + 50);
        
        // Add counter slash
        this.time.delayedCall(100, () => {
            slash.clear();
            slash.lineStyle(5, gameConfig.COLORS.WHITE, 1);
            slash.lineBetween(x + 50, y - 50, x - 50, y + 50);
            
            // Fade out and destroy
            this.tweens.add({
                targets: slash,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    slash.destroy();
                }
            });
        });
    }
    
    createFloatingText(x, y, text, color) {
        // Create floating text for feedback
        const floatingText = this.add.text(x, y, text, {
            fontFamily: 'DeterminationMono, monospace',
            fontSize: '24px',
            color: color,
            align: 'center'
        }).setOrigin(0.5);
        
        // Animate floating up and fading
        this.tweens.add({
            targets: floatingText,
            y: y - 40,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }
    
    selectActOption() {
        const monster = this.monsters[this.currentSelectedMonster];
        const monsterName = monster.name;
        const actOptions = gameConfig.actOptions[monsterName];
        const selectedAction = actOptions[this.currentSelectedOption];
        
        let responseText;
        
        // If action is "Check", show monster info
        if (selectedAction === "Check") {
            responseText = gameConfig.dialogues.check[monsterName];
        } 
        // Otherwise show corresponding response
        else {
            const actionResponse = gameConfig.dialogues.act[monsterName]?.[selectedAction];
            responseText = actionResponse || `* You ${selectedAction.toLowerCase()} ${monsterName}.`;
        }
        
        this.setDialogueText(responseText);
        this.currentState = gameConfig.STATES.INTRO;
        this.selectedMonsterForAct = false;
        this.buttonSound.play();
        
        // Clean options
        this.cleanMenuOptions();
        
        // Hide heart during dialogue
        this.heart.visible = false;
        
        // Schedule enemy turn after dialogue
        this.time.delayedCall(3000, this.startEnemyTurn, [], this);
    }
    
    useItem() {
        const item = gameConfig.items[this.currentSelectedOption];
        
        // Use item (heal)
        const healAmount = Math.min(item.heal, this.player.maxhp - this.player.hp);
        this.player.hp += healAmount;
        
        // Visual healing effect
        this.time.delayedCall(300, () => {
            // Play healing sound
            this.healSound.play();
        });
        
        // Create healing particles
        this.createHealingEffect();
        
        // Show dialogue with result
        this.setDialogueText(`* You use ${item.name}.\n* You recovered ${healAmount} HP!`);
        this.currentState = gameConfig.STATES.INTRO;
        this.buttonSound.play();
        
        // Clean options
        this.cleanMenuOptions();
        
        // Hide heart during dialogue
        this.heart.visible = false;
        
        // Schedule enemy turn after dialogue
        this.time.delayedCall(3000, this.startEnemyTurn, [], this);
    }
    
    createHealingEffect() {
        // Create a particle emitter for healing effect
        const particles = this.add.particles('heart');
        
        const emitter = particles.createEmitter({
            x: this.player.x,
            y: 400,
            speed: { min: 20, max: 40 },
            angle: { min: 250, max: 290 },
            scale: { start: 0.4, end: 0.1 },
            blendMode: 'ADD',
            lifespan: 1000,
            tint: gameConfig.COLORS.LIGHT_BLUE,
            quantity: 1
        });
        
        // Emit particles then destroy
        this.time.delayedCall(1000, () => {
            emitter.stop();
            this.time.delayedCall(1000, () => {
                particles.destroy();
            });
        });
    }
    
    selectMercyOption() {
        const options = ["Spare", "Flee"];
        const selectedOption = options[this.currentSelectedOption];
        
        let responseText;
        if (selectedOption === "Spare") {
            responseText = "* You tried to spare the monsters.\n* But nobody was ready to accept\n  mercy.";
        } else {
            responseText = "* You tried to flee...\n* But you couldn't escape!";
        }
        
        this.setDialogueText(responseText);
        this.currentState = gameConfig.STATES.INTRO;
        this.buttonSound.play();
        
        // Clean options
        this.cleanMenuOptions();
        
        // Hide heart during dialogue
        this.heart.visible = false;
        
        // Schedule enemy turn after dialogue
        this.time.delayedCall(3000, this.startEnemyTurn, [], this);
    }
    
    returnToMainMenu() {
        this.currentState = gameConfig.STATES.PLAYER_CHOICE;
        this.buttonSound.play();
        this.cleanMenuOptions();
        this.updateButtonsColors();
        
        // Hide heart when returning to main menu
        this.heart.visible = false;
    }
    
    startEnemyTurn() {
        // If we're in intro state, wait until finished before enemy turn
        if (this.currentState === gameConfig.STATES.INTRO) {
            // If still typing text, wait to finish
            if (this.isTyping) {
                this.time.delayedCall(1000, this.startEnemyTurn, [], this);
                return;
            }
            
            // Show enemy attack text
            const activeMonsters = this.monsters.filter(m => m.hp > 0);
            if (activeMonsters.length > 0) {
                const attackingMonster = activeMonsters[Math.floor(Math.random() * activeMonsters.length)];
                this.setDialogueText(gameConfig.dialogues.enemyAttack[attackingMonster.name] || `* ${attackingMonster.name} is doing something.`);
                
                // Wait for text to finish before starting battle
                this.time.delayedCall(2000, () => {
                    // Hide dialogue box during enemy turn
                    this.dialogueBox.visible = false;
                    this.dialogueText.visible = false;
                    
                    this.currentState = gameConfig.STATES.ENEMY_TURN;
                    
                    // Show battle box with animation
                    this.battleBox.visible = true;
                    this.heart.visible = true;
                    this.battleBoxAnimation.resume();
                    
                    // Create animation for battle box appearance
                    this.battleBox.scaleX = 0.1;
                    this.battleBox.scaleY = 0.1;
                    
                    this.tweens.add({
                        targets: this.battleBox,
                        scaleX: 1,
                        scaleY: 1,
                        duration: gameConfig.battleBox.animationTime,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            // Position heart in center of battle box
                            this.player.x = gameConfig.battleBox.x + gameConfig.battleBox.width / 2;
                            this.player.y = gameConfig.battleBox.y + gameConfig.battleBox.height / 2;
                            this.heart.x = this.player.x;
                            this.heart.y = this.player.y;
                            
                            // Start enemy attack (simplified for demo)
                            this.startEnemyAttack();
                        }
                    });
                }, [], this);
            } else {
                // No active enemies, return to menu
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
            }
            return;
        }
        
        this.currentState = gameConfig.STATES.ENEMY_TURN;
        
        // Hide dialogue box during enemy turn
        this.dialogueBox.visible = false;
        this.dialogueText.visible = false;
        
        // Show battle box
        this.battleBox.visible = true;
        this.heart.visible = true;
        this.battleBoxAnimation.resume();
        
        // Position heart in center of battle box
        this.player.x = gameConfig.battleBox.x + gameConfig.battleBox.width / 2;
        this.player.y = gameConfig.battleBox.y + gameConfig.battleBox.height / 2;
        this.heart.x = this.player.x;
        this.heart.y = this.player.y;
        
        // Start enemy attack
        this.startEnemyAttack();
    }
    
    startEnemyAttack() {
        // Create simple projectiles for enemy attack
        this.enemyProjectiles = [];
        
        // Create more projectiles for a more challenging battle
        for (let i = 0; i < 10; i++) {
            const size = Phaser.Math.Between(8, 16);
            const x = Phaser.Math.Between(
                gameConfig.battleBox.x + size, 
                gameConfig.battleBox.x + gameConfig.battleBox.width - size
            );
            const y = gameConfig.battleBox.y - size * 2;
            
            // Create projectile with proper color and animation
            const projectile = this.add.rectangle(x, y, size, size, 0xFFFFFF);
            
            // Add pulsing animation to projectiles
            this.tweens.add({
                targets: projectile,
                alpha: 0.7,
                duration: 500 + i * 50,
                yoyo: true,
                repeat: -1
            });
            
            // Add random speed and direction
            projectile.speedY = Phaser.Math.Between(2, 4);
            projectile.speedX = Phaser.Math.Between(-1, 1);
            
            this.enemyProjectiles.push(projectile);
        }
        
        // Create timer event to move projectiles
        this.projectileEvent = this.time.addEvent({
            delay: 16, // Smoother movement with lower delay
            callback: this.updateProjectiles,
            callbackScope: this,
            loop: true
        });
        
        // End turn after a time
        this.time.delayedCall(5000, this.endEnemyTurn, [], this);
    }
    
    updateProjectiles() {
        // Move projectiles
        for (let i = 0; i < this.enemyProjectiles.length; i++) {
            const projectile = this.enemyProjectiles[i];
            projectile.y += projectile.speedY;
            projectile.x += projectile.speedX;
            
            // Bounce off box edges
            if (projectile.x < gameConfig.battleBox.x + projectile.width/2 || 
                projectile.x > gameConfig.battleBox.x + gameConfig.battleBox.width - projectile.width/2) {
                projectile.speedX *= -1;
            }
            
            // If projectile exits box bottom, reset to top
            if (projectile.y > gameConfig.battleBox.y + gameConfig.battleBox.height + projectile.height) {
                projectile.y = gameConfig.battleBox.y - projectile.height;
                projectile.x = Phaser.Math.Between(
                    gameConfig.battleBox.x + projectile.width / 2, 
                    gameConfig.battleBox.x + gameConfig.battleBox.width - projectile.width / 2
                );
            }
            
            // Check collision with player
            if (Phaser.Geom.Intersects.RectangleToRectangle(
                new Phaser.Geom.Rectangle(
                    projectile.x - projectile.width/2, 
                    projectile.y - projectile.height/2, 
                    projectile.width, 
                    projectile.height),
                new Phaser.Geom.Rectangle(
                    this.heart.x - 8, 
                    this.heart.y - 8, 
                    16, 
                    16)
            )) {
                // Flash heart effect
                this.tweens.add({
                    targets: this.heart,
                    alpha: 0.2,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
                
                // Play damage sound
                this.damageSound.play();
                
                // Reduce HP
                this.player.hp = Math.max(0, this.player.hp - 1);
                
                // Create damage effect particles
                this.createDamageEffect(this.heart.x, this.heart.y);
                
                // If player has no HP left, game over
                if (this.player.hp <= 0) {
                    this.showGameOver();
                }
                
                // Reset projectile position
                projectile.y = gameConfig.battleBox.y - projectile.height;
                projectile.x = Phaser.Math.Between(
                    gameConfig.battleBox.x + projectile.width / 2, 
                    gameConfig.battleBox.x + gameConfig.battleBox.width - projectile.width / 2
                );
            }
        }
    }
    
    createDamageEffect(x, y) {
        // Create particles for damage effect
        const particles = this.add.particles('heart');
        
        const emitter = particles.createEmitter({
            x: x,
            y: y,
            speed: { min: 50, max: 100 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0.05 },
            blendMode: 'ADD',
            lifespan: 800,
            tint: 0xFF0000
        });
        
        // Emit a burst of particles
        emitter.explode(10);
        
        // Destroy particles after they're done
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }
    
    showGameOver() {
        // Stop projectiles and clear event
        if (this.projectileEvent) {
            this.projectileEvent.remove();
        }
        
        // Remove projectiles
        if (this.enemyProjectiles) {
            this.enemyProjectiles.forEach(p => p.destroy());
            this.enemyProjectiles = [];
        }
        
        // Show Game Over text with trembling effect
        const gameOverText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2 - 50, 
            "GAME OVER", 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '48px',
                color: '#FF0000',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Add shaking animation to game over text
        this.tweens.add({
            targets: gameOverText,
            x: gameOverText.x + 10,
            duration: 50,
            yoyo: true,
            repeat: 10,
            ease: 'Sine.easeInOut'
        });
        
        // Play soul breaking animation
        this.tweens.add({
            targets: this.heart,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 500,
            onComplete: () => {
                // Create breaking effect
                this.createHeartBreakEffect(this.heart.x, this.heart.y);
                this.heart.visible = false;
            }
        });
        
        // Hide UI elements
        this.battleBox.visible = false;
        
        // Stop the game
        this.currentState = gameConfig.STATES.INTRO;
        
        // Show dialogue with Game Over message
        this.time.delayedCall(1500, () => {
            this.dialogueBox.visible = true;
            this.dialogueText.visible = true;
            this.setDialogueText("* You lost all your HP!\n* GAME OVER");
            
            // Allow restart with Z after a delay
            this.time.delayedCall(3000, () => {
                // Add restart text with pulsing effect
                this.restartText = this.add.text(
                    this.cameras.main.width / 2, 
                    this.cameras.main.height / 2 + 50, 
                    "Press Z to restart", 
                    {
                        fontFamily: 'DeterminationMono, monospace',
                        fontSize: '24px',
                        color: '#FFFF00',
                        align: 'center'
                    }
                ).setOrigin(0.5);
                
                // Add pulsing animation to restart text
                this.tweens.add({
                    targets: this.restartText,
                    scale: 1.1,
                    duration: 800,
                    yoyo: true,
                    repeat: -1
                });
                
                // Set up restart event
                this.input.keyboard.once('keydown-Z', () => {
                    // Reset player HP
                    this.player.hp = this.player.maxhp;
                    
                    // Reset game state
                    this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                    this.updateButtonsColors();
                    
                    // Destroy game over elements
                    if (this.restartText) {
                        this.restartText.destroy();
                    }
                    if (gameOverText) {
                        gameOverText.destroy();
                    }
                    
                    // Restore heart
                    this.heart.visible = false;
                    this.heart.setScale(1.3);
                    
                    // Reset monsters if needed
                    this.monsters.forEach((monster, index) => {
                        if (monster.hp <= 0) {
                            monster.hp = monster.maxhp;
                            if (this.monsterSprites && this.monsterSprites[index]) {
                                this.monsterSprites[index].visible = true;
                                this.monsterTexts[index].visible = true;
                            }
                        }
                    });
                });
            });
        });
    }
    
    createHeartBreakEffect(x, y) {
        // Create the heart break effect
        const pieces = 8;
        const angleStep = 360 / pieces;
        
        for (let i = 0; i < pieces; i++) {
            const angle = i * angleStep;
            const distance = 50;
            
            // Create a small heart piece
            const piece = this.add.rectangle(
                x, 
                y, 
                6, 
                6, 
                gameConfig.COLORS.RED
            );
            
            // Animate the piece flying away
            this.tweens.add({
                targets: piece,
                x: x + Math.cos(angle * Math.PI / 180) * distance,
                y: y + Math.sin(angle * Math.PI / 180) * distance,
                alpha: 0,
                duration: 1000,
                onComplete: () => {
                    piece.destroy();
                }
            });
        }
    }
    
    endEnemyTurn() {
        // Stop projectiles and clear event
        if (this.projectileEvent) {
            this.projectileEvent.remove();
        }
        
        // Remove projectiles
        if (this.enemyProjectiles) {
            this.enemyProjectiles.forEach(p => p.destroy());
            this.enemyProjectiles = [];
        }
        
        // Shrink battle box with animation
        this.tweens.add({
            targets: this.battleBox,
            scaleX: 0.1,
            scaleY: 0.1,
            duration: gameConfig.battleBox.animationTime,
            ease: 'Back.easeIn',
            onComplete: () => {
                // Hide battle box
                this.battleBox.visible = false;
                this.battleBoxAnimation.pause();
                
                // Hide heart
                this.heart.visible = false;
                
                // Show dialogue box again
                this.dialogueBox.visible = true;
                this.dialogueText.visible = true;
                
                // Return to main menu only if player is alive
                if (this.player.hp > 0) {
                    this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                    this.updateButtonsColors();
                }
            }
        });
    }
    
    // Dialogue management with typewriter effect
    setDialogueText(text) {
        // Stop any previous text
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
        }
        
        this.dialogueFullText = text;
        this.dialogueText.setText('');
        this.dialogueCharIndex = 0;
        this.isTyping = true;
        
        // Start new timer for typewriter effect
        this.typewriterTimer = this.time.addEvent({
            delay: 30,
            callback: this.typewriterEffect,
            callbackScope: this,
            loop: true
        });
    }
    
    typewriterEffect() {
        if (this.dialogueCharIndex < this.dialogueFullText.length) {
            // Add characters to displayed text
            const charsToAdd = Math.min(this.textSpeed, this.dialogueFullText.length - this.dialogueCharIndex);
            const newText = this.dialogueFullText.substr(0, this.dialogueCharIndex + charsToAdd);
            this.dialogueText.setText(newText);
            this.dialogueCharIndex += charsToAdd;
            
            // Play text sound (only every 3 characters)
            if (this.dialogueCharIndex % 3 === 0) {
                this.textSound.play({ volume: 0.5 });
            }
        } else {
            // Stop timer when finished
            this.isTyping = false;
            if (this.typewriterTimer) {
                this.typewriterTimer.remove();
                this.typewriterTimer = null;
            }
        }
    }
    
    completeText() {
        if (this.isTyping) {
            // Immediately complete text
            this.dialogueText.setText(this.dialogueFullText);
            this.dialogueCharIndex = this.dialogueFullText.length;
            this.isTyping = false;
            
            // Stop timer
            if (this.typewriterTimer) {
                this.typewriterTimer.remove();
                this.typewriterTimer = null;
            }
        }
    }
    
    // Click handling
    handleClick(x, y) {
        // If on start screen, any click starts the game
        if (this.currentState === gameConfig.STATES.START_SCREEN) {
            this.justClicked = true; // Set flag for next frame
            return;
        }
        
        // If in dialogue, advance or complete
        if (this.currentState === gameConfig.STATES.INTRO) {
            if (this.isTyping) {
                this.completeText();
            } else {
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                this.updateButtonsColors();
            }
            return;
        }
        
        // If selecting buttons, detect which button was clicked
        if (this.currentState === gameConfig.STATES.PLAYER_CHOICE) {
            for (let i = 0; i < this.buttonSprites.length; i++) {
                const button = this.buttonSprites[i];
                const buttonBounds = button.getBounds();
                
                if (buttonBounds.contains(x, y)) {
                    this.currentSelectedButton = i;
                    this.updateButtonsColors();
                    this.selectCurrentButton();
                    return;
                }
            }
        }
        
        // Click on options in FIGHT, ACT, ITEM, MERCY menus
        if (this.optionTexts && this.optionTexts.length > 0) {
            for (let i = 0; i < this.optionTexts.length; i++) {
                const option = this.optionTexts[i];
                const optionBounds = option.getBounds();
                
                if (optionBounds.contains(x, y)) {
                    // Update selected option based on current state
                    switch (this.currentState) {
                        case gameConfig.STATES.FIGHT:
                            this.currentSelectedMonster = i;
                            this.drawFightScene();
                            break;
                        case gameConfig.STATES.ACT:
                            if (!this.selectedMonsterForAct) {
                                this.currentSelectedMonster = i;
                                this.drawActMonsterScene();
                            } else {
                                this.currentSelectedOption = i;
                                // Update row/col for grid navigation
                                this.actMenuRow = Math.floor(i / 2);
                                this.actMenuCol = i % 2;
                                this.drawActOptionScene();
                            }
                            break;
                        case gameConfig.STATES.ITEM:
                            this.currentSelectedOption = i;
                            this.drawItemScene();
                            break;
                        case gameConfig.STATES.MERCY:
                            this.currentSelectedOption = i;
                            this.drawMercyScene();
                            break;
                    }
                    
                    this.buttonSound.play();
                    return;
                }
            }
        }
    }
    
    // Render start screen
    renderStartScreen() {
        // Draw title and start text with animated entry
        this.titleText = this.add.text(
            this.cameras.main.width / 2, 
            -50, 
            "UNDERTALE: Beyond The Story", 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '36px',
                color: '#FFFFFF',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Animate title entry
        this.tweens.add({
            targets: this.titleText,
            y: this.cameras.main.height / 2 - 60,
            duration: 1500,
            ease: 'Bounce.easeOut'
        });
        
        this.startText = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height + 50, 
            "Press Z to start or click anywhere", 
            {
                fontFamily: 'DeterminationMono, monospace',
                fontSize: '24px',
                color: '#FFFF00',
                align: 'center'
            }
        ).setOrigin(0.5);
        
        // Animate start text entry
        this.tweens.add({
            targets: this.startText,
            y: this.cameras.main.height / 2 + 30,
            duration: 1500,
            ease: 'Bounce.easeOut',
            delay: 500
        });
        
        // Pulsing heart for start screen
        const heartX = this.cameras.main.width / 2 - 120;
        const heartY = this.cameras.main.height / 2 + 30;
        
        this.startHeart = this.add.sprite(heartX, heartY, 'heart');
        this.startHeart.setScale(1.5);
        this.startHeart.alpha = 0;
        
        // Animate heart appearance
        this.tweens.add({
            targets: this.startHeart,
            alpha: 1,
            duration: 1000,
            delay: 1000
        });
        
        // Add pulsing animation to heart
        this.tweens.add({
            targets: this.startHeart,
            scaleX: 1.8,
            scaleY: 1.8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            delay: 1000
        });
    }
}