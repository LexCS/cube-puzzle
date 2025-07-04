// Level data structure:
// 0 = empty/unpaintable
// 1 = paintable floor
// 2 = pillar (blocking)
// 3 = color changer
// 4 = pushable switch
// 5 = jump module
// 6 = hole (can drop through to lower layer)

const LEVELS = [
    // Level 1 - Linear movement tutorial
    {
        width: 4,
        height: 1,
        layers: [
            [
                [1, 1, 1, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#ff6b6b'
    },

    // Level 2 - Introducing more directions
    {
        width: 6,
        height: 2,
        layers: [
            [
                [0, 0, 1, 1, 0, 0],
                [1, 1, 1, 1, 1, 1]
            ]
        ],
        startPos: { x: 0, y: 1, layer: 0 },
        startColor: '#4ecdc4'
    },

    // Level 3 - Simple introduction (restored original Level 1)
    {
        width: 5,
        height: 5,
        layers: [
            [
                [1, 1, 1, 1, 1],
                [1, 1, 2, 1, 1],
                [1, 1, 2, 1, 1],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#ff6b6b'
    },

    // Level 4 - Color changer introduction (restored original Level 2)
    {
        width: 6,
        height: 4,
        layers: [
            [
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 3, 1, 1],
                [1, 1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#4ecdc4',
        // Define color zones for this level - only starting color and color changer color
        colorZones: [
            { x: 0, y: 0, width: 3, height: 4, color: '#4ecdc4' }, // Left side - starting color (teal)
            { x: 3, y: 0, width: 3, height: 4, color: '#ff6b6b' }  // Right side - color changer color (red)
        ]
    },

    // Level 5 - Pushable switches (fixed: removed center pillar)
    {
        width: 5,
        height: 5,
        layers: [
            [
                [1, 1, 1, 1, 1],
                [1, 4, 1, 4, 1],
                [1, 1, 1, 1, 1],
                [1, 4, 1, 4, 1],
                [1, 1, 1, 1, 1]
            ]
        ],
        startPos: { x: 2, y: 2, layer: 0 },
        startColor: '#45b7d1'
    },

    // Level 6 - Jump modules (fixed: removed pillars)
    {
        width: 7,
        height: 5,
        layers: [
            [
                [1, 1, 0, 0, 0, 1, 1],
                [1, 5, 0, 1, 0, 5, 1],
                [0, 0, 0, 1, 0, 0, 0],
                [1, 5, 0, 1, 0, 5, 1],
                [1, 1, 0, 0, 0, 1, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#f9ca24'
    },

    // Level 7 - Multiple layers with holes
    {
        width: 4,
        height: 4,
        layers: [
            [
                [1, 1, 6, 1],
                [1, 2, 1, 1],
                [6, 1, 2, 1],
                [1, 1, 1, 6]
            ],
            [
                [0, 0, 1, 0],
                [0, 0, 0, 0],
                [1, 0, 0, 0],
                [0, 0, 0, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#6c5ce7'
    },

    // Level 8 - Complex maze
    {
        width: 8,
        height: 6,
        layers: [
            [
                [1, 2, 1, 1, 1, 2, 1, 1],
                [1, 1, 2, 1, 2, 1, 1, 1],
                [2, 1, 1, 3, 1, 1, 2, 1],
                [1, 1, 2, 1, 2, 1, 1, 1],
                [1, 2, 1, 1, 1, 2, 1, 1],
                [1, 1, 1, 4, 1, 1, 1, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#fd79a8'
    },

    // Level 9 - Jump puzzle
    {
        width: 6,
        height: 6,
        layers: [
            [
                [1, 0, 1, 0, 1, 0],
                [0, 5, 0, 5, 0, 5],
                [1, 0, 1, 0, 1, 0],
                [0, 5, 0, 5, 0, 5],
                [1, 0, 1, 0, 1, 0],
                [0, 5, 0, 5, 0, 1]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#00b894'
    },

    // Level 10 - Multi-layer complex
    {
        width: 5,
        height: 5,
        layers: [
            [
                [1, 1, 6, 1, 1],
                [1, 3, 1, 4, 1],
                [6, 1, 2, 1, 6],
                [1, 4, 1, 3, 1],
                [1, 1, 6, 1, 1]
            ],
            [
                [0, 0, 1, 0, 0],
                [0, 0, 0, 0, 0],
                [1, 0, 0, 0, 1],
                [0, 0, 0, 0, 0],
                [0, 0, 1, 0, 0]
            ]
        ],
        startPos: { x: 2, y: 2, layer: 0 },
        startColor: '#e17055'
    },

    // Level 11 - Switch challenge
    {
        width: 7,
        height: 7,
        layers: [
            [
                [1, 1, 1, 4, 1, 1, 1],
                [1, 2, 1, 1, 1, 2, 1],
                [1, 1, 2, 3, 2, 1, 1],
                [4, 1, 3, 1, 3, 1, 4],
                [1, 1, 2, 3, 2, 1, 1],
                [1, 2, 1, 1, 1, 2, 1],
                [1, 1, 1, 4, 1, 1, 1]
            ]
        ],
        startPos: { x: 3, y: 3, layer: 0 },
        startColor: '#a29bfe'
    },

    // Level 12 - Final challenge
    {
        width: 8,
        height: 8,
        layers: [
            [
                [1, 2, 1, 6, 1, 2, 1, 1],
                [1, 1, 2, 1, 2, 1, 1, 1],
                [2, 1, 3, 1, 3, 1, 2, 1],
                [6, 1, 1, 4, 1, 1, 1, 6],
                [1, 2, 1, 1, 1, 2, 1, 1],
                [1, 1, 2, 5, 2, 1, 1, 1],
                [2, 1, 1, 1, 1, 1, 2, 1],
                [1, 1, 1, 6, 1, 1, 1, 1]
            ],
            [
                [0, 0, 0, 1, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 0, 0, 0, 0, 0, 1],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 1, 0, 0, 0, 0]
            ]
        ],
        startPos: { x: 0, y: 0, layer: 0 },
        startColor: '#fd79a8'
    }
];

// Utility: Check if all paintable tiles are reachable from the start position
function isLevelFullyPaintable(level, startPos) {
    const layers = level.layers;
    const width = level.width;
    const height = level.height;
    const numLayers = layers.length;
    const visited = Array.from({ length: numLayers }, () =>
        Array.from({ length: height }, () => Array(width).fill(false))
    );

    let totalPaintable = 0;
    let painted = 0;

    // Count all paintable tiles (1)
    for (let l = 0; l < numLayers; l++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (layers[l][y][x] === 1) totalPaintable++;
            }
        }
    }

    // Flood fill (DFS)
    function dfs(x, y, l) {
        if (
            x < 0 || y < 0 || l < 0 ||
            x >= width || y >= height || l >= numLayers ||
            visited[l][y][x] ||
            layers[l][y][x] !== 1
        ) return;
        visited[l][y][x] = true;
        painted++;
        // Move in 4 directions
        dfs(x + 1, y, l);
        dfs(x - 1, y, l);
        dfs(x, y + 1, l);
        dfs(x, y - 1, l);
        // If you want to support holes/jumps between layers, add logic here
    }

    dfs(startPos.x, startPos.y, startPos.layer);

    return painted === totalPaintable;
}

// Validate all levels for 100% paintability
function validateAllLevels(levels) {
    levels.forEach((level, idx) => {
        if (!isLevelFullyPaintable(level, level.startPos)) {
            console.warn(`Warning: Level ${idx + 1} is NOT fully paintable from its start position.`);
        }
    });
}

// Filter out invalid levels (not fully paintable)
function filterValidLevels(levels) {
    const validLevels = [];
    levels.forEach((level, idx) => {
        if (isLevelFullyPaintable(level, level.startPos)) {
            validLevels.push(level);
        } else {
            console.warn(`Level ${idx + 1} removed: not fully paintable.`);
        }
    });
    return validLevels;
}

// Replace LEVELS with only valid levels
const VALID_LEVELS = filterValidLevels(LEVELS);

// Run validation on load
validateAllLevels(VALID_LEVELS);
