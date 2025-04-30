// Enemy turn methods
MainScene.prototype.updateEnemyTurn = function() {
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
    
    // End turn with Z (will be automatic in final version)
    if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
        this.endEnemyTurn();
    }
};

MainScene.prototype.startEnemyTurn = function() {
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
                
                // Reset battle box scale
                this.battleBox.scaleX = 1;
                this.battleBox.scaleY = 1;
                
                // Position heart in center of battle box
                this.player.x = gameConfig.battleBox.x + gameConfig.battleBox.width / 2;
                this.player.y = gameConfig.battleBox.y + gameConfig.battleBox.height / 2;
                this.heart.x = this.player.x;
                this.heart.y = this.player.y;
                
                // Start enemy attack (simplified for demo)
                this.startEnemyAttack();
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
};

MainScene.prototype.startEnemyAttack = function() {
    // Create simple projectiles for enemy attack
    this.enemyProjectiles = [];
    
    // Create fewer projectiles for a cleaner battle
    for (let i = 0; i < 6; i++) {
        const size = Phaser.Math.Between(6, 10); // Smaller projectiles
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
        projectile.speedY = Phaser.Math.Between(1, 3);
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
};

MainScene.prototype.updateProjectiles = function() {
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
        
        // Check collision with player - use a TINY collision box for the heart
        if (Phaser.Geom.Intersects.RectangleToRectangle(
            new Phaser.Geom.Rectangle(
                projectile.x - projectile.width/2, 
                projectile.y - projectile.height/2, 
                projectile.width, 
                projectile.height),
            new Phaser.Geom.Rectangle(
                this.heart.x - 2, // Tiny collision box (was 4)
                this.heart.y - 2, 
                4,  // Tiny collision box (was 8)
                4)
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
            this.playSound('damage');
            
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
};

MainScene.prototype.createDamageEffect = function(x, y) {
    // Create particles for damage effect - made even smaller for tiny heart
    const particles = this.add.particles('heart');
    
    const emitter = particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 20, max: 40 }, // Reduced speed further
        angle: { min: 0, max: 360 },
        scale: { start: 0.05, end: 0.02 }, // Tiny particles for tiny heart
        blendMode: 'ADD',
        lifespan: 500,
        tint: 0xFF0000
    });
    
    // Emit a small burst of particles - even fewer
    emitter.explode(4); 
    
    // Destroy particles after they're done
    this.time.delayedCall(600, () => {
        particles.destroy();
    });
};

MainScene.prototype.endEnemyTurn = function() {
    // Stop projectiles and clear event
    if (this.projectileEvent) {
        this.projectileEvent.remove();
    }
    
    // Remove projectiles
    if (this.enemyProjectiles) {
        this.enemyProjectiles.forEach(p => p.destroy());
        this.enemyProjectiles = [];
    }
    
    // Fade out battle box
    this.tweens.add({
        targets: this.battleBox,
        alpha: 0,
        duration: 400,
        onComplete: () => {
            // Hide battle box
            this.battleBox.visible = false;
            this.battleBox.alpha = 1; // Reset alpha
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
};

MainScene.prototype.showGameOver = function() {
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
        x: gameOverText.x + 5, // Reduced shake amount
        duration: 50,
        yoyo: true,
        repeat: 10,
        ease: 'Sine.easeInOut'
    });
    
    // Play soul breaking animation
    this.tweens.add({
        targets: this.heart,
        scaleX: gameConfig.ui.heartScale * 1.3,
        scaleY: gameConfig.ui.heartScale * 1.3,
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
            
            // Set up restart event - Only use Z key
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
                this.heart.setScale(gameConfig.ui.heartScale);
                
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
};

MainScene.prototype.createHeartBreakEffect = function(x, y) {
    // Create the heart break effect - made smaller for tiny heart
    const pieces = 4; // Even fewer pieces for tiny heart
    const angleStep = 360 / pieces;
    
    for (let i = 0; i < pieces; i++) {
        const angle = i * angleStep;
        const distance = 20; // Shorter distance for tiny heart
        
        // Create a small heart piece
        const piece = this.add.rectangle(
            x, 
            y, 
            2, // Tiny pieces (was 4)
            2, 
            gameConfig.COLORS.RED
        );
        
        // Animate the piece flying away
        this.tweens.add({
            targets: piece,
            x: x + Math.cos(angle * Math.PI / 180) * distance,
            y: y + Math.sin(angle * Math.PI / 180) * distance,
            alpha: 0,
            duration: 600,
            onComplete: () => {
                piece.destroy();
            }
        });
    }
};