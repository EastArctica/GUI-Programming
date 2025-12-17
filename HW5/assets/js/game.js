/*
    Copyright (c) 2025 Jack Manning
    Author: Jack Manning
    All rights reserved.
*/

class DataLoader {
    static cachedPieces = null;
    static async loadPieces() {
        if (this.cachedPieces) return this.cachedPieces;
        this.cachedPieces = await this.fetchPieces();
        return this.cachedPieces;
    }
    
    static async fetchPieces() {
        const res = await fetch('./assets/data/pieces.json');
        if (!res.ok) throw new Error('pieces.json not found');
        return await res.json();
    }

    static cachedDictionary = null;
    static async loadDictionary() {
        if (this.cachedDictionary) return this.cachedDictionary;
        this.cachedDictionary = await this.fetchDictionary();
        return this.cachedDictionary;
    }

    static async fetchDictionary() {
        const res = await fetch('./assets/data/dictionary.txt');
        if (!res.ok) throw new Error('dictionary.txt not found');
        const text = await res.text();
        return new Set(text.split('\n').map(word => word.trim().toUpperCase()));
    }
}

class Bag {
    constructor(piecesData) {
        this.letters = [];
        for (const p of piecesData.pieces) {
            for (let i = 0; i < p.amount; i++) {
                this.letters.push({ letter: p.letter, value: p.value });
            }
        }
        this.shuffle();
    }

    shuffle() {
        for (let i = this.letters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.letters[i], this.letters[j]] = [this.letters[j], this.letters[i]];
        }
    }

    draw(n) {
        return this.letters.splice(-n, n);
    }

    tilesLeft() {
        return this.letters.length;
    }
}

// TODO: For now this will just be a single line board
class Board {
    // Currently supports DW, DL, and TL
    DEFAULT_BOARD = [
        ['TL', '', 'DW', '', '', '', 'DL', '', 'DL', '', '', '', 'DW', '', 'TL'],
    ]
    constructor() {
        this.grid = this.DEFAULT_BOARD.map(row => row.slice().map(cell => ({ type: cell, tile: null })));
    }

    placeTile(x, y, tile) {
        this.grid[y][x].tile = tile;
    }

    getTile(x, y) {
        return this.grid[y][x].tile;
    }

    calculateScore() {
        let score = 0;
        let wordMultiplier = 1;
        // TODO: Currently 1 dimensional
        for (let x = 0; x < this.grid[0].length; x++) {
            const cell = this.grid[0][x];
            if (cell.tile) {
                let tileScore = cell.tile.value;
                if (cell.type === 'DL') tileScore *= 2;
                else if (cell.type === 'TL') tileScore *= 3;
                else if (cell.type === 'DW') wordMultiplier *= 2;
                score += tileScore;
            }
        }
        return score;
    }
}

class Game {
    constructor() {
        this.score = 0;
        this.round = 0;
        this.bag = new Bag({ pieces: [] });
        this.board = new Board();
        this.rack = [];
        this.dictionary = new Set();

        // Play word
        document.getElementById('btnPlay').addEventListener('click', () => this.playWord());
        // New hand
        document.getElementById('btnNew').addEventListener('click', () => {
            this.refillRack();
            this.updateUI();
        });
        // Reset game
        document.getElementById('btnReset').addEventListener('click', () => this.resetGame());
    }

    async startNewGame() {
        const piecesData = await DataLoader.loadPieces();
        this.dictionary = await DataLoader.loadDictionary();
        this.score = 0;
        this.round = 0;
        this.bag = new Bag(piecesData);
        this.board = new Board();
        this.refillRack();

        // Initialize UI components
        this.updateUI();
    }

    updateUI() {
        // Update state
        this.round = this.board.calculateScore();

        // Update UI
        const tilesLeftElem = document.getElementById('tilesLeft');
        const roundScoreElem = document.getElementById('roundScore');
        const totalScoreElem = document.getElementById('totalScore');

        if (tilesLeftElem) tilesLeftElem.textContent = this.bag.tilesLeft();
        if (roundScoreElem) {
            roundScoreElem.textContent = this.round;
            
            // Update word validity styling
            const currentWord = this.getWordFromBoard();
            roundScoreElem.className = ''; // Clear existing classes
            
            if (currentWord.length === 0) {
                roundScoreElem.classList.add('no-word');
            } else if (currentWord.length < 2) {
                roundScoreElem.classList.add('invalid-word');
            } else if (this.dictionary.has(currentWord)) {
                roundScoreElem.classList.add('valid-word');
            } else {
                roundScoreElem.classList.add('invalid-word');
            }
        }
        if (totalScoreElem) totalScoreElem.textContent = this.score;

        // Update board UI
        this.renderBoard();

        // Update hand rack UI
        this.renderRack();
    }

    renderRack() {
        const rackElem = document.getElementById('rack');
        if (!rackElem) return;

        rackElem.innerHTML = '';
        this.rack.forEach((tile, index) => {
            const tileElem = document.createElement('img');
            tileElem.className = 'tile';
            
            // Handle blank tiles
            if (tile.letter === 'Blank') {
                tileElem.src = `./assets/images/tiles/Scrabble_Tile_Blank.jpg`;
                tileElem.classList.add('blank-tile');
            } else {
                // Handle tiles that were blank but now have a chosen letter
                const displayLetter = tile.chosenLetter || tile.letter;
                tileElem.src = `./assets/images/tiles/Scrabble_Tile_${displayLetter}.jpg`;
            }
            
            tileElem.dataset.tileIndex = index;
            tileElem.dataset.letter = tile.letter;
            tileElem.dataset.value = tile.value;
            if (tile.chosenLetter) {
                tileElem.dataset.chosenLetter = tile.chosenLetter;
            }
            
            // Make tiles draggable
            $(tileElem).draggable({
                revert: 'invalid',
                helper: 'clone',
                start: function() {
                    $(this).css('opacity', '0.5');
                },
                stop: function() {
                    $(this).css('opacity', '1');
                }
            });

            rackElem.appendChild(tileElem);
        });
        
        // Make rack droppable to accept tiles back from board
        $(rackElem).droppable({
            accept: '.tile',
            drop: (event, ui) => {
                const letter = ui.draggable[0].dataset.letter;
                const value = parseInt(ui.draggable[0].dataset.value);
                
                const tile = { letter, value };
                // Don't preserve chosenLetter when returning blank tiles to rack
                // This resets blank tiles to their undeclared state
                
                // Check if tile is from board (can't move rack tiles back to rack)
                if (ui.draggable[0].dataset.boardX !== undefined) {
                    const oldX = parseInt(ui.draggable[0].dataset.boardX);
                    const oldY = parseInt(ui.draggable[0].dataset.boardY);
                    
                    // Remove tile from board
                    this.board.grid[oldY][oldX].tile = null;
                    
                    // Add tile back to rack
                    this.rack.push(tile);
                    
                    // Update UI
                    this.updateUI();
                }
            }
        });
    }

    renderBoard() {
        const boardElem = document.getElementById('board');
        if (!boardElem) return;

        boardElem.innerHTML = '';
        
        // Render each square in the single row
        for (let x = 0; x < this.board.grid[0].length; x++) {
            const cell = this.board.grid[0][x];
            const squareElem = document.createElement('div');
            squareElem.className = `square ${cell.type}`;
            squareElem.dataset.x = x;
            squareElem.dataset.y = 0;

            // Add type label for special squares
            if (cell.type) {
                const tagElem = document.createElement('span');
                tagElem.className = 'tag';
                tagElem.textContent = cell.type;
                squareElem.appendChild(tagElem);
            }

            // Add tile if present
            if (cell.tile) {
                const tileElem = document.createElement('img');
                tileElem.className = 'tile';
                
                // Handle blank tiles with chosen letters
                if (cell.tile.letter === 'Blank' && cell.tile.chosenLetter) {
                    tileElem.src = `./assets/images/tiles/Scrabble_Tile_${cell.tile.chosenLetter}.jpg`;
                    tileElem.classList.add('blank-tile');
                } else if (cell.tile.letter === 'Blank') {
                    tileElem.src = `./assets/images/tiles/Scrabble_Tile_Blank.jpg`;
                    tileElem.classList.add('blank-tile');
                } else {
                    tileElem.src = `./assets/images/tiles/Scrabble_Tile_${cell.tile.letter}.jpg`;
                }
                
                tileElem.dataset.letter = cell.tile.letter;
                tileElem.dataset.value = cell.tile.value;
                tileElem.dataset.boardX = x;
                tileElem.dataset.boardY = 0;
                if (cell.tile.chosenLetter) {
                    tileElem.dataset.chosenLetter = cell.tile.chosenLetter;
                }
                
                // Make board tiles draggable
                $(tileElem).draggable({
                    revert: 'invalid',
                    helper: 'clone',
                    start: function() {
                        $(this).css('opacity', '0.5');
                    },
                    stop: function() {
                        $(this).css('opacity', '1');
                    }
                });
                
                squareElem.appendChild(tileElem);
            }

            // Make squares droppable
            $(squareElem).droppable({
                accept: () => {
                    const xPos = parseInt(squareElem.dataset.x);
                    const yPos = parseInt(squareElem.dataset.y);

                    // Reject if square already occupied
                    if (this.board.getTile(xPos, yPos)) return false;

                    // First tile can go anywhere; subsequent tiles must touch an existing one
                    if (!this.hasAnyTileOnBoard()) return true;
                    return this.hasAdjacentTile(xPos, yPos);
                },
                drop: async (event, ui) => {
                    const x = parseInt(squareElem.dataset.x);
                    const y = parseInt(squareElem.dataset.y);
                    const letter = ui.draggable[0].dataset.letter;
                    const value = parseInt(ui.draggable[0].dataset.value);
                    const chosenLetter = ui.draggable[0].dataset.chosenLetter;

                    // Only allow drop if square is empty
                    if (!this.board.getTile(x, y)) {
                        let tile = { letter, value };
                        
                        // Handle blank tiles
                        if (letter === 'Blank' && !chosenLetter) {
                            const selectedLetter = await this.selectBlankLetter();
                            if (!selectedLetter) {
                                return; // User cancelled
                            }
                            tile.chosenLetter = selectedLetter;
                        } else if (chosenLetter) {
                            tile.chosenLetter = chosenLetter;
                        }
                        
                        // Check if tile is from rack or board
                        if (ui.draggable[0].dataset.tileIndex !== undefined) {
                            // Tile from rack
                            const tileIndex = parseInt(ui.draggable[0].dataset.tileIndex);
                            this.rack.splice(tileIndex, 1);
                        } else if (ui.draggable[0].dataset.boardX !== undefined) {
                            // Tile from board
                            const oldX = parseInt(ui.draggable[0].dataset.boardX);
                            const oldY = parseInt(ui.draggable[0].dataset.boardY);
                            this.board.grid[oldY][oldX].tile = null;
                        }
                        
                        // Place tile on board
                        this.board.placeTile(x, y, tile);
                        
                        // Update UI
                        this.updateUI();
                    }
                }
            });

            boardElem.appendChild(squareElem);
        }
    }

    playWord() {
        const word = this.getWordFromBoard();
        
        if (word.length === 0) {
            alert('No word found on the board!');
            return;
        }
        
        if (word.length < 2) {
            alert('Words must be at least 2 letters long!');
            return;
        }
        
        if (!this.dictionary.has(word)) {
            alert(`"${word}" is not a valid word!`);
            return;
        }
        
        // Valid word played
        const roundScore = this.board.calculateScore();
        this.score += roundScore;
        
        // Apply word length bonus (7-letter word gets 50 point bonus)
        if (word.length === 7) {
            this.score += 50;
            alert(`"${word}" is a 7-letter word! +50 bonus points!`);
        }
        
        this.refillRack();
        this.board = new Board();
        this.updateUI();
    }
    
    getWordFromBoard() {
        let word = '';
        // Since we have a single row board, iterate through all positions
        for (let x = 0; x < this.board.grid[0].length; x++) {
            const tile = this.board.getTile(x, 0);
            if (tile) {
                // Use chosen letter for blank tiles, otherwise use the tile letter
                const letterToUse = (tile.letter === 'Blank' && tile.chosenLetter) ? tile.chosenLetter : tile.letter;
                word += letterToUse;
            } else if (word.length > 0) {
                // If we encounter an empty space after starting a word, stop
                break;
            }
        }
        return word;
    }
    
    isCurrentWordValid() {
        const word = this.getWordFromBoard();
        return word.length >= 2 && this.dictionary.has(word);
    }

    hasAnyTileOnBoard() {
        for (const row of this.board.grid) {
            for (const cell of row) {
                if (cell.tile) return true;
            }
        }
        return false;
    }
    
    hasAdjacentTile(x, y) {
        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
        ];
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            if (ny < 0 || ny >= this.board.grid.length) continue;
            if (nx < 0 || nx >= this.board.grid[0].length) continue;
            if (this.board.grid[ny][nx].tile) return true;
        }
        return false;
    }
    
    async selectBlankLetter() {
        return new Promise((resolve) => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const modal = document.createElement('div');
            modal.className = 'blank-modal';
            
            const dialog = document.createElement('div');
            dialog.className = 'blank-dialog';
            
            const title = document.createElement('h3');
            title.textContent = 'Choose a letter for your blank tile:';
            dialog.appendChild(title);
            
            const letterGrid = document.createElement('div');
            letterGrid.className = 'letter-grid';
            
            for (const letter of letters) {
                const tileImg = document.createElement('img');
                tileImg.src = `./assets/images/tiles/Scrabble_Tile_${letter}.jpg`;
                tileImg.className = 'letter-tile';
                tileImg.alt = letter;
                tileImg.addEventListener('click', () => {
                    document.body.removeChild(modal);
                    resolve(letter);
                });
                letterGrid.appendChild(tileImg);
            }
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'Cancel';
            cancelBtn.className = 'cancel-btn';
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(null);
            });
            
            dialog.appendChild(letterGrid);
            dialog.appendChild(cancelBtn);
            modal.appendChild(dialog);
            document.body.appendChild(modal);
        });
    }

    refillRack() {
        const needed = Math.max(0, 7 - this.rack.length);
        if (needed > 0) {
            const drawn = this.bag.draw(needed);
            this.rack.push(...drawn);
        }
    }

    resetGame() {
        this.startNewGame();
    }
}

$(document).ready(function() {
    const game = new Game();
    game.startNewGame().catch(e => alert(e.message));
});
