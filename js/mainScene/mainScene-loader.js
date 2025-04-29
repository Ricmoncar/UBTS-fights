// MainScene module loader
// Este archivo debe cargarse después de cargar todos los archivos de módulos

// Asegúrate de que todos los métodos estén correctamente asignados a la clase MainScene
document.addEventListener('DOMContentLoaded', function() {
    console.log('MainScene modules loaded successfully');
    
    // Validación de funcionamiento correcto
    if (typeof MainScene !== 'function') {
        console.error('Error: MainScene class is not defined!');
    } else {
        // Verificar que los métodos principales estén definidos
        const requiredMethods = [
            'create', 'update', 'updateButtonsColors', 'drawActMonsterScene', 
            'startEnemyTurn', 'setDialogueText', 'renderStartScreen'
        ];
        
        let missingMethods = [];
        for (const method of requiredMethods) {
            if (typeof MainScene.prototype[method] !== 'function') {
                missingMethods.push(method);
            }
        }
        
        if (missingMethods.length > 0) {
            console.error('Error: Missing MainScene methods:', missingMethods.join(', '));
        } else {
            console.log('All MainScene methods successfully loaded');
        }
    }
});