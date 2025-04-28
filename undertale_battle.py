import pygame
import asyncio
import sys
import os
import random
import math

# Variable global para pantalla
screen = None

# Código principal asíncrono
async def main():
    global screen, font, button_sound, encounter_sound, text_sound
    
    # Inicializar Pygame
    pygame.init()
    pygame.mixer.init()

    # Constantes
    WIDTH, HEIGHT = 640, 480
    BLACK = (0, 0, 0)
    WHITE = (255, 255, 255)
    RED = (255, 0, 0)
    YELLOW = (255, 255, 0)

    # Crear pantalla - usar RESIZABLE para mejor compatibilidad con web
    screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.RESIZABLE)
    pygame.display.set_caption("Undertale Battle Template")

    # Cargar sonidos - ajustar rutas para Pygbag
    try:
        button_sound = pygame.mixer.Sound("sounds/buttonMove.mp3")
        encounter_sound = pygame.mixer.Sound("sounds/encounter.mp3")
        text_sound = pygame.mixer.Sound("sounds/text.mp3")
    except Exception as e:
        print(f"Error al cargar sonidos: {e}")
        print("Algunos sonidos no se pudieron cargar, pero el juego continuará")

    # Estados del juego
    START_SCREEN = "start_screen"
    INTRO = "intro"
    PLAYER_CHOICE = "player_choice"
    FIGHT = "fight"
    ACT = "act"
    ITEM = "item"
    MERCY = "mercy"
    ENEMY_TURN = "enemy_turn"

    # Configuración del juego
    class GameConfig:
        def __init__(self):
            self.current_state = START_SCREEN
            self.current_selected_button = 0  # 0: FIGHT, 1: ACT, 2: ITEM, 3: MERCY
            self.current_selected_option = 0
            self.current_selected_monster = 0
            self.game_started = False
            
            # Configuración del jugador
            self.player = {
                "name": "ICARUS",
                "lv": 2,
                "hp": 20,
                "maxhp": 20,
                "x": WIDTH // 2,
                "y": HEIGHT // 2,
                "speed": 3,
                "defense": 0
            }
            
            # Configuración de monstruos
            self.monsters = [
                {"name": "Maple", "hp": 50, "maxhp": 50, "sprite": "👁️", "x": 160, "y": 120},
                {"name": "Chara", "hp": 40, "maxhp": 40, "sprite": "🥕", "x": 320, "y": 120},
                {"name": "Anti", "hp": 30, "maxhp": 30, "sprite": "🐜", "x": 480, "y": 120}
            ]
            
            # Ítems
            self.items = [
                {"name": "Holy Water", "heal": 22},
                {"name": "His Blood", "heal": 50},
                {"name": "His Body", "heal": 100}
            ]
            
            # Diálogos
            self.dialogues = {
                "intro": "* Maple, Chara and Anti block\n  the way!",
                "check": {
                    0: "* MAPLE - ATK 5 DEF 4\n* Just wants to have fun.",
                    1: "* CHARA - ATK 6 DEF 3\n* Determined to fight.",
                    2: "* ANTI - ATK 4 DEF 5\n* Seeks to cause chaos."
                }
            }
            
            # Caja de batalla
            self.battle_box = {
                "x": WIDTH // 2 - 60,
                "y": HEIGHT // 2 - 60,
                "width": 120,
                "height": 120
            }

    # Crear configuración
    config = GameConfig()

    # Fuentes - Manejo mejorado de assets para web
    try:
        # Para Pygbag necesitamos usar rutas relativas desde la raíz del proyecto
        font = pygame.font.Font(None, 24)  # Usar fuente predeterminada temporalmente
        print("Usando fuente del sistema por defecto")
    except Exception as e:
        print(f"Error con la fuente: {e}")
        font = pygame.font.SysFont(None, 24)
        print("Usando fuente del sistema, no se encontró la fuente personalizada")

    # Texto con efecto de máquina de escribir
    class TypewriterText:
        def __init__(self):
            self.current_text = ""
            self.displayed_text = ""
            self.char_index = 0
            self.text_speed = 3  # Caracteres por frame
            self.is_typing = False
            
        def set_text(self, text):
            self.current_text = text
            self.displayed_text = ""
            self.char_index = 0
            self.is_typing = True
            
        def update(self):
            if self.is_typing and self.char_index < len(self.current_text):
                # Añadir caracteres basados en la velocidad
                chars_to_add = min(self.text_speed, len(self.current_text) - self.char_index)
                self.displayed_text += self.current_text[self.char_index:self.char_index + chars_to_add]
                self.char_index += chars_to_add
                
                # Reproducir sonido de texto (solo cada 3 caracteres para no sobrecargar)
                if self.char_index % 3 == 0:
                    try:
                        if 'text_sound' in globals():
                            text_sound.play()
                    except Exception as e:
                        print(f"Error al reproducir sonido: {e}")
                    
                # Comprobar si hemos terminado
                if self.char_index >= len(self.current_text):
                    self.is_typing = False
                    return True  # Hemos terminado
            
            return False  # Todavía escribiendo

    # Instancia del texto
    dialogue_text = TypewriterText()

    # Funciones principales
    def draw_start_screen():
        screen.fill(BLACK)
        title = font.render("UNDERTALE: Beyond The Story", True, WHITE)
        start_text = font.render("Press Z to start or click anywhere", True, YELLOW)
        
        # Debug - dibujar un texto para confirmar que la pantalla funciona
        debug_text = font.render("Pantalla de inicio cargada", True, RED)
        screen.blit(debug_text, (10, 10))
        
        screen.blit(title, (WIDTH//2 - title.get_width()//2, HEIGHT//2 - 40))
        screen.blit(start_text, (WIDTH//2 - start_text.get_width()//2, HEIGHT//2 + 20))

    def draw_battle_interface():
        screen.fill(BLACK)
        
        # Dibujar monstruos
        for i, monster in enumerate(config.monsters):
            monster_text = font.render(monster["sprite"], True, WHITE)
            screen.blit(monster_text, (monster["x"] - monster_text.get_width()//2, monster["y"]))
        
        # Dibujar caja de texto
        pygame.draw.rect(screen, WHITE, (10, 280, WIDTH-20, 100), 2)
        
        # Dibujar texto
        text_lines = dialogue_text.displayed_text.split('\n')
        for i, line in enumerate(text_lines):
            line_text = font.render(line, True, WHITE)
            screen.blit(line_text, (20, 290 + i*25))
        
        # Dibujar información del jugador
        player_info = font.render(f"{config.player['name']} LV {config.player['lv']}", True, WHITE)
        screen.blit(player_info, (20, 400))
        
        # Dibujar HP
        hp_text = font.render("HP", True, WHITE)
        screen.blit(hp_text, (150, 400))
        
        # Barra de HP
        pygame.draw.rect(screen, RED, (180, 400, 100, 20))
        hp_percent = config.player["hp"] / config.player["maxhp"]
        pygame.draw.rect(screen, YELLOW, (180, 400, 100 * hp_percent, 20))
        
        hp_numbers = font.render(f"{config.player['hp']}/{config.player['maxhp']}", True, WHITE)
        screen.blit(hp_numbers, (290, 400))
        
        # Dibujar botones
        buttons = ["FIGHT", "ACT", "ITEM", "MERCY"]
        for i, button in enumerate(buttons):
            color = YELLOW if i == config.current_selected_button else WHITE
            button_text = font.render(button, True, color)
            screen.blit(button_text, (50 + i*150, 440))

    def draw_battle_box():
        box = config.battle_box
        pygame.draw.rect(screen, WHITE, (box["x"], box["y"], box["width"], box["height"]), 2)
        
        # Dibujar alma del jugador (corazón)
        pygame.draw.rect(screen, RED, (config.player["x"]-8, config.player["y"]-8, 16, 16))

    def handle_start_screen(event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_z or event.key == pygame.K_RETURN:
                config.current_state = INTRO
                config.game_started = True
                dialogue_text.set_text(config.dialogues["intro"])
                try:
                    encounter_sound.play()
                except Exception as e:
                    print(f"Error al reproducir sonido de encuentro: {e}")

    def handle_player_choice(event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_LEFT:
                config.current_selected_button = max(0, config.current_selected_button - 1)
                try:
                    button_sound.play()
                except Exception as e:
                    print(f"Error al reproducir sonido de botón: {e}")
            elif event.key == pygame.K_RIGHT:
                config.current_selected_button = min(3, config.current_selected_button + 1)
                try:
                    button_sound.play()
                except Exception as e:
                    print(f"Error al reproducir sonido de botón: {e}")
            elif event.key == pygame.K_z or event.key == pygame.K_RETURN:
                if config.current_selected_button == 0:  # FIGHT
                    config.current_state = FIGHT
                elif config.current_selected_button == 1:  # ACT
                    config.current_state = ACT
                elif config.current_selected_button == 2:  # ITEM
                    config.current_state = ITEM
                elif config.current_selected_button == 3:  # MERCY
                    config.current_state = MERCY

    def handle_intro(event):
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_z or event.key == pygame.K_RETURN:
                if not dialogue_text.is_typing:
                    config.current_state = PLAYER_CHOICE
                else:
                    # Completar el texto inmediatamente
                    dialogue_text.displayed_text = dialogue_text.current_text
                    dialogue_text.char_index = len(dialogue_text.current_text)
                    dialogue_text.is_typing = False

    # Adaptación para manejo de clic web
    def handle_click(pos):
        x, y = pos
        # Si estamos en la pantalla de inicio, cualquier clic inicia el juego
        if config.current_state == START_SCREEN:
            config.current_state = INTRO
            config.game_started = True
            dialogue_text.set_text(config.dialogues["intro"])
            try:
                encounter_sound.play()
            except Exception as e:
                print(f"Error al reproducir sonido de encuentro: {e}")
        # Si estamos en la selección de botones, detectar en qué botón se hizo clic
        elif config.current_state == PLAYER_CHOICE:
            # Áreas de botones (simplificado)
            button_areas = [
                pygame.Rect(50, 440, 100, 30),     # FIGHT
                pygame.Rect(200, 440, 100, 30),    # ACT
                pygame.Rect(350, 440, 100, 30),    # ITEM
                pygame.Rect(500, 440, 100, 30)     # MERCY
            ]
            
            for i, area in enumerate(button_areas):
                if area.collidepoint(x, y):
                    config.current_selected_button = i
                    # Simular presionar el botón Z
                    if i == 0:
                        config.current_state = FIGHT
                    elif i == 1:
                        config.current_state = ACT
                    elif i == 2:
                        config.current_state = ITEM
                    elif i == 3:
                        config.current_state = MERCY
                    break

    # Bucle principal del juego (asíncrono para web)
    clock = pygame.time.Clock()
    running = True
    
    # Mensaje de depuración inicial
    print("Iniciando bucle principal del juego")

    while running:
        # Manejar eventos
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
                print("Evento de salida detectado")
            elif event.type == pygame.MOUSEBUTTONDOWN:
                # Soporte para clics del ratón (útil en web)
                if event.button == 1:  # Clic izquierdo
                    handle_click(event.pos)
                    print(f"Clic detectado en: {event.pos}")
            elif event.type == pygame.KEYDOWN:
                # Manejar inputs según el estado del juego
                print(f"Tecla presionada: {event.key}")
                if config.current_state == START_SCREEN:
                    handle_start_screen(event)
                elif config.current_state == INTRO:
                    handle_intro(event)
                elif config.current_state == PLAYER_CHOICE:
                    handle_player_choice(event)
        
        # Actualizar
        if config.current_state == INTRO:
            dialogue_text.update()
        
        # Dibujar
        if config.current_state == START_SCREEN:
            draw_start_screen()
        else:
            draw_battle_interface()
            
            if config.current_state == ENEMY_TURN:
                draw_battle_box()
        
        # Actualizar pantalla
        pygame.display.flip()
        clock.tick(60)  # 60 FPS
        
        # Esta línea es esencial para Pygbag - permite que el navegador responda
        await asyncio.sleep(0)

    pygame.quit()
    print("Juego finalizado")

# Esta es la manera correcta de iniciar con Pygbag
asyncio.run(main())