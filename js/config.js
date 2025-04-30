const gameConfig = {
    // Constants 
    SCREEN_WIDTH: 640,
    SCREEN_HEIGHT: 480,
    COLORS: {
        BLACK: 0x000000,
        WHITE: 0xFFFFFF,
        RED: 0xFF0000,
        YELLOW: 0xFFFF00,
        LIGHT_BLUE: 0x7DF9FF,
        GREEN: 0x00FF00,
        PURPLE: 0x800080
    },
    STATES: {
        START_SCREEN: "start_screen",
        INTRO: "intro",
        PLAYER_CHOICE: "player_choice",
        FIGHT: "fight",
        ACT: "act",
        ITEM: "item",
        MERCY: "mercy",
        ENEMY_TURN: "enemy_turn",
        BATTLE_ANIMATION: "battle_animation"
    },
    // Game data
    player: {
        name: "ICARUS",
        lv: 33,
        hp: 158,
        maxhp: 158,
        x: 320,
        y: 240,
        speed: 3,
        defense: 0
    },
    monsters: [
        {name: "Maple", hp: 50, maxhp: 50, sprite: "eye.png", x: 160, y: 120},
        {name: "Chara", hp: 40, maxhp: 40, sprite: "carrot.png", x: 320, y: 120},
        {name: "Anti", hp: 30, maxhp: 30, sprite: "ant.png", x: 480, y: 120}
    ],
    items: [
        {name: "Holy Water", heal: 22, description: "Blessed water. Heals 22 HP."},
        {name: "His Blood", heal: 50, description: "The sacred fluid. Heals 50 HP."},
        {name: "His Body", heal: 100, description: "Divine essence. Fully heals HP."}
    ],
    actOptions: {
        "Maple": ["Check", "Garbage", "Cube", "Clean"],
        "Chara": ["Check", "Talk", "Flirt", "Joke"],
        "Anti": ["Check", "Taunt", "Praise", "Ignore"]
    },
    dialogues: {
        intro: "* Maple, Chara and Anti block\n  the way!",
        check: {
            "Maple": "* MAPLE - ATK 5 DEF 4\n* Just wants to have fun.",
            "Chara": "* CHARA - ATK 6 DEF 3\n* Determined to fight.",
            "Anti": "* ANTI - ATK 4 DEF 5\n* Seeks to cause chaos."
        },
        act: {
            "Maple": {
                "Garbage": "* You create a redlink and throw it\n  on the ground.\n* Maple destroys it and gives you\n  an annoyed expression.",
                "Cube": "* You solve Maple's rubix cube head.\n* He speaks in different languages\n  before the cube shifts back to\n  its unsolved state.",
                "Clean": "* You grab some redlinks from the\n  floor and destroy them.\n* Maple seems satisfied."
            },
            "Chara": {
                "Talk": "* You try to talk with Chara.\n* They don't seem interested in\n  conversation.",
                "Flirt": "* You flirt with Chara.\n* They seem disturbed by your\n  behavior.",
                "Joke": "* You tell Chara a joke.\n* They don't laugh but you notice\n  a slight smile."
            },
            "Anti": {
                "Taunt": "* You taunt Anti.\n* They seem to get more energetic\n  and chaotic.",
                "Praise": "* You praise Anti's skills.\n* They calm down a bit, enjoying\n  the recognition.",
                "Ignore": "* You ignore Anti completely.\n* They get frustrated and try to\n  get your attention."
            }
        },
        enemyAttack: {
            "Maple": "* Maple gives you a puzzled look.",
            "Chara": "* Chara smiles menacingly.",
            "Anti": "* Anti buzzes around frantically."
        }
    },
    // Fixed battle box positioning and size
    battleBox: {
        x: 320 - 150, // Centered position
        y: 240 - 60,  // Raised position
        width: 300,   // Proper width
        height: 120,  // Proper height
        animationTime: 500 // Time for animations in ms
    },
    dialogueBox: {
        x: 320,
        y: 280, // Position adjusted to be lower
        width: 620,
        height: 140,
        padding: 20
    },
    // UI configuration
    ui: {
        heartScale: 0.01,      // MUCH smaller heart size
        buttonScale: 2,      // Increased button size
        buttonSpacing: 140,    // Space between buttons
        buttonY: 435,          // Y position of buttons
        hideButtonLabels: true, // Don't show text under buttons
        disableMouse: true     // Disable mouse controls entirely
    },
    // Special effects configuration
    effects: {
        heartbeat: {
            duration: 800,
            scale: { min: 0.01, max: 0.01 } // Reduced heartbeat animation
        },
        particleColors: [0xFF0000, 0xFFFF00, 0x7DF9FF],
        textGlowColors: {
            default: 0xFFFFFF,
            highlight: 0xFFFF00,
            warning: 0xFF0000
        }
    },
    healthBar: {
        y: 420,               // Vertical position
        playerNameX: 20,      // X position of player name
        hpTextX: 160,         // X position of "HP" text
        hpBarX: 240,          // X position of HP bar (center)
        hpBarStartX: 180,     // X position of HP bar (left edge)
        hpValuesX: 310,       // X position of HP values text
        barWidth: 120,        // Width of the HP bar
        barHeight: 24         // Height of the HP bar
    },
};