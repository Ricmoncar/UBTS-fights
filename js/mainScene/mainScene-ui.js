MainScene.prototype.updateButtonsColors = function() {
    for (let i = 0; i < this.buttons.length; i++) {
        if (i === this.currentSelectedButton) {
            if (this.buttons[i]) this.buttons[i].setColor('#FFFF00');
            
            if (this.buttonSprites[i]) {
                this.buttonSprites[i].setTexture(["fightHover", "actHover", "itemHover", "mercyHover"][i]);
                this.buttonSprites[i].setScale(gameConfig.ui.buttonScale * 1.1); // 10% larger when selected
                this.buttonSprites[i].setDisplaySize(140, 44); // Bigger buttons when selected
                
                // Add a small bounce animation for selected button
                this.tweens.add({
                    targets: this.buttonSprites[i],
                    y: gameConfig.ui.buttonY - 5, // Slight upward movement
                    duration: 100,
                    yoyo: true,
                    ease: 'Bounce.Out'
                });
            }
        } else {
            if (this.buttons[i]) this.buttons[i].setColor('#FFFFFF');
            
            if (this.buttonSprites[i]) {
                this.buttonSprites[i].setTexture(["fight", "act", "item", "mercy"][i]);
                this.buttonSprites[i].setScale(gameConfig.ui.buttonScale);
                this.buttonSprites[i].setDisplaySize(130, 40); // Default button size
            }
        }
    }
};

MainScene.prototype.selectCurrentButton = function() {
    this.playSound('button');
    
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
    if (this.optionTexts && this.optionTexts.length > 0) {
        this.optionTexts.forEach(text => {
            if (text) text.destroy();
        });
        this.optionTexts = [];
    }
    
    if (this.selectionHeart) {
        this.selectionHeart.destroy();
        this.selectionHeart = null;
    }
};

// Modified to check for existence of elements before hiding them
MainScene.prototype.hideUIElements = function() {
    // Only hide elements that exist
    if (this.dialogueBox) this.dialogueBox.visible = false;
    if (this.dialogueText) this.dialogueText.visible = false;
    if (this.playerNameText) this.playerNameText.visible = false;
    if (this.hpText) this.hpText.visible = false;
    if (this.hpBarBg) this.hpBarBg.visible = false;
    if (this.hpBarFill) this.hpBarFill.visible = false;
    if (this.hpValuesText) this.hpValuesText.visible = false;
    if (this.heart) this.heart.visible = false;
    if (this.battleBox) this.battleBox.visible = false;
    
    // Hide buttons if they exist
    if (this.buttons) {
        this.buttons.forEach(button => {
            if (button) button.visible = false;
        });
    }
    
    if (this.buttonSprites) {
        this.buttonSprites.forEach(sprite => {
            if (sprite) sprite.visible = false;
        });
    }
    
    if (this.monsterSprites) {
        this.monsterSprites.forEach(sprite => {
            if (sprite) sprite.visible = false;
        });
        
        this.monsterTexts.forEach(text => {
            if (text) text.visible = false;
        });
    }
    
    if (this.monsterBackgrounds) {
        this.monsterBackgrounds.forEach(bg => {
            if (bg) bg.visible = false;
        });
    }
};

MainScene.prototype.showUIElements = function() {
    // Only show elements that exist
    if (this.dialogueBox) this.dialogueBox.visible = true;
    if (this.dialogueText) this.dialogueText.visible = true;
    if (this.playerNameText) this.playerNameText.visible = true;
    if (this.hpText) this.hpText.visible = true;
    if (this.hpBarBg) this.hpBarBg.visible = true;
    if (this.hpBarFill) this.hpBarFill.visible = true;
    if (this.hpValuesText) this.hpValuesText.visible = true;
    
    if (this.buttons && this.buttonSprites) {
        this.buttons.forEach((button, index) => {
            if (!button) return;
            
            // Show button if configured
            button.visible = !gameConfig.ui.hideButtonLabels;
            
            if (this.buttonSprites[index]) {
                this.buttonSprites[index].visible = true;
                
                // Reset to base position
                this.buttonSprites[index].y = gameConfig.ui.buttonY;
                
                // Only animate the button label if it's visible
                if (!gameConfig.ui.hideButtonLabels && button) {
                    button.y = gameConfig.ui.buttonY + 30;
                }
                
                // Add entry animation
                this.tweens.add({
                    targets: this.buttonSprites[index],
                    y: gameConfig.ui.buttonY,
                    alpha: { from: 0, to: 1 },
                    duration: 300,
                    ease: 'Back.easeOut',
                    delay: index * 100
                });
            }
        });
    }
};

MainScene.prototype.setDialogueText = function(text) {
    if (!this.dialogueText) return; // Safety check
    
    if (this.typewriterTimer) {
        this.typewriterTimer.remove();
    }
    
    this.dialogueFullText = text;
    this.dialogueText.setText('');
    this.dialogueCharIndex = 0;
    this.isTyping = true;
    
    this.typewriterTimer = this.time.addEvent({
        delay: 30,
        callback: this.typewriterEffect,
        callbackScope: this,
        loop: true
    });
};

MainScene.prototype.typewriterEffect = function() {
    if (!this.dialogueText) return; // Safety check
    
    if (this.dialogueCharIndex < this.dialogueFullText.length) {
        const charsToAdd = Math.min(this.textSpeed, this.dialogueFullText.length - this.dialogueCharIndex);
        const newText = this.dialogueFullText.substr(0, this.dialogueCharIndex + charsToAdd);
        this.dialogueText.setText(newText);
        this.dialogueCharIndex += charsToAdd;
        
        if (this.dialogueCharIndex % 3 === 0) {
            this.playSound('text');
        }
    } else {
        this.isTyping = false;
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }
    }
};

MainScene.prototype.completeText = function() {
    if (!this.dialogueText) return; // Safety check
    
    if (this.isTyping) {
        this.dialogueText.setText(this.dialogueFullText);
        this.dialogueCharIndex = this.dialogueFullText.length;
        this.isTyping = false;
        
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
            this.typewriterTimer = null;
        }
    }
};

MainScene.prototype.handleClick = function(x, y) {
    if (this.currentState === gameConfig.STATES.START_SCREEN) {
        this.justClicked = true;
        return;
    }
    
    if (this.currentState === gameConfig.STATES.INTRO) {
        if (this.isTyping) {
            this.completeText();
        } else {
            this.currentState = gameConfig.STATES.PLAYER_CHOICE;
            this.updateButtonsColors();
        }
        return;
    }
    
    if (this.currentState === gameConfig.STATES.PLAYER_CHOICE && this.buttonSprites) {
        // Handle button clicks
        for (let i = 0; i < this.buttonSprites.length; i++) {
            const button = this.buttonSprites[i];
            if (!button) continue;
            
            const buttonBounds = button.getBounds();
            
            if (buttonBounds.contains(x, y)) {
                this.currentSelectedButton = i;
                this.updateButtonsColors();
                this.selectCurrentButton();
                return;
            }
        }
    }
    
    // Handle option clicks in submenus (FIGHT, ACT, ITEM, MERCY)
    if (this.optionTexts && this.optionTexts.length > 0) {
        for (let i = 0; i < this.optionTexts.length; i++) {
            const option = this.optionTexts[i];
            if (!option) continue;
            
            const optionBounds = option.getBounds();
            
            if (optionBounds.contains(x, y)) {
                switch (this.currentState) {
                    case gameConfig.STATES.FIGHT:
                        this.currentSelectedMonster = i;
                        this.drawFightScene();
                        this.playSound('button');
                        break;
                    case gameConfig.STATES.ACT:
                        if (!this.selectedMonsterForAct) {
                            this.currentSelectedMonster = i;
                            this.drawActMonsterScene();
                        } else {
                            this.currentSelectedOption = i;
                            this.actMenuRow = Math.floor(i / 2);
                            this.actMenuCol = i % 2;
                            this.drawActOptionScene();
                        }
                        this.playSound('button');
                        break;
                    case gameConfig.STATES.ITEM:
                        this.currentSelectedOption = i;
                        this.drawItemScene();
                        this.playSound('button');
                        break;
                    case gameConfig.STATES.MERCY:
                        this.currentSelectedOption = i;
                        this.drawMercyScene();
                        this.playSound('button');
                        break;
                }
                return;
            }
        }
    }
};