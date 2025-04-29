// Methods for ACT, ITEM, and MERCY
MainScene.prototype.showActScene = function() {
    this.cleanMenuOptions();
    this.drawActMonsterScene();
    
    // Show the soul in the ACT menu
    this.heart.visible = true;
};

MainScene.prototype.drawActMonsterScene = function() {
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

MainScene.prototype.drawActOptionScene = function() {
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
};

MainScene.prototype.selectActOption = function() {
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
};

// ITEM methods
MainScene.prototype.updateItem = function() {
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
};

MainScene.prototype.showItemScene = function() {
    this.cleanMenuOptions();
    this.drawItemScene();
    
    // Show the soul in the ITEM menu
    this.heart.visible = true;
};

MainScene.prototype.drawItemScene = function() {
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
};

MainScene.prototype.useItem = function() {
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
};

MainScene.prototype.createHealingEffect = function() {
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
};

// MERCY methods
MainScene.prototype.updateMercy = function() {
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
};

MainScene.prototype.showMercyScene = function() {
    this.cleanMenuOptions();
    this.drawMercyScene();
    
    // Show the soul in the MERCY menu
    this.heart.visible = true;
};

MainScene.prototype.drawMercyScene = function() {
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
};

MainScene.prototype.selectMercyOption = function() {
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
};

MainScene.prototype.returnToMainMenu = function() {
    this.currentState = gameConfig.STATES.PLAYER_CHOICE;
    this.buttonSound.play();
    this.cleanMenuOptions();
    this.updateButtonsColors();
    
    // Hide heart when returning to main menu
    this.heart.visible = false;
};