const gameConfig = {
    // Constantes 
    SCREEN_WIDTH: 640,
    SCREEN_HEIGHT: 480,
    COLORS: {
        BLACK: 0x000000,
        WHITE: 0xFFFFFF,
        RED: 0xFF0000,
        YELLOW: 0xFFFF00,
        LIGHT_BLUE: 0x7DF9FF
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
    // Datos del juego
    player: {
        name: "ICARUS",
        lv: 2,
        hp: 20,
        maxhp: 20,
        x: 320,
        y: 240,
        speed: 3,
        defense: 0
    },
    monsters: [
        {name: "Maple", hp: 50, maxhp: 50, sprite: "👁️", x: 160, y: 120},
        {name: "Chara", hp: 40, maxhp: 40, sprite: "🥕", x: 320, y: 120},
        {name: "Anti", hp: 30, maxhp: 30, sprite: "🐜", x: 480, y: 120}
    ],
    items: [
        {name: "Holy Water", heal: 22},
        {name: "His Blood", heal: 50},
        {name: "His Body", heal: 100}
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
    battleBox: {
        x: 320 - 120, // Increased size
        y: 240 - 120, // Increased size
        width: 240,   // Doubled width
        height: 240,  // Doubled height
        animationTime: 500 // Time for animations in ms
    },
    dialogueBox: {
        x: 320,
        y: 360,
        width: 620,
        height: 140,  // Increased height
        padding: 20
    }
};