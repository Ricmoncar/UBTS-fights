// Render start screen with improved aesthetics
MainScene.prototype.renderStartScreen = function() {
    // Make sure all game buttons are hidden
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
    
    // Hide UI elements
    this.hideUIElements();
    
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
    
    // Add subtle glow effect to title
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0xFFFFFF, 0.1); // More subtle glow
    titleGlow.fillRect(0, 0, this.cameras.main.width, 80);
    titleGlow.y = this.cameras.main.height / 2 - 80;
    titleGlow.alpha = 0;
    
    // Animate title glow
    this.tweens.add({
        targets: titleGlow,
        alpha: 0.2, // Reduced glow intensity
        duration: 1500,
        delay: 500,
        yoyo: true,
        repeat: -1
    });
    
    // Animate title entry
    this.tweens.add({
        targets: this.titleText,
        y: this.cameras.main.height / 2 - 60,
        duration: 1500,
        ease: 'Bounce.easeOut'
    });
    
    // Create and animate start text
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
    
    // Add animation to the start text (subtle bobbing and color pulsing)
    this.startAnimation = this.tweens.add({
        targets: this.startText,
        y: '+=3', // Reduced bobbing
        alpha: 0.8,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
    
    // Pulsing heart for start screen
    const heartX = this.cameras.main.width / 2 - 110;
    const heartY = this.cameras.main.height / 2 + 30;
    
    this.startHeart = this.add.sprite(heartX, heartY, 'heart');
    this.startHeart.setScale(0.8); // Smaller heart on title screen
    this.startHeart.alpha = 0;
    
    // Animate heart appearance
    this.tweens.add({
        targets: this.startHeart,
        alpha: 1,
        duration: 1000,
        delay: 1000
    });
    
    // Add gentle pulsing animation to heart
    this.tweens.add({
        targets: this.startHeart,
        scaleX: 0.9, // 10% pulse
        scaleY: 0.9,
        duration: 800,
        yoyo: true,
        repeat: -1,
        delay: 1000
    });
};