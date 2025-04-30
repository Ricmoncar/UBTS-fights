class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.loaded = false;
        this.soundsToLoad = [
            { key: 'button', path: 'sounds/buttonMove.mp3' },
            { key: 'encounter', path: 'sounds/encounter.mp3' },
            { key: 'text', path: 'sounds/text.mp3' },
            { key: 'damage', path: 'sounds/damageTaken.mp3' },
            { key: 'heal', path: 'sounds/heal.mp3' },
            { key: 'attack', path: 'sounds/attack.mp3' }
        ];
        this.loadedCount = 0;
        
        // Initialize with dummy sounds first
        this.soundsToLoad.forEach(sound => {
            this.sounds[sound.key] = {
                play: (config) => console.log(`Dummy sound: ${sound.key}`)
            };
        });
        
        console.log('AudioManager initialized');
    }
    
    preload() {
        console.log('AudioManager preloading sounds...');
        
        // Check if sounds are already in cache - Fixed the sound.exists check
        this.soundsToLoad.forEach(sound => {
            // Fixed method: Check if sound exists in the cache
            if (this.scene.cache && this.scene.cache.audio && this.scene.cache.audio.exists && 
                this.scene.cache.audio.exists(sound.key)) {
                console.log(`Sound already in cache: ${sound.key}`);
                // Get the sound from the sound manager
                if (this.scene.sound && typeof this.scene.sound.add === 'function') {
                    this.sounds[sound.key] = this.scene.sound.add(sound.key);
                }
                this.loadedCount++;
            } else {
                // Load sound if not in cache
                console.log(`Loading sound: ${sound.key} from ${sound.path}`);
                this.scene.load.audio(sound.key, sound.path);
            }
        });
        
        // If we already have all sounds, mark as loaded
        if (this.loadedCount === this.soundsToLoad.length) {
            console.log('All sounds were already loaded');
            this.loaded = true;
        }
    }
    
    create() {
        console.log('AudioManager creating sound objects...');
        
        // If sounds were just loaded, create them
        if (!this.loaded) {
            this.soundsToLoad.forEach(sound => {
                try {
                    // Fixed method: Check if sound exists and use add method
                    if (this.scene.sound && typeof this.scene.sound.add === 'function') {
                        this.sounds[sound.key] = this.scene.sound.add(sound.key);
                        console.log(`Created sound: ${sound.key}`);
                    } else {
                        console.warn(`Sound system not available for: ${sound.key}`);
                    }
                } catch (error) {
                    console.error(`Error creating sound ${sound.key}:`, error);
                }
            });
            
            this.loaded = true;
        }
        
        // Manually check if we can create HTML5 audio elements as a backup
        if (!this.loaded) {
            console.log('Attempting HTML5 Audio fallback...');
            this.createHTML5Fallbacks();
        }
    }
    
    createHTML5Fallbacks() {
        // Create HTML5 Audio elements directly as a last resort
        this.soundsToLoad.forEach(sound => {
            try {
                const audioElement = new Audio(sound.path);
                this.sounds[sound.key] = {
                    play: (config) => {
                        audioElement.currentTime = 0;
                        audioElement.volume = config?.volume || 1;
                        audioElement.play().catch(e => console.warn(`Couldn't play ${sound.key}:`, e));
                    }
                };
                console.log(`Created HTML5 fallback for: ${sound.key}`);
            } catch (error) {
                console.error(`Error creating HTML5 fallback for ${sound.key}:`, error);
            }
        });
    }
    
    play(key, config) {
        try {
            if (this.sounds[key]) {
                this.sounds[key].play(config);
            } else {
                console.warn(`Sound not found: ${key}`);
            }
        } catch (error) {
            console.warn(`Error playing sound ${key}:`, error);
        }
    }
    
    // Convenient accessor methods
    playButton() {
        this.play('button', { volume: 0.5 });
    }
    
    playEncounter() {
        this.play('encounter', { volume: 0.7 });
    }
    
    playText() {
        this.play('text', { volume: 0.3 });
    }
    
    playDamage() {
        this.play('damage', { volume: 0.6 });
    }
    
    playHeal() {
        this.play('heal', { volume: 0.5 });
    }
    
    playAttack() {
        this.play('attack', { volume: 0.7 });
    }
}