class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.popup = document.getElementById('popup');
        this.levelResult = document.getElementById('level-result');
        this.replayButton = document.getElementById('replay-button');
        this.nextLevelButton = document.getElementById('next-level-button');
        this.levelDisplay = document.getElementById('level-display');
        
        this.tileSize = 35;
        this.currentLevel = 0;
        this.cube = {
            x: 0,
            y: 0,
            layer: 0,
            color: '#ff6b6b',
            animating: false,
            rollDirection: null,
            rollProgress: 0,
            rollStartTime: 0
        };
        
        this.paintedTiles = new Map();
        this.gameState = 'playing'; // 'playing', 'won', 'lost'
        this.animationDuration = 300; // milliseconds
        
        // Touch control variables
        this.touchStartPos = null;
        this.touchPath = [];
        this.isDragging = false;
        this.dragStartTile = null;
        this.fingerPos = null;
        this.showCubeHighlight = false;
        
        // Available colors for tiles
        this.availableColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894', '#e17055', '#a29bfe'];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadLevel(this.currentLevel);
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            // Shortcuts for result screen
            if (this.gameState === 'won' || this.gameState === 'lost') {
                if (e.key === 'Enter') {
                    // Next level - only if won and there's a next level
                    if (this.gameState === 'won' && this.currentLevel < LEVELS.length - 1) {
                        this.hidePopup();
                        this.currentLevel++;
                        this.loadLevel(this.currentLevel);
                    } else if (this.gameState === 'won' && this.currentLevel >= LEVELS.length - 1) {
                        // Game completed - show completion message
                        this.showPopup('Congratulations! You completed all levels!', false);
                    }
                    // If lost, Enter does nothing (no next level button)
                    e.preventDefault();
                    return;
                } else if (e.key === ' ' || e.key === 'Spacebar') {
                    // Replay - works for both won and lost
                    this.hidePopup();
                    this.loadLevel(this.currentLevel);
                    e.preventDefault();
                    return;
                }
            }
            // Normal movement only if playing
            if (this.cube.animating || this.gameState !== 'playing') return;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.moveCube(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.moveCube(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.moveCube(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.moveCube(1, 0);
                    break;
            }
        });
        
        this.replayButton.addEventListener('click', () => {
            this.hidePopup();
            this.loadLevel(this.currentLevel);
        });
        
        this.nextLevelButton.addEventListener('click', () => {
            this.hidePopup();
            if (this.currentLevel < LEVELS.length - 1) {
                this.currentLevel++;
                this.loadLevel(this.currentLevel);
            } else {
                // Game completed
                this.showPopup('Congratulations! You completed all levels!', false);
            }
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log('Touch start detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            console.log('Touch position:', x, y);
            
            this.touchStartPos = { x, y };
            this.touchPath = [{ x, y }];
            this.isDragging = false;
            this.fingerPos = { x, y };
            
            // Check if touch started on the cube
            const cubePixelX = this.cube.x * this.tileSize + 20 + this.tileSize / 4;
            const cubePixelY = this.cube.y * this.tileSize + 20 + this.tileSize / 4;
            const cubeSize = this.tileSize / 2;
            
            if (x >= cubePixelX && x <= cubePixelX + cubeSize && 
                y >= cubePixelY && y <= cubePixelY + cubeSize) {
                console.log('Touch started on cube - entering drag mode');
                this.isDragging = true;
                this.dragStartTile = { x: this.cube.x, y: this.cube.y };
                this.showCubeHighlight = true;
            }
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            this.fingerPos = { x, y };
            
            if (this.isDragging) {
                // Add to path with movement threshold
                const lastPoint = this.touchPath[this.touchPath.length - 1];
                const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
                
                if (distance > 10) { // Movement threshold
                    console.log('Adding to touch path:', x, y);
                    this.touchPath.push({ x, y });
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            console.log('Touch end detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            if (this.isDragging && this.touchPath.length > 1) {
                console.log('Executing touch path movement');
                // Execute path movement
                this.executeTouchPath();
            } else if (this.touchStartPos) {
                console.log('Executing touch swipe movement');
                // Simple swipe movement
                this.executeSwipe();
            }
            
            // Reset touch state
            this.touchStartPos = null;
            this.touchPath = [];
            this.isDragging = false;
            this.dragStartTile = null;
            this.fingerPos = null;
            this.showCubeHighlight = false;
        });
        
        // Mouse controls for desktop (including drag)
        this.canvas.addEventListener('mousedown', (e) => {
            console.log('Mouse down detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            console.log('Mouse position:', x, y);
            
            this.touchStartPos = { x, y };
            this.touchPath = [{ x, y }];
            this.isDragging = false;
            this.fingerPos = { x, y };
            
            // Check if mouse started on the cube
            const cubePixelX = this.cube.x * this.tileSize + 20 + this.tileSize / 4;
            const cubePixelY = this.cube.y * this.tileSize + 20 + this.tileSize / 4;
            const cubeSize = this.tileSize / 2;
            
            if (x >= cubePixelX && x <= cubePixelX + cubeSize && 
                y >= cubePixelY && y <= cubePixelY + cubeSize) {
                console.log('Mouse started on cube - entering drag mode');
                this.isDragging = true;
                this.dragStartTile = { x: this.cube.x, y: this.cube.y };
                this.showCubeHighlight = true;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.fingerPos = { x, y };
            
            if (this.isDragging) {
                // Add to path with movement threshold
                const lastPoint = this.touchPath[this.touchPath.length - 1];
                const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
                
                if (distance > 10) { // Movement threshold
                    console.log('Adding to mouse path:', x, y);
                    this.touchPath.push({ x, y });
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            console.log('Mouse up detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            if (this.isDragging && this.touchPath.length > 1) {
                console.log('Executing mouse path movement');
                // Execute path movement
                this.executeTouchPath();
            } else if (this.touchStartPos) {
                console.log('Executing mouse click movement');
                // Simple click movement
                this.executeSwipe();
            }
            
            // Reset touch state
            this.touchStartPos = null;
            this.touchPath = [];
            this.isDragging = false;
            this.dragStartTile = null;
            this.fingerPos = null;
            this.showCubeHighlight = false;
        });
        
        // Simple touch fallback - just detect taps and convert to keyboard input
        this.canvas.addEventListener('click', (e) => {
            console.log('Click detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert click to movement based on position relative to cube
            const cubeCenterX = this.cube.x * this.tileSize + 20 + this.tileSize / 2;
            const cubeCenterY = this.cube.y * this.tileSize + 20 + this.tileSize / 2;
            
            const deltaX = x - cubeCenterX;
            const deltaY = y - cubeCenterY;
            
            console.log('Click delta:', deltaX, deltaY);
            
            // Determine direction based on click position
            let dx = 0, dy = 0;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                dx = deltaX > 0 ? 1 : -1;
            } else {
                dy = deltaY > 0 ? 1 : -1;
            }
            
            if (dx !== 0 || dy !== 0) {
                console.log('Moving cube:', dx, dy);
                this.moveCube(dx, dy);
            }
        });
        
        // Prevent all default touch behaviors on the canvas
        this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
        this.canvas.addEventListener('touchcancel', (e) => e.preventDefault(), { passive: false });
        
        // Add a simple tap detection system that should work on all devices
        let lastTapTime = 0;
        let lastTapPos = null;
        
        this.canvas.addEventListener('touchend', (e) => {
            const now = Date.now();
            const touch = e.changedTouches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            
            // Show visual feedback that touch was detected
            this.showTouchFeedback(x, y);
            
            // Simple tap detection
            if (now - lastTapTime < 300 && lastTapPos) {
                const deltaX = x - lastTapPos.x;
                const deltaY = y - lastTapPos.y;
                
                if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                    // This is a tap, move cube in a direction
                    console.log('Tap detected, moving cube');
                    this.moveCube(1, 0); // Move right as default
                }
            }
            
            lastTapTime = now;
            lastTapPos = { x, y };
        }, { passive: false });
        
        // Document-level swipe detection for Control Scheme A
        document.addEventListener('touchstart', (e) => {
            console.log('Document touch start detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };
            this.fingerPos = { x: touch.clientX, y: touch.clientY };
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            const touch = e.touches[0];
            this.fingerPos = { x: touch.clientX, y: touch.clientY };
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            console.log('Document touch end detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            // Only execute swipe if we're not in drag mode (drag mode is handled by canvas events)
            if (!this.isDragging && this.touchStartPos) {
                // Check if this was actually a swipe (not just a tap)
                const deltaX = this.fingerPos.x - this.touchStartPos.x;
                const deltaY = this.fingerPos.y - this.touchStartPos.y;
                const minSwipeDistance = 30;
                
                if (Math.abs(deltaX) >= minSwipeDistance || Math.abs(deltaY) >= minSwipeDistance) {
                    console.log('Executing document swipe movement');
                    this.executeSwipe();
                }
            }
            
            // Reset touch state
            this.touchStartPos = null;
            this.fingerPos = null;
        }, { passive: false });
        
        // Document-level mouse swipe detection for desktop
        document.addEventListener('mousedown', (e) => {
            console.log('Document mouse down detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            this.touchStartPos = { x: e.clientX, y: e.clientY };
            this.fingerPos = { x: e.clientX, y: e.clientY };
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            this.fingerPos = { x: e.clientX, y: e.clientY };
        });
        
        document.addEventListener('mouseup', (e) => {
            console.log('Document mouse up detected');
            if (this.gameState !== 'playing' || this.cube.animating) return;
            
            // Only execute swipe if we're not in drag mode
            if (!this.isDragging && this.touchStartPos) {
                // Check if this was actually a swipe (not just a click)
                const deltaX = this.fingerPos.x - this.touchStartPos.x;
                const deltaY = this.fingerPos.y - this.touchStartPos.y;
                const minSwipeDistance = 30;
                
                if (Math.abs(deltaX) >= minSwipeDistance || Math.abs(deltaY) >= minSwipeDistance) {
                    console.log('Executing document mouse swipe movement');
                    this.executeSwipe();
                }
            }
            
            // Reset touch state
            this.touchStartPos = null;
            this.fingerPos = null;
        });
    }
    
    loadLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        this.level = level;
        this.cube.x = level.startPos.x;
        this.cube.y = level.startPos.y;
        this.cube.layer = level.startPos.layer;
        this.cube.color = level.startColor;
        this.cube.animating = false;
        this.cube.rollDirection = null;
        this.cube.rollProgress = 0;
        
        this.paintedTiles = new Map();
        this.gameState = 'playing';
        
        // Update level display
        this.levelDisplay.textContent = `Level ${this.currentLevel + 1}`;
        
        // Paint starting tile
        const startKey = `${this.cube.x},${this.cube.y},${this.cube.layer}`;
        this.paintedTiles.set(startKey, this.cube.color);
        
        // Setup canvas size
        this.canvas.width = level.width * this.tileSize + 40;
        this.canvas.height = level.height * this.tileSize + 40;
        
        this.render();
    }
    
    getTileAt(x, y, layer = null) {
        if (layer === null) layer = this.cube.layer;
        if (x < 0 || x >= this.level.width || y < 0 || y >= this.level.height) return 0;
        if (layer < 0 || layer >= this.level.layers.length) return 0;
        return this.level.layers[layer][y][x];
    }
    
    canMoveTo(x, y, layer = null) {
        if (layer === null) layer = this.cube.layer;
        
        const tile = this.getTileAt(x, y, layer);
        if (tile === 0 || tile === 2) return false; // empty or pillar
        
        const key = `${x},${y},${layer}`;
        if (this.paintedTiles.has(key)) return false;
        
        // Only check color restriction for paintable floor tiles
        if (tile === 1) {
            const targetColor = this.getTileTargetColor(x, y, layer);
            if (this.cube.color !== targetColor) return false;
        }
        
        return true;
    }
    
    moveCube(dx, dy) {
        const newX = this.cube.x + dx;
        const newY = this.cube.y + dy;
        
        if (!this.canMoveTo(newX, newY)) return;
        
        // Instantly update position and handle tile interaction
        this.cube.x = newX;
        this.cube.y = newY;
        this.cube.animating = false;
        this.cube.rollDirection = null;
        this.cube.rollProgress = 0;
        this.cube.rollStartTime = 0;
        
        this.handleTileInteraction();
        this.checkGameState();
    }
    
    handleTileInteraction() {
        const tile = this.getTileAt(this.cube.x, this.cube.y);
        const key = `${this.cube.x},${this.cube.y},${this.cube.layer}`;
        
        switch(tile) {
            case 1: // Paintable floor
                const targetColor = this.getTileTargetColor(this.cube.x, this.cube.y, this.cube.layer);
                this.paintedTiles.set(key, targetColor);
                break;
            case 3: // Color changer
                // Only change color if the tile is not already painted
                if (!this.paintedTiles.has(key)) {
                    const targetColor = this.getTileTargetColor(this.cube.x, this.cube.y, this.cube.layer);
                    if (targetColor) {
                        this.cube.color = targetColor;
                    } else {
                        this.cube.color = this.getRandomColor();
                    }
                }
                this.paintedTiles.set(key, this.getTileTargetColor(this.cube.x, this.cube.y, this.cube.layer));
                break;
            case 4: // Pushable switch
                // Change color when switch is activated
                const switchTargetColor = this.getTileTargetColor(this.cube.x, this.cube.y, this.cube.layer);
                if (switchTargetColor) {
                    this.cube.color = switchTargetColor;
                }
                this.paintedTiles.set(key, switchTargetColor);
                // Switch activation logic would go here
                break;
            case 5: // Jump module
                this.handleJumpModule();
                break;
            case 6: // Hole
                this.handleHole();
                break;
        }
    }
    
    handleJumpModule() {
        // Simple jump logic - find another jump module or random valid tile
        const jumpTargets = [];
        for (let layer = 0; layer < this.level.layers.length; layer++) {
            for (let y = 0; y < this.level.height; y++) {
                for (let x = 0; x < this.level.width; x++) {
                    if (this.getTileAt(x, y, layer) === 5 && (x !== this.cube.x || y !== this.cube.y || layer !== this.cube.layer)) {
                        jumpTargets.push({ x, y, layer });
                    }
                }
            }
        }
        
        if (jumpTargets.length > 0) {
            const target = jumpTargets[Math.floor(Math.random() * jumpTargets.length)];
            this.cube.x = target.x;
            this.cube.y = target.y;
            this.cube.layer = target.layer;
        }
    }
    
    handleHole() {
        if (this.cube.layer < this.level.layers.length - 1) {
            this.cube.layer++;
            // Check if there's a valid tile below
            if (!this.canMoveTo(this.cube.x, this.cube.y, this.cube.layer)) {
                this.cube.layer--; // Revert if can't drop
            }
        }
    }
    
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894', '#e17055', '#a29bfe'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getTileTargetColor(x, y, layer) {
        // Get the target color for a specific tile based on level design
        const level = this.level;
        
        // Check if level has defined color zones
        if (level.colorZones) {
            for (const zone of level.colorZones) {
                if (x >= zone.x && x < zone.x + zone.width && 
                    y >= zone.y && y < zone.y + zone.height) {
                    return zone.color;
                }
            }
        }
        
        // If no color zones defined, check if there are any switches in the level
        const hasSwitches = this.levelHasSwitches();
        if (hasSwitches) {
            // Use deterministic color based on position, but only from available colors
            const availableColors = this.getAvailableColorsForLevel();
            const index = (x + y * level.width + layer * level.width * level.height) % availableColors.length;
            return availableColors[index];
        } else {
            // No switches - all tiles should be the starting color
            return level.startColor;
        }
    }
    
    levelHasSwitches() {
        // Check if the current level has any color changers or switches
        for (let layer = 0; layer < this.level.layers.length; layer++) {
            for (let y = 0; y < this.level.height; y++) {
                for (let x = 0; x < this.level.width; x++) {
                    const tile = this.getTileAt(x, y, layer);
                    if (tile === 3 || tile === 4) { // Color changer or switch
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    getAvailableColorsForLevel() {
        // Get the colors available for this level: starting color + switch colors
        const colors = [this.level.startColor];
        
        // Find all switch colors in the level
        for (let layer = 0; layer < this.level.layers.length; layer++) {
            for (let y = 0; y < this.level.height; y++) {
                for (let x = 0; x < this.level.width; x++) {
                    const tile = this.getTileAt(x, y, layer);
                    if (tile === 3 || tile === 4) { // Color changer or switch
                        // Use a deterministic color for this switch position
                        const switchColor = this.getSwitchColor(x, y, layer);
                        if (!colors.includes(switchColor)) {
                            colors.push(switchColor);
                        }
                    }
                }
            }
        }
        
        return colors;
    }
    
    getSwitchColor(x, y, layer) {
        // Get a deterministic color for a switch at this position
        const level = this.level;
        const switchColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#fd79a8', '#00b894', '#e17055', '#a29bfe'];
        const index = (x + y * level.width + layer * level.width * level.height) % switchColors.length;
        return switchColors[index];
    }
    
    checkGameState() {
        // Check if all paintable tiles are painted
        let totalPaintable = 0;
        let painted = 0;
        
        for (let layer = 0; layer < this.level.layers.length; layer++) {
            for (let y = 0; y < this.level.height; y++) {
                for (let x = 0; x < this.level.width; x++) {
                    const tile = this.getTileAt(x, y, layer);
                    if (tile === 1 || tile === 3 || tile === 4) {
                        totalPaintable++;
                        const key = `${x},${y},${layer}`;
                        if (this.paintedTiles.has(key)) {
                            painted++;
                        }
                    }
                }
            }
        }
        
        // Check if all tiles are painted (win condition)
        if (painted === totalPaintable) {
            this.gameState = 'won';
            this.showPopup(`Level ${this.currentLevel + 1} Complete!<br>Painted: 100%`, true);
            return;
        }
        
        // Check if no valid moves are available (lose condition)
        const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        let hasValidMove = false;
        
        for (const [dx, dy] of directions) {
            const newX = this.cube.x + dx;
            const newY = this.cube.y + dy;
            if (this.canMoveTo(newX, newY)) {
                hasValidMove = true;
                break;
            }
        }
        
        if (!hasValidMove) {
            this.gameState = 'lost';
            const percentage = Math.round((painted / totalPaintable) * 100);
            this.showPopup(`Game Over!<br>Painted: ${percentage}%`, false);
        }
    }
    
    showPopup(message, isWin) {
        this.levelResult.innerHTML = message;
        this.nextLevelButton.style.display = isWin && this.currentLevel < LEVELS.length - 1 ? 'inline-block' : 'none';
        this.popup.classList.remove('hidden');
    }
    
    hidePopup() {
        this.popup.classList.add('hidden');
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid and tiles
        for (let layer = 0; layer < this.level.layers.length; layer++) {
            const alpha = layer === this.cube.layer ? 1.0 : 0.3;
            this.ctx.globalAlpha = alpha;
            
            for (let y = 0; y < this.level.height; y++) {
                for (let x = 0; x < this.level.width; x++) {
                    const tile = this.getTileAt(x, y, layer);
                    const key = `${x},${y},${layer}`;
                    const isPainted = this.paintedTiles.has(key);
                    
                    this.drawTile(x, y, tile, isPainted, layer);
                }
            }
        }
        
        this.ctx.globalAlpha = 1.0;
        
        // Draw cube
        this.drawCube();
        
        // Draw touch feedback elements
        this.drawTouchFeedback();
    }
    
    drawTouchFeedback() {
        // Draw cube highlight when dragging
        if (this.showCubeHighlight) {
            const pixelX = this.cube.x * this.tileSize + 20;
            const pixelY = this.cube.y * this.tileSize + 20;
            
            this.ctx.strokeStyle = '#00ff00';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.strokeRect(pixelX - 2, pixelY - 2, this.tileSize + 4, this.tileSize + 4);
            this.ctx.setLineDash([]);
        }
        
        // Draw finger position indicator
        if (this.fingerPos) {
            console.log('Drawing finger position at:', this.fingerPos);
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(this.fingerPos.x, this.fingerPos.y, 15, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ff6600';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        } else {
            console.log('No finger position to draw');
        }
        
        // Draw the path being created
        if (this.touchPath.length > 1) {
            // Convert touch path to tiles for visual feedback
            const pathTiles = this.convertTouchPathToTiles(this.touchPath);
            
            // Draw path tiles with highlights
            for (let i = 1; i < pathTiles.length; i++) {
                const tile = pathTiles[i];
                const pixelX = tile.x * this.tileSize + 20;
                const pixelY = tile.y * this.tileSize + 20;
                
                // Highlight the tile
                this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
                
                // Draw path line from previous tile to current tile
                if (i > 0) {
                    const prevTile = pathTiles[i - 1];
                    const prevPixelX = prevTile.x * this.tileSize + 20 + this.tileSize / 2;
                    const prevPixelY = prevTile.y * this.tileSize + 20 + this.tileSize / 2;
                    const currentPixelX = pixelX + this.tileSize / 2;
                    const currentPixelY = pixelY + this.tileSize / 2;
                    
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                    this.ctx.lineWidth = 4;
                    this.ctx.setLineDash([]);
                    this.ctx.beginPath();
                    this.ctx.moveTo(prevPixelX, prevPixelY);
                    this.ctx.lineTo(currentPixelX, currentPixelY);
                    this.ctx.stroke();
                }
            }
        }
    }
    
    drawTile(x, y, tile, isPainted, layer) {
        const pixelX = x * this.tileSize + 20;
        const pixelY = y * this.tileSize + 20;
        
        // Get the paint color for this tile
        const key = `${x},${y},${layer}`;
        const paintColor = this.paintedTiles.get(key);
        
        // Draw base tile
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        
        switch(tile) {
            case 0: // Empty
                this.ctx.fillStyle = '#f5f5f5';
                break;
            case 1: // Paintable floor
                this.ctx.fillStyle = isPainted ? paintColor : '#fff';
                break;
            case 2: // Pillar
                this.ctx.fillStyle = '#666';
                break;
            case 3: // Color changer
                this.ctx.fillStyle = isPainted ? paintColor : '#ffd700';
                break;
            case 4: // Pushable switch
                this.ctx.fillStyle = isPainted ? paintColor : '#ff8c00';
                break;
            case 5: // Jump module
                this.ctx.fillStyle = '#00ff00';
                break;
            case 6: // Hole
                this.ctx.fillStyle = '#333';
                break;
        }
        
        this.ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        this.ctx.strokeRect(pixelX, pixelY, this.tileSize, this.tileSize);
        
        // Draw 2-pixel inner line with target color only for paintable floor tiles
        if (tile === 1) {
            const targetColor = this.getTileTargetColor(x, y, layer);
            this.ctx.strokeStyle = targetColor;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pixelX + 2, pixelY + 2, this.tileSize - 4, this.tileSize - 4);
        }
        
        // Draw tile type indicators
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        
        const centerX = pixelX + this.tileSize / 2;
        const centerY = pixelY + this.tileSize / 2 + 4;
        
        switch(tile) {
            case 2:
                this.ctx.fillText('■', centerX, centerY);
                break;
            case 3:
                this.ctx.fillText('��', centerX, centerY);
                break;
            case 4:
                // Draw switch with changing icon and background color
                const targetColor = this.getTileTargetColor(x, y, layer);
                this.ctx.fillStyle = targetColor;
                this.ctx.fillText('🔄', centerX, centerY);
                break;
            case 5:
                this.ctx.fillText('↗', centerX, centerY);
                break;
            case 6:
                this.ctx.fillText('○', centerX, centerY);
                break;
        }
    }
    
    drawCube() {
        let cubeX = this.cube.x;
        let cubeY = this.cube.y;
        
        // Apply rolling animation (only position, no rotation)
        if (this.cube.animating && this.cube.rollDirection) {
            const elapsed = Date.now() - this.cube.rollStartTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);
            this.cube.rollProgress = progress;
            
            // Smooth easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            const startX = cubeX - this.cube.rollDirection.dx;
            const startY = cubeY - this.cube.rollDirection.dy;
            
            cubeX = startX + this.cube.rollDirection.dx * easeProgress;
            cubeY = startY + this.cube.rollDirection.dy * easeProgress;
        }
        
        const pixelX = cubeX * this.tileSize + 20 + this.tileSize / 4;
        const pixelY = cubeY * this.tileSize + 20 + this.tileSize / 4;
        const cubeSize = this.tileSize / 2;
        
        // Draw cube with 3D effect
        this.ctx.fillStyle = this.cube.color;
        this.ctx.fillRect(pixelX, pixelY, cubeSize, cubeSize);
        
        // Add 3D shading
        this.ctx.fillStyle = this.lightenColor(this.cube.color, 20);
        this.ctx.fillRect(pixelX, pixelY, cubeSize, cubeSize / 4);
        
        this.ctx.fillStyle = this.darkenColor(this.cube.color, 20);
        this.ctx.fillRect(pixelX, pixelY + cubeSize * 3/4, cubeSize, cubeSize / 4);
        
        // Border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(pixelX, pixelY, cubeSize, cubeSize);
        
        // Show target color indicator if on color changer
        const currentTile = this.getTileAt(this.cube.x, this.cube.y, this.cube.layer);
        if (currentTile === 3) {
            const targetColor = this.getTileTargetColor(this.cube.x, this.cube.y, this.cube.layer);
            if (targetColor !== this.cube.color) {
                // Draw a small indicator showing the target color
                this.ctx.fillStyle = targetColor;
                this.ctx.fillRect(pixelX + cubeSize - 8, pixelY + cubeSize - 8, 8, 8);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pixelX + cubeSize - 8, pixelY + cubeSize - 8, 8, 8);
            }
        } else if (currentTile === 4) {
            // Show target color indicator for switches too
            const targetColor = this.getTileTargetColor(this.cube.x, this.cube.y, this.cube.layer);
            if (targetColor !== this.cube.color) {
                // Draw a small indicator showing the target color
                this.ctx.fillStyle = targetColor;
                this.ctx.fillRect(pixelX + cubeSize - 8, pixelY + cubeSize - 8, 8, 8);
                this.ctx.strokeStyle = '#fff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(pixelX + cubeSize - 8, pixelY + cubeSize - 8, 8, 8);
            }
        }
    }
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    executeSwipe() {
        if (!this.touchStartPos || !this.fingerPos) return;
        
        const deltaX = this.fingerPos.x - this.touchStartPos.x;
        const deltaY = this.fingerPos.y - this.touchStartPos.y;
        const minSwipeDistance = 30; // Minimum distance for a swipe
        
        console.log('Swipe delta:', deltaX, deltaY);
        
        if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) return;
        
        // Determine swipe direction
        let dx = 0, dy = 0;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            dx = deltaX > 0 ? 1 : -1;
        } else {
            dy = deltaY > 0 ? 1 : -1;
        }
        
        console.log('Moving cube:', dx, dy);
        this.moveCube(dx, dy);
    }
    
    executeTouchPath() {
        if (this.touchPath.length < 2) return;
        
        console.log('Processing touch path with', this.touchPath.length, 'points');
        
        // Convert touch path to grid tiles with snapping
        const pathTiles = this.convertTouchPathToTiles(this.touchPath);
        
        if (pathTiles.length === 0) {
            console.log('No valid path tiles found');
            return;
        }
        
        console.log('Valid path tiles:', pathTiles);
        
        // Execute the movement
        this.executePathMovement(pathTiles);
    }
    
    convertTouchPathToTiles(touchPath) {
        const tiles = [];
        const visited = new Set();
        
        // Start with the cube's current position
        const startTile = { x: this.cube.x, y: this.cube.y };
        tiles.push(startTile);
        visited.add(`${startTile.x},${startTile.y}`);
        
        // Process each touch point
        for (let i = 1; i < touchPath.length; i++) {
            const point = touchPath[i];
            const tile = this.pixelToTile(point.x, point.y);
            
            if (!tile) continue;
            
            // Check if this is a valid cardinal direction move
            const lastTile = tiles[tiles.length - 1];
            const dx = tile.x - lastTile.x;
            const dy = tile.y - lastTile.y;
            
            // Only allow cardinal directions (no diagonals)
            if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
                // Check if we can move to this tile
                if (this.canMoveTo(tile.x, tile.y)) {
                    // Check if we're revisiting a tile (path reset)
                    const tileKey = `${tile.x},${tile.y}`;
                    if (visited.has(tileKey)) {
                        // Reset path to this point
                        const resetIndex = tiles.findIndex(t => t.x === tile.x && t.y === tile.y);
                        if (resetIndex !== -1) {
                            tiles.splice(resetIndex + 1);
                            // Remove visited tiles after reset point
                            const keysToRemove = [];
                            for (const key of visited) {
                                const [x, y] = key.split(',').map(Number);
                                const index = tiles.findIndex(t => t.x === x && t.y === y);
                                if (index > resetIndex) {
                                    keysToRemove.push(key);
                                }
                            }
                            keysToRemove.forEach(key => visited.delete(key));
                        }
                    } else {
                        // Add new tile to path
                        tiles.push(tile);
                        visited.add(tileKey);
                    }
                }
            }
        }
        
        return tiles;
    }
    
    pixelToTile(pixelX, pixelY) {
        // Convert pixel coordinates to tile coordinates
        const tileX = Math.floor((pixelX - 20) / this.tileSize);
        const tileY = Math.floor((pixelY - 20) / this.tileSize);
        
        // Check bounds
        if (tileX < 0 || tileX >= this.level.width || tileY < 0 || tileY >= this.level.height) {
            return null;
        }
        
        return { x: tileX, y: tileY };
    }
    
    executePathMovement(pathTiles) {
        if (pathTiles.length === 0) return;
        
        console.log('Path tiles to move through:', pathTiles);
        
        // Move cube step by step along the path, painting each tile
        let currentIndex = 0;
        
        const moveNext = () => {
            if (currentIndex >= pathTiles.length) {
                // Path complete
                console.log('Path movement complete');
                this.checkGameState();
                return;
            }
            
            const targetTile = pathTiles[currentIndex];
            console.log(`Moving to tile ${currentIndex + 1}/${pathTiles.length}:`, targetTile);
            
            // Check if we can move to this tile
            if (this.canMoveTo(targetTile.x, targetTile.y)) {
                // Move cube to this position
                this.cube.x = targetTile.x;
                this.cube.y = targetTile.y;
                
                // Handle tile interaction (paint the tile)
                this.handleTileInteraction();
                
                currentIndex++;
                
                // Continue to next tile after a short delay for visual effect
                setTimeout(moveNext, 200);
            } else {
                // Can't move to this tile, stop here
                console.log('Cannot move to tile:', targetTile);
                this.checkGameState();
            }
        };
        
        // Start the path movement
        moveNext();
    }
    
    showTouchFeedback(x, y) {
        // Show a temporary visual indicator that touch was detected
        this.fingerPos = { x, y };
        
        // Clear the indicator after a short delay
        setTimeout(() => {
            this.fingerPos = null;
        }, 500);
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    new Game();
});