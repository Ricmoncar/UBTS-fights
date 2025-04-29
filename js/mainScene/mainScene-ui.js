// Agregar estos métodos a la clase MainScene
MainScene.prototype.updateButtonsColors = function() {
    for (let i = 0; i < this.buttons.length; i++) {
        if (i === this.currentSelectedButton) {
            this.buttons[i].setColor('#FFFF00');
            // Use the hover version of the sprite
            this.buttonSprites[i].setTexture(["fightHover", "actHover", "itemHover", "mercyHover"][i]);
            this.buttonSprites[i].setScale(1.3);
            // Ensure consistent display size even when scaled
            this.buttonSprites[i].setDisplaySize(110, 33);
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
            // Ensure consistent display size
            this.buttonSprites[i].setDisplaySize(100, 30);
        }
    }
};

MainScene.prototype.selectCurrentButton = function() {
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
};

MainScene.prototype.cleanMenuOptions = function() {
    // Clean previous options
    if (this.optionTexts && this.optionTexts.length > 0) {
        this.optionTexts.forEach(text => text.destroy());
        this.optionTexts = [];
    }
    
    if (this.selectionHeart) {
        this.selectionHeart.destroy();
        this.selectionHeart = null;
    }
};

MainScene.prototype.hideUIElements = function() {
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
};

MainScene.prototype.showUIElements = function() {
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
};

// Dialogue management with typewriter effect
MainScene.prototype.setDialogueText = function(text) {
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
};

MainScene.prototype.typewriterEffect = function() {
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
};

MainScene.prototype.completeText = function() {
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
};

// Click handling
MainScene.prototype.handleClick = function(x, y) {
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
};