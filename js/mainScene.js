// Escena principal del juego
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // Inicializar estado
        this.currentState = gameConfig.STATES.START_SCREEN;
        this.currentSelectedButton = 0;
        this.currentSelectedOption = 0;
        this.currentSelectedMonster = 0;
        this.selectedMonsterForAct = false;
        this.gameStarted = false;
        this.justClicked = false;
        
        // Instanciar objetos de juego
        this.player = { ...gameConfig.player };
        this.monsters = JSON.parse(JSON.stringify(gameConfig.monsters));
        
        // Configurar texto
        this.textConfig = {
            fontFamily: '"Courier New", monospace',
            fontSize: '18px',
            color: '#FFFFFF',
            align: 'left'
        };
        
        // Crear texto de diálogo principal
        this.dialogueText = this.add.text(20, 300, '', this.textConfig);
        this.dialogueCharIndex = 0;
        this.dialogueFullText = '';
        this.isTyping = false;
        this.textSpeed = 2;
        
        // Inicializar temporizador de tipeo
        this.typewriterTimer = null;
        
        // Crear texto para botones de acción
        this.buttons = [];
        const buttonLabels = ["FIGHT", "ACT", "ITEM", "MERCY"];
        for (let i = 0; i < buttonLabels.length; i++) {
            const buttonX = 80 + i * 160;
            this.buttons.push(
                this.add.text(buttonX, 440, buttonLabels[i], {
                    fontFamily: '"Courier New", monospace',
                    fontSize: '20px',
                    color: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5)
            );
        }
        
        // Crear corazón del jugador (alma)
        this.heart = this.add.rectangle(this.player.x, this.player.y, 16, 16, gameConfig.COLORS.RED);
        
        // Crear elementos de UI
        this.createUI();
        
        // Configurar entrada de teclado
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        
        // Configura clic de mouse
        this.input.on('pointerdown', (pointer) => {
            this.handleClick(pointer.x, pointer.y);
        });
        
        // Añadir sonidos
        this.buttonSound = this.sound.add('button');
        this.encounterSound = this.sound.add('encounter');
        this.textSound = this.sound.add('text');
        this.damageSound = this.sound.add('damage');
        this.healSound = this.sound.add('heal');
        
        // Iniciar con la pantalla de inicio
        this.renderStartScreen();
    }
    
    createUI() {
        // Crear UI estático
        this.dialogueBox = this.add.rectangle(this.cameras.main.width / 2, 330, 620, 100, 0x000000);
        this.dialogueBox.setStrokeStyle(2, gameConfig.COLORS.WHITE);
        
        // Texto de stats del jugador
        this.playerNameText = this.add.text(20, 400, `${this.player.name} LV ${this.player.lv}`, this.textConfig);
        this.hpText = this.add.text(150, 400, "HP", this.textConfig);
        
        // Barra de HP
        this.hpBarBg = this.add.rectangle(230, 400, 100, 20, gameConfig.COLORS.RED);
        this.hpBarFill = this.add.rectangle(180, 400, 100, 20, gameConfig.COLORS.YELLOW);
        this.hpBarFill.setOrigin(0, 0.5);
        
        // Números de HP
        this.hpValuesText = this.add.text(290, 400, `${this.player.hp}/${this.player.maxhp}`, this.textConfig);
        
        // Caja de batalla (inicialmente invisible)
        this.battleBox = this.add.rectangle(
            gameConfig.battleBox.x + gameConfig.battleBox.width / 2, 
            gameConfig.battleBox.y + gameConfig.battleBox.height / 2, 
            gameConfig.battleBox.width, 
            gameConfig.battleBox.height, 
            0x000000
        );
        this.battleBox.setStrokeStyle(2, gameConfig.COLORS.WHITE);
        this.battleBox.visible = false;
        
        // Ocultar elementos de UI inicialmente (excepto en la pantalla de inicio)
        this.hideUIElements();
    }
    
    update() {
        // Actualizar según el estado del juego
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
                // No hacer nada durante la animación, esperar a que termine
                break;
        }
        
        // Actualizar posición de la barra de HP
        this.updateHPBar();
    }
    
    updateHPBar() {
        const hpPercent = this.player.hp / this.player.maxhp;
        this.hpBarFill.width = 100 * hpPercent;
        this.hpValuesText.setText(`${this.player.hp}/${this.player.maxhp}`);
    }
    
    updateStartScreen() {
        // Verificar inicio del juego
        if (Phaser.Input.Keyboard.JustDown(this.keyZ) || this.justClicked) {
            this.justClicked = false;
            this.startGame();
        }
    }
    
    updateIntro() {
        // Manejar avance de diálogo
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            if (!this.isTyping) {
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                this.updateButtonsColors();
            } else {
                this.completeText();
            }
        }
    }
    
    updatePlayerChoice() {
        // Manejar selección de botones
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
            } else {
                this.buttons[i].setColor('#FFFFFF');
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
        // Selector de monstruo
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
        // Primera fase: seleccionar monstruo
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
                this.currentSelectedOption = 0;
                this.buttonSound.play();
                this.drawActOptionScene();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
                this.returnToMainMenu();
            }
        }
        // Segunda fase: seleccionar acción
        else {
            const monster = this.monsters[this.currentSelectedMonster];
            const actOptions = gameConfig.actOptions[monster.name];
            
            if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
                this.currentSelectedOption = Math.max(0, this.currentSelectedOption - 1);
                this.buttonSound.play();
                this.drawActOptionScene();
            }
            else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
                this.currentSelectedOption = Math.min(actOptions.length - 1, this.currentSelectedOption + 1);
                this.buttonSound.play();
                this.drawActOptionScene();
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
        // Selector de ítems
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
        // Selector de opciones de MERCY
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
        // Mover el alma/corazón durante el turno del enemigo
        if (this.cursors.left.isDown) {
            this.player.x = Math.max(gameConfig.battleBox.x + 8, this.player.x - this.player.speed);
        }
        if (this.cursors.right.isDown) {
            this.player.x = Math.min(gameConfig.battleBox.x + gameConfig.battleBox.width - 8, this.player.x + this.player.speed);
        }
        if (this.cursors.up.isDown) {
            this.player.y = Math.max(gameConfig.battleBox.y + 8, this.player.y - this.player.speed);
        }
        if (this.cursors.down.isDown) {
            this.player.y = Math.min(gameConfig.battleBox.y + gameConfig.battleBox.height - 8, this.player.y + this.player.speed);
        }
        
        // Actualizar posición del corazón
        this.heart.x = this.player.x;
        this.heart.y = this.player.y;
        
        // Temporal: Terminar turno al presionar Z
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.endEnemyTurn();
        }
    }
    
    // Métodos para iniciar acciones
    startGame() {
        this.currentState = gameConfig.STATES.INTRO;
        this.gameStarted = true;
        this.setDialogueText(gameConfig.dialogues.intro);
        this.encounterSound.play();
        
        // Limpiar pantalla inicial y mostrar elementos de batalla
        this.cleanStartScreen();
        this.showUIElements();
        this.drawBattleScene();
    }
    
    showFightScene() {
        this.cleanMenuOptions();
        this.drawFightScene();
    }
    
    showActScene() {
        this.cleanMenuOptions();
        this.drawActMonsterScene();
    }
    
    showItemScene() {
        this.cleanMenuOptions();
        this.drawItemScene();
    }
    
    showMercyScene() {
        this.cleanMenuOptions();
        this.drawMercyScene();
    }
    
    // Métodos para dibujar escenas
    cleanStartScreen() {
        // Limpiar cualquier elemento específico de la pantalla de inicio
        if (this.titleText) {
            this.titleText.destroy();
            this.startText.destroy();
            if (this.startHeart) {
                this.startHeart.destroy();
            }
        }
    }
    
    hideUIElements() {
        // Ocultar elementos de UI para pantalla de inicio
        this.dialogueBox.visible = false;
        this.dialogueText.visible = false;
        this.playerNameText.visible = false;
        this.hpText.visible = false;
        this.hpBarBg.visible = false;
        this.hpBarFill.visible = false;
        this.hpValuesText.visible = false;
        this.heart.visible = false;
        
        // Ocultar botones
        this.buttons.forEach(button => button.visible = false);
        
        if (this.monsterSprites) {
            this.monsterSprites.forEach(sprite => sprite.visible = false);
            this.monsterTexts.forEach(text => text.visible = false);
        }
    }
    
    showUIElements() {
        // Mostrar elementos de UI para batalla
        this.dialogueBox.visible = true;
        this.dialogueText.visible = true;
        this.playerNameText.visible = true;
        this.hpText.visible = true;
        this.hpBarBg.visible = true;
        this.hpBarFill.visible = true;
        this.hpValuesText.visible = true;
        
        // Mostrar botones
        this.buttons.forEach(button => button.visible = true);
    }
    
    cleanMenuOptions() {
        // Limpiar opciones previas
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
        // Dibujar monstruos
        if (!this.monsterSprites) {
            this.monsterSprites = [];
            this.monsterTexts = [];
            
            this.monsters.forEach(monster => {
                const monsterText = this.add.text(monster.x, monster.y, monster.sprite, {
                    fontFamily: 'Arial',
                    fontSize: '40px',
                    color: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5);
                
                const nameText = this.add.text(monster.x, monster.y + 40, monster.name, {
                    fontFamily: '"Courier New", monospace',
                    fontSize: '16px',
                    color: '#FFFFFF',
                    align: 'center'
                }).setOrigin(0.5);
                
                this.monsterSprites.push(monsterText);
                this.monsterTexts.push(nameText);
            });
        } else {
            // Mostrar monstruos si estaban ocultos
            this.monsterSprites.forEach(sprite => sprite.visible = true);
            this.monsterTexts.forEach(text => text.visible = true);
        }
        
        // Actualizar colores de botones
        this.updateButtonsColors();
    }
    
    drawFightScene() {
        this.cleanMenuOptions();
        
        // Dibujar nombres de monstruos seleccionables
        this.optionTexts = [];
        this.monsters.forEach((monster, index) => {
            const isSelected = index === this.currentSelectedMonster;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            const textX = 160 + index * 160;
            const textY = 320;
            
            const optionText = this.add.text(textX, textY, monster.name, {
                fontFamily: '"Courier New", monospace',
                fontSize: '20px',
                color: color,
                align: 'center'
            }).setOrigin(0.5);
            
            this.optionTexts.push(optionText);
            
            // Dibujar corazón de selección
            if (isSelected) {
                this.selectionHeart = this.add.rectangle(textX - 60, textY - 5, 10, 10, gameConfig.COLORS.RED);
            }
        });
    }
    
    drawActMonsterScene() {
        this.cleanMenuOptions();
        
        // Dibujar nombres de monstruos seleccionables
        this.optionTexts = [];
        this.monsters.forEach((monster, index) => {
            const isSelected = index === this.currentSelectedMonster;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            const textX = 160 + index * 160;
            const textY = 320;
            
            const optionText = this.add.text(textX, textY, monster.name, {
                fontFamily: '"Courier New", monospace',
                fontSize: '20px',
                color: color,
                align: 'center'
            }).setOrigin(0.5);
            
            this.optionTexts.push(optionText);
            
            // Dibujar corazón de selección
            if (isSelected) {
                this.selectionHeart = this.add.rectangle(textX - 60, textY - 5, 10, 10, gameConfig.COLORS.RED);
            }
        });
    }
    
    drawActOptionScene() {
        this.cleanMenuOptions();
        
        // Obtener opciones para el monstruo seleccionado
        const monster = this.monsters[this.currentSelectedMonster];
        const actOptions = gameConfig.actOptions[monster.name];
        
        // Dibujar opciones en 2 columnas
        this.optionTexts = [];
        const columnWidth = (this.cameras.main.width - 60) / 2;
        
        actOptions.forEach((option, index) => {
            const isSelected = index === this.currentSelectedOption;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            
            // Calcular fila y columna
            const row = Math.floor(index / 2);
            const col = index % 2;
            
            const textX = 30 + col * columnWidth;
            const textY = 320 + row * 30;
            
            const optionText = this.add.text(textX, textY, `* ${option}`, {
                fontFamily: '"Courier New", monospace',
                fontSize: '20px',
                color: color,
                align: 'left'
            });
            
            this.optionTexts.push(optionText);
            
            // Dibujar corazón de selección
            if (isSelected) {
                this.selectionHeart = this.add.rectangle(textX - 20, textY - 5, 10, 10, gameConfig.COLORS.RED);
            }
        });
    }
    
    drawItemScene() {
        this.cleanMenuOptions();
        
        // Dibujar lista de ítems
        this.optionTexts = [];
        
        gameConfig.items.forEach((item, index) => {
            const isSelected = index === this.currentSelectedOption;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            
            const textX = 30;
            const textY = 320 + index * 30;
            
            const optionText = this.add.text(textX, textY, `* ${item.name}`, {
                fontFamily: '"Courier New", monospace',
                fontSize: '20px',
                color: color,
                align: 'left'
            });
            
            this.optionTexts.push(optionText);
            
            // Dibujar corazón de selección
            if (isSelected) {
                this.selectionHeart = this.add.rectangle(textX - 20, textY - 5, 10, 10, gameConfig.COLORS.RED);
            }
        });
    }
    
    drawMercyScene() {
        this.cleanMenuOptions();
        
        // Opciones de MERCY
        const options = ["Spare", "Flee"];
        
        // Dibujar opciones
        this.optionTexts = [];
        
        options.forEach((option, index) => {
            const isSelected = index === this.currentSelectedOption;
            const color = isSelected ? '#FFFF00' : '#FFFFFF';
            
            const textX = 30;
            const textY = 320 + index * 30;
            
            const optionText = this.add.text(textX, textY, `* ${option}`, {
                fontFamily: '"Courier New", monospace',
                fontSize: '20px',
                color: color,
                align: 'left'
            });
            
            this.optionTexts.push(optionText);
            
            // Dibujar corazón de selección
            if (isSelected) {
                this.selectionHeart = this.add.rectangle(textX - 20, textY - 5, 10, 10, gameConfig.COLORS.RED);
            }
        });
    }
    
    // Métodos para acciones de selección
    selectMonsterToFight() {
        // Simulamos un ataque simple
        const monster = this.monsters[this.currentSelectedMonster];
        
        // Establecer estado de batalla para animación
        this.currentState = gameConfig.STATES.BATTLE_ANIMATION;
        this.cleanMenuOptions();
        
        // Flash del monstruo
        const monsterSprite = this.monsterSprites[this.currentSelectedMonster];
        const originalTint = monsterSprite.tint;
        
        // Crear animación de daño
        this.tweens.add({
            targets: monsterSprite,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Calcular daño
                const damage = Math.floor(Math.random() * 5) + 1;  // 1-5 puntos de daño
                monster.hp = Math.max(0, monster.hp - damage);
                
                // Reproducir sonido de daño
                this.damageSound.play();
                
                // Mostrar diálogo con el resultado
                this.setDialogueText(`* You hit ${monster.name} for ${damage} damage!`);
                this.currentState = gameConfig.STATES.INTRO;
                
                // Comprobar si el monstruo ha sido derrotado
                if (monster.hp <= 0) {
                    // Ocultar sprite del monstruo
                    monsterSprite.visible = false;
                    this.monsterTexts[this.currentSelectedMonster].visible = false;
                    
                    // Mostrar mensaje de victoria
                    this.setDialogueText(`* ${monster.name} has been defeated!\n* You earned 10 EXP and 20 GOLD.`);
                } else {
                    // Programar el turno del enemigo
                    this.time.delayedCall(2000, this.startEnemyTurn, [], this);
                }
            }
        });
    }
    
    selectActOption() {
        const monster = this.monsters[this.currentSelectedMonster];
        const monsterName = monster.name;
        const actOptions = gameConfig.actOptions[monsterName];
        const selectedAction = actOptions[this.currentSelectedOption];
        
        let responseText;
        
        // Si la acción es "Check", mostramos la información del monstruo
        if (selectedAction === "Check") {
            responseText = gameConfig.dialogues.check[monsterName];
        } 
        // Si no, mostramos la respuesta correspondiente
        else {
            const actionResponse = gameConfig.dialogues.act[monsterName]?.[selectedAction];
            responseText = actionResponse || `* You ${selectedAction.toLowerCase()} ${monsterName}.`;
        }
        
        this.setDialogueText(responseText);
        this.currentState = gameConfig.STATES.INTRO;
        this.selectedMonsterForAct = false;
        this.buttonSound.play();
        
        // Limpiar opciones
        this.cleanMenuOptions();
        
        // Programar el turno del enemigo después de mostrar diálogo
        this.time.delayedCall(3000, this.startEnemyTurn, [], this);
    }
    
    useItem() {
        const item = gameConfig.items[this.currentSelectedOption];
        
        // Usar el ítem (curar)
        const healAmount = Math.min(item.heal, this.player.maxhp - this.player.hp);
        this.player.hp += healAmount;
        
        // Efecto visual de curación
        this.time.delayedCall(300, () => {
            // Reproducir sonido de curación
            this.healSound.play();
        });
        
        // Mostrar diálogo con el resultado
        this.setDialogueText(`* You use ${item.name}.\n* You recovered ${healAmount} HP!`);
        this.currentState = gameConfig.STATES.INTRO;
        this.buttonSound.play();
        
        // Limpiar opciones
        this.cleanMenuOptions();
        
        // Programar el turno del enemigo después de mostrar diálogo
        this.time.delayedCall(3000, this.startEnemyTurn, [], this);
    }
    
    selectMercyOption() {
        const options = ["Spare", "Flee"];
        const selectedOption = options[this.currentSelectedOption];
        
        let responseText;
        if (selectedOption === "Spare") {
            responseText = "* You tried to spare the monsters.\n* But nobody was ready to accept mercy.";
        } else {
            responseText = "* You tried to flee...\n* But you couldn't escape!";
        }
        
        this.setDialogueText(responseText);
        this.currentState = gameConfig.STATES.INTRO;
        this.buttonSound.play();
        
        // Limpiar opciones
        this.cleanMenuOptions();
        
        // Programar el turno del enemigo después de mostrar diálogo
        this.time.delayedCall(3000, this.startEnemyTurn, [], this);
    }
    
    returnToMainMenu() {
        this.currentState = gameConfig.STATES.PLAYER_CHOICE;
        this.buttonSound.play();
        this.cleanMenuOptions();
        this.updateButtonsColors();
    }
    
    startEnemyTurn() {
        // Si estamos en estado de intro, esperar a terminar antes del turno enemigo
        if (this.currentState === gameConfig.STATES.INTRO) {
            // Si aún estamos mostrando texto, esperar a terminar
            if (this.isTyping) {
                this.time.delayedCall(1000, this.startEnemyTurn, [], this);
                return;
            }
            
            // Mostrar texto de ataque enemigo
            const activeMonsters = this.monsters.filter(m => m.hp > 0);
            if (activeMonsters.length > 0) {
                const attackingMonster = activeMonsters[Math.floor(Math.random() * activeMonsters.length)];
                this.setDialogueText(gameConfig.dialogues.enemyAttack[attackingMonster.name] || `* ${attackingMonster.name} is doing something.`);
                
                // Esperar a que el texto termine antes de iniciar la batalla
                this.time.delayedCall(2000, () => {
                    this.currentState = gameConfig.STATES.ENEMY_TURN;
                    this.battleBox.visible = true;
                    this.heart.visible = true;
                    
                    // Posicionar el corazón en el centro de la caja
                    this.player.x = gameConfig.battleBox.x + gameConfig.battleBox.width / 2;
                    this.player.y = gameConfig.battleBox.y + gameConfig.battleBox.height / 2;
                    this.heart.x = this.player.x;
                    this.heart.y = this.player.y;
                    
                    // Iniciar ataque del enemigo (simplificado para esta demo)
                    this.startEnemyAttack();
                }, [], this);
            } else {
                // No hay enemigos activos, volver al menú
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
            }
            return;
        }
        
        this.currentState = gameConfig.STATES.ENEMY_TURN;
        
        // Mostrar caja de batalla
        this.battleBox.visible = true;
        this.heart.visible = true;
        
        // Posicionar y mostrar el corazón en el centro
        this.player.x = gameConfig.battleBox.x + gameConfig.battleBox.width / 2;
        this.player.y = gameConfig.battleBox.y + gameConfig.battleBox.height / 2;
        this.heart.x = this.player.x;
        this.heart.y = this.player.y;
        
        // Iniciar ataque del enemigo
        this.startEnemyAttack();
    }
    
    startEnemyAttack() {
        // Crear proyectiles simples para el ataque enemigo
        this.enemyProjectiles = [];
        
        // Crear 5 proyectiles simples
        for (let i = 0; i < 5; i++) {
            const size = Phaser.Math.Between(5, 10);
            const x = Phaser.Math.Between(gameConfig.battleBox.x + size, gameConfig.battleBox.x + gameConfig.battleBox.width - size);
            const y = gameConfig.battleBox.y - size * 2;
            
            const projectile = this.add.rectangle(x, y, size, size, 0xFFFFFF);
            
            // Añadir velocidad aleatoria
            projectile.speedY = Phaser.Math.Between(1, 3);
            
            this.enemyProjectiles.push(projectile);
        }
        
        // Crear un evento de tiempo para mover los proyectiles
        this.projectileEvent = this.time.addEvent({
            delay: 20,
            callback: this.updateProjectiles,
            callbackScope: this,
            loop: true
        });
        
        // Terminar el turno después de un tiempo
        this.time.delayedCall(5000, this.endEnemyTurn, [], this);
    }
    
    updateProjectiles() {
        // Mover proyectiles
        for (let i = 0; i < this.enemyProjectiles.length; i++) {
            const projectile = this.enemyProjectiles[i];
            projectile.y += projectile.speedY;
            
            // Si el proyectil sale de la caja, reiniciar posición
            if (projectile.y > gameConfig.battleBox.y + gameConfig.battleBox.height + projectile.height) {
                projectile.y = gameConfig.battleBox.y - projectile.height;
                projectile.x = Phaser.Math.Between(
                    gameConfig.battleBox.x + projectile.width / 2, 
                    gameConfig.battleBox.x + gameConfig.battleBox.width - projectile.width / 2
                );
            }
            
            // Comprobar colisión con el jugador
            if (Phaser.Geom.Intersects.RectangleToRectangle(
                new Phaser.Geom.Rectangle(projectile.x - projectile.width/2, projectile.y - projectile.height/2, projectile.width, projectile.height),
                new Phaser.Geom.Rectangle(this.heart.x - 8, this.heart.y - 8, 16, 16)
            )) {
                // Hacer parpadear el corazón
                this.tweens.add({
                    targets: this.heart,
                    alpha: 0.2,
                    duration: 100,
                    yoyo: true,
                    repeat: 2
                });
                
                // Reproducir sonido de daño
                this.damageSound.play();
                
                // Quitar vida
                this.player.hp = Math.max(0, this.player.hp - 1);
                
                // Si el jugador se queda sin vida, game over
                if (this.player.hp <= 0) {
                    this.showGameOver();
                }
                
                // Reiniciar posición del proyectil
                projectile.y = gameConfig.battleBox.y - projectile.height;
                projectile.x = Phaser.Math.Between(
                    gameConfig.battleBox.x + projectile.width / 2, 
                    gameConfig.battleBox.x + gameConfig.battleBox.width - projectile.width / 2
                );
            }
        }
    }
    
    showGameOver() {
        // Detener los proyectiles y limpiar el evento
        if (this.projectileEvent) {
            this.projectileEvent.remove();
        }
        
        // Eliminar proyectiles
        if (this.enemyProjectiles) {
            this.enemyProjectiles.forEach(p => p.destroy());
            this.enemyProjectiles = [];
        }
        
        // Mostrar texto de Game Over
        this.setDialogueText("* You lost all your HP!\n* GAME OVER");
        
        // Detener el juego
        this.currentState = gameConfig.STATES.INTRO;
        this.battleBox.visible = false;
        this.heart.visible = false;
        
        // Permitir reiniciar con Z después de un tiempo
        this.time.delayedCall(3000, () => {
            // Añadir texto para reiniciar
            this.restartText = this.add.text(this.cameras.main.width / 2, 350, "Press Z to restart", {
                fontFamily: '"Courier New", monospace',
                fontSize: '20px',
                color: '#FFFF00',
                align: 'center'
            }).setOrigin(0.5);
            
            // Configurar evento para reiniciar
            this.input.keyboard.once('keydown-Z', () => {
                // Resetear valores del jugador
                this.player.hp = this.player.maxhp;
                
                // Resetear valores del juego
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                this.updateButtonsColors();
                
                // Eliminar texto de reinicio
                if (this.restartText) {
                    this.restartText.destroy();
                }
            });
        });
    }
    
    endEnemyTurn() {
        // Detener los proyectiles y limpiar el evento
        if (this.projectileEvent) {
            this.projectileEvent.remove();
        }
        
        // Eliminar proyectiles
        if (this.enemyProjectiles) {
            this.enemyProjectiles.forEach(p => p.destroy());
            this.enemyProjectiles = [];
        }
        
        // Ocultar caja de batalla
        this.battleBox.visible = false;
        this.heart.visible = false;
        
        // Volver al menú principal solo si no estamos en game over
        if (this.player.hp > 0) {
            this.currentState = gameConfig.STATES.PLAYER_CHOICE;
            this.updateButtonsColors();
        }
    }
    // Gestión del diálogo con efecto typewriter
    setDialogueText(text) {
        // Detener cualquier texto anterior
        if (this.typewriterTimer) {
            this.typewriterTimer.remove();
        }
        
        this.dialogueFullText = text;
        this.dialogueText.setText('');
        this.dialogueCharIndex = 0;
        this.isTyping = true;
        
        // Iniciar nuevo temporizador para el efecto typewriter
        this.typewriterTimer = this.time.addEvent({
            delay: 30,
            callback: this.typewriterEffect,
            callbackScope: this,
            loop: true
        });
    }
    
    typewriterEffect() {
        if (this.dialogueCharIndex < this.dialogueFullText.length) {
            // Añadir caracteres al texto mostrado
            const charsToAdd = Math.min(this.textSpeed, this.dialogueFullText.length - this.dialogueCharIndex);
            const newText = this.dialogueFullText.substr(0, this.dialogueCharIndex + charsToAdd);
            this.dialogueText.setText(newText);
            this.dialogueCharIndex += charsToAdd;
            
            // Reproducir sonido de texto (solo cada 3 caracteres)
            if (this.dialogueCharIndex % 3 === 0) {
                this.textSound.play({ volume: 0.5 });
            }
        } else {
            // Detener el temporizador cuando terminamos
            this.isTyping = false;
            if (this.typewriterTimer) {
                this.typewriterTimer.remove();
                this.typewriterTimer = null;
            }
        }
    }
    
    completeText() {
        if (this.isTyping) {
            // Completar inmediatamente el texto
            this.dialogueText.setText(this.dialogueFullText);
            this.dialogueCharIndex = this.dialogueFullText.length;
            this.isTyping = false;
            
            // Detener el temporizador
            if (this.typewriterTimer) {
                this.typewriterTimer.remove();
                this.typewriterTimer = null;
            }
        }
    }
    
    // Manejo de clics
    handleClick(x, y) {
        // Si estamos en la pantalla de inicio, cualquier clic inicia el juego
        if (this.currentState === gameConfig.STATES.START_SCREEN) {
            this.justClicked = true; // Establecer flag para el próximo frame
            return;
        }
        
        // Si estamos en diálogo, avanzar o completar
        if (this.currentState === gameConfig.STATES.INTRO) {
            if (this.isTyping) {
                this.completeText();
            } else {
                this.currentState = gameConfig.STATES.PLAYER_CHOICE;
                this.updateButtonsColors();
            }
            return;
        }
        
        // Si estamos en selección de botones, detectar en qué botón se hizo clic
        if (this.currentState === gameConfig.STATES.PLAYER_CHOICE) {
            for (let i = 0; i < this.buttons.length; i++) {
                const button = this.buttons[i];
                const buttonBounds = button.getBounds();
                
                if (buttonBounds.contains(x, y)) {
                    this.currentSelectedButton = i;
                    this.updateButtonsColors();
                    this.selectCurrentButton();
                    return;
                }
            }
        }
        
        // Click en opciones de FIGHT, ACT, ITEM, MERCY
        if (this.optionTexts && this.optionTexts.length > 0) {
            for (let i = 0; i < this.optionTexts.length; i++) {
                const option = this.optionTexts[i];
                const optionBounds = option.getBounds();
                
                if (optionBounds.contains(x, y)) {
                    // Actualizar opción seleccionada según el estado actual
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
    
    // Renderizar pantalla de inicio
    renderStartScreen() {
        // Dibujar título y texto de inicio
        this.titleText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 40, "UNDERTALE: Beyond The Story", {
            fontFamily: '"Courier New", monospace',
            fontSize: '30px',
            color: '#FFFFFF',
            align: 'center'
        }).setOrigin(0.5);
        
        this.startText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, "Press Z to start or click anywhere", {
            fontFamily: '"Courier New", monospace',
            fontSize: '20px',
            color: '#FFFF00',
            align: 'center'
        }).setOrigin(0.5);
        
        // Corazón pulsante
        const heartX = this.cameras.main.width / 2 - 100;
        const heartY = this.cameras.main.height / 2 + 20;
        
        this.startHeart = this.add.rectangle(heartX, heartY, 20, 20, gameConfig.COLORS.RED);
        
        // Añadir un efecto de pulsación al corazón
        this.tweens.add({
            targets: this.startHeart,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
}