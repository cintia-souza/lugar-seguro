"use client";

import { useState, useCallback, useEffect } from "react";

// --- Types ---
export type Cell = 0 | 1;
export type Board = Cell[][];

export interface PieceShape {
  id: string;
  shape: Cell[][];
  color: string;
}

export type GameEvent = "idle" | "placed" | "cleared" | "gameover";

export interface BlockPuzzleState {
  board: Board;
  pieces: (PieceShape | null)[];
  score: number;
  highScore: number;
  gameOver: boolean;
  lastEvent: GameEvent;
  placePiece: (pieceIndex: number, row: number, col: number) => boolean;
  canPlace: (piece: PieceShape, row: number, col: number) => boolean;
  restart: () => void;
}

// --- Constants ---
const BOARD_SIZE = 8;
const SCORE_PER_BLOCK = 10;
const SCORE_PER_LINE = 100;
const HIGH_SCORE_KEY = "meu-lugarzinho-puzzle-highscore";

// --- Piece Templates ---
const PIECE_TEMPLATES: Cell[][][] = [
  // Single
  [[1]],
  // Line 2
  [[1, 1]],
  // Line 3
  [[1, 1, 1]],
  // Line 4
  [[1, 1, 1, 1]],
  // Vertical 2
  [[1], [1]],
  // Vertical 3
  [[1], [1], [1]],
  // Square 2x2
  [[1, 1], [1, 1]],
  // L shape
  [[1, 0], [1, 0], [1, 1]],
  // Reverse L
  [[0, 1], [0, 1], [1, 1]],
  // T shape
  [[1, 1, 1], [0, 1, 0]],
  // S shape
  [[0, 1, 1], [1, 1, 0]],
  // Z shape
  [[1, 1, 0], [0, 1, 1]],
  // Corner
  [[1, 1], [1, 0]],
];

const COLORS = [
  "bg-blue-300", "bg-violet-300", "bg-emerald-300", "bg-amber-300",
  "bg-rose-300", "bg-sky-300", "bg-indigo-300", "bg-teal-300",
];

// --- Helpers ---
function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0) as Cell[]);
}

function generatePiece(): PieceShape {
  const template = PIECE_TEMPLATES[Math.floor(Math.random() * PIECE_TEMPLATES.length)] as Cell[][];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)] as string;
  return { id: crypto.randomUUID(), shape: template, color };
}

function generatePieces(): PieceShape[] {
  return [generatePiece(), generatePiece(), generatePiece()];
}

function canPlaceOnBoard(board: Board, piece: PieceShape, row: number, col: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    const pieceRow = piece.shape[r];
    if (!pieceRow) continue;
    for (let c = 0; c < pieceRow.length; c++) {
      if (pieceRow[c] === 1) {
        const br = row + r;
        const bc = col + c;
        if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE) return false;
        if (board[br]?.[bc] === 1) return false;
      }
    }
  }
  return true;
}

function hasAnyValidMove(board: Board, pieces: (PieceShape | null)[]): boolean {
  for (const piece of pieces) {
    if (!piece) continue;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlaceOnBoard(board, piece, r, c)) return true;
      }
    }
  }
  return false;
}

function clearLines(board: Board): { newBoard: Board; linesCleared: number } {
  let linesCleared = 0;
  const rowsToClear: number[] = [];
  const colsToClear: number[] = [];

  // Check full rows
  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r]?.every((cell) => cell === 1)) {
      rowsToClear.push(r);
    }
  }

  // Check full columns
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every((row) => row[c] === 1)) {
      colsToClear.push(c);
    }
  }

  linesCleared = rowsToClear.length + colsToClear.length;

  if (linesCleared === 0) return { newBoard: board, linesCleared: 0 };

  const newBoard = board.map((row) => [...row]) as Board;

  for (const r of rowsToClear) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      (newBoard[r] as Cell[])[c] = 0;
    }
  }

  for (const c of colsToClear) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      (newBoard[r] as Cell[])[c] = 0;
    }
  }

  return { newBoard, linesCleared };
}

// --- Hook ---
export function useBlockPuzzle(): BlockPuzzleState {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [pieces, setPieces] = useState<(PieceShape | null)[]>(generatePieces);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "0", 10);
    setHighScore(stored);
  }, []);
  const [gameOver, setGameOver] = useState(false);
  const [lastEvent, setLastEvent] = useState<GameEvent>("idle");

  const canPlace = useCallback((piece: PieceShape, row: number, col: number): boolean => {
    return canPlaceOnBoard(board, piece, row, col);
  }, [board]);

  const placePiece = useCallback((pieceIndex: number, row: number, col: number): boolean => {
    const piece = pieces[pieceIndex];
    if (!piece || gameOver) return false;
    if (!canPlaceOnBoard(board, piece, row, col)) return false;

    // Place piece on board
    const newBoard = board.map((r) => [...r]) as Board;
    let blocksPlaced = 0;

    for (let r = 0; r < piece.shape.length; r++) {
      const pieceRow = piece.shape[r];
      if (!pieceRow) continue;
      for (let c = 0; c < pieceRow.length; c++) {
        if (pieceRow[c] === 1) {
          (newBoard[row + r] as Cell[])[col + c] = 1;
          blocksPlaced++;
        }
      }
    }

    // Clear lines
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

    // Update score
    const pointsEarned = blocksPlaced * SCORE_PER_BLOCK + linesCleared * SCORE_PER_LINE;
    const newScore = score + pointsEarned;

    // Update high score
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem(HIGH_SCORE_KEY, String(newScore));
    }

    // Remove used piece
    const newPieces = [...pieces];
    newPieces[pieceIndex] = null;

    // Check if all pieces used — generate new set
    const remainingPieces = newPieces.filter((p) => p !== null);
    if (remainingPieces.length === 0) {
      const freshPieces = generatePieces();
      // Check game over with new pieces
      if (!hasAnyValidMove(clearedBoard, freshPieces)) {
        setBoard(clearedBoard);
        setPieces(freshPieces);
        setScore(newScore);
        setGameOver(true);
        setLastEvent("gameover");
        return true;
      }
      setPieces(freshPieces);
    } else {
      // Check game over with remaining pieces
      if (!hasAnyValidMove(clearedBoard, newPieces)) {
        setBoard(clearedBoard);
        setPieces(newPieces);
        setScore(newScore);
        setGameOver(true);
        setLastEvent("gameover");
        return true;
      }
      setPieces(newPieces);
    }

    setBoard(clearedBoard);
    setScore(newScore);
    setLastEvent(linesCleared > 0 ? "cleared" : "placed");

    return true;
  }, [board, pieces, score, highScore, gameOver]);

  const restart = useCallback(() => {
    setBoard(createEmptyBoard());
    setPieces(generatePieces());
    setScore(0);
    setGameOver(false);
    setLastEvent("idle");
  }, []);

  return { board, pieces, score, highScore, gameOver, lastEvent, placePiece, canPlace, restart };
}
