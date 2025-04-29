// Render start screen with improved aesthetics
MainScene.prototype.renderStartScreen = function() {
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
    
    // Add glow effect to title
    const titleGlow = this.add.graphics();
    titleGlow.fillStyle(0xFFFFFF, 0.2);
    titleGlow.fillRect(0, 0, this.cameras.main.width, 100);
    titleGlow.y = this.cameras.main.height / 2 - 80;
    titleGlow.alpha = 0;
    
    // Animate title glow
    this.tweens.add({
        targets: titleGlow,
        alpha: 0.3,
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
    
    // Add animation to the start text (bobbing and color pulsing)
    this.startAnimation = this.tweens.add({
        targets: this.startText,
        y: '+=5',
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
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
};