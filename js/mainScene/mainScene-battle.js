// Agregar estos métodos a la clase MainScene
MainScene.prototype.startGame = function() {
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
};

MainScene.prototype.cleanStartScreen = function() {
    // Clean any start screen specific elements
    if (this.titleText) {
        this.titleText.destroy();
        this.startText.destroy();
        this.startAnimation.remove(); // Remove text animation
        if (this.startHeart) {
            this.startHeart.destroy();
        }
    }
};

MainScene.prototype.drawBattleScene = function() {
    // Draw monsters with animated entry
    if (!this.monsterSprites) {
        this.monsterSprites = [];
        this.monsterTexts = [];
        
        // Move monsters higher on the screen
        const monsterY = 80; // Original was 120
        
        this.monsters.forEach((monster, index) => {
            // Create monster sprite/emoji with consistent size
            const monsterText = this.add.text(monster.x, -50, monster.sprite, {
                fontFamily: 'Arial',
                fontSize: '60px',
                color: '#FFFFFF',
                align: 'center'
            }).setOrigin(0.5);
            
            // Add glow effect to monsters
            const glow = this.add.graphics();
            glow.fillStyle(0xFFFFFF, 0.2);
            glow.fillCircle(monster.x, monsterY, 40);
            glow.alpha = 0;
            
            // Add entry animation
            this.tweens.add({
                targets: monsterText,
                y: monsterY, // Use consistent Y position
                duration: 800,
                ease: 'Bounce.easeOut',
                delay: index * 200
            });
            
            // Add glow animation
            this.tweens.add({
                targets: glow,
                alpha: 0.5,
                duration: 800,
                delay: index * 200 + 400,
                yoyo: true,
                repeat: -1
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
                y: monsterY + 50, // Position below monster
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
};

// FIGHT methods
MainScene.prototype.updateFight = function() {
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
};

MainScene.prototype.showFightScene = function() {
    this.cleanMenuOptions();
    this.drawFightScene();
    
    // Show the soul in the FIGHT menu
    this.heart.visible = true;
};

MainScene.prototype.drawFightScene = function() {
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
};

MainScene.prototype.selectMonsterToFight = function() {
    // Simple attack simulation
    const monster = this.monsters[this.currentSelectedMonster];
    
    // Set battle state for animation
    this.currentState = gameConfig.STATES.BATTLE_ANIMATION;
    this.cleanMenuOptions();
    
    // Create attack animation
    this.createAttackAnimation(monster);
};

MainScene.prototype.createAttackAnimation = function(monster) {
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
};

MainScene.prototype.processAttackHit = function(monster, marker, meterX, meterWidth, perfectZone, goodZone, meterBg) {
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
};

MainScene.prototype.createSlashEffect = function(x, y) {
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
};

MainScene.prototype.createFloatingText = function(x, y, text, color) {
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
};

// ACT methods
MainScene.prototype.updateAct = function() {
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
};