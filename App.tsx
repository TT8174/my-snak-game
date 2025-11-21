import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from './components/GameBoard';
import Leaderboard from './components/Leaderboard';
import { Coordinate, Direction, GameStatus, ScoreEntry } from './types';
import { generateGameOverMessage } from './services/geminiService';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const INITIAL_SNAKE: Coordinate[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = Direction.UP;

const App: React.FC = () => {
  const [snake, setSnake] = useState<Coordinate[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Coordinate>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<ScoreEntry[]>([]);
  const [aiMessage, setAiMessage] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Use refs for mutable state accessible inside intervals/listeners without re-binding
  const directionRef = useRef<Direction>(INITIAL_DIRECTION);
  // Use a ref to track the last processed direction to prevent 180-degree turns in a single tick
  const lastProcessedDirectionRef = useRef<Direction>(INITIAL_DIRECTION);
  
  // Use 'number' type for browser interval IDs and explicitly use window.setInterval
  const gameLoopRef = useRef<number | null>(null);

  // Initialize scores from local storage
  useEffect(() => {
    const storedScores = localStorage.getItem('snake_scores');
    if (storedScores) {
      setHighScores(JSON.parse(storedScores));
    }
  }, []);

  const generateFood = useCallback((currentSnake: Coordinate[]): Coordinate => {
    let newFood: Coordinate;
    let isOnSnake = true;
    
    // Simple safety break to prevent infinite loops if grid is full (though unlikely)
    let attempts = 0;
    const maxAttempts = GRID_SIZE * GRID_SIZE * 2;

    while (isOnSnake && attempts < maxAttempts) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // eslint-disable-next-line no-loop-func
      isOnSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!isOnSnake) return newFood;
      attempts++;
    }
    return { x: 0, y: 0 }; 
  }, []);

  const handleGameOver = useCallback(async () => {
    if (gameLoopRef.current !== null) {
      window.clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
    setGameStatus(GameStatus.GAME_OVER);
    
    // Save Score
    const newEntry: ScoreEntry = {
      score,
      date: new Date().toLocaleDateString(),
    };
    
    const updatedScores = [...highScores, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
      
    setHighScores(updatedScores);
    localStorage.setItem('snake_scores', JSON.stringify(updatedScores));

    // Fetch AI Commentary
    setIsAiLoading(true);
    const message = await generateGameOverMessage(score);
    setAiMessage(message);
    setIsAiLoading(false);
  }, [score, highScores]);

  const moveSnake = useCallback(() => {
    // Lock in the direction for this tick
    const currentMoveDir = directionRef.current;
    lastProcessedDirectionRef.current = currentMoveDir;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (currentMoveDir) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Wall Collision
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return prevSnake;
      }

      // Self Collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        handleGameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Food Collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
        // Don't pop tail -> snake grows
      } else {
        newSnake.pop(); // Remove tail
      }

      return newSnake;
    });
  }, [food, generateFood, handleGameOver]);

  // Game Loop
  useEffect(() => {
    if (gameStatus === GameStatus.PLAYING) {
      const speed = Math.max(50, INITIAL_SPEED - Math.floor(score / 50) * 5); // Increase speed slightly as score goes up
      // Use window.setInterval to return a number ID
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current !== null) {
        window.clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }
    return () => {
      if (gameLoopRef.current !== null) {
        window.clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameStatus, moveSnake, score]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== GameStatus.PLAYING) return;

      // Check against the last processed direction to prevent rapid-fire suicide turns
      const currentDir = lastProcessedDirectionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDir !== Direction.DOWN) directionRef.current = Direction.UP;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDir !== Direction.UP) directionRef.current = Direction.DOWN;
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDir !== Direction.RIGHT) directionRef.current = Direction.LEFT;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDir !== Direction.LEFT) directionRef.current = Direction.RIGHT;
          break;
        default:
          return; 
      }
      setDirection(directionRef.current);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    lastProcessedDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameStatus(GameStatus.PLAYING);
    setFood(generateFood(INITIAL_SNAKE));
    setAiMessage("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-900 text-slate-100 font-sans">
      
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
          RETRO SNAKE
        </h1>
        <p className="text-slate-400 text-sm">Use Arrow Keys or WASD to Move</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-5xl">
        
        {/* Game Area */}
        <div className="flex flex-col items-center gap-4 w-full lg:w-auto">
          
          {/* Score Board */}
          <div className="flex justify-between items-center w-full max-w-[500px] bg-slate-800 px-6 py-3 rounded-full border border-slate-700 shadow-md">
            <span className="text-slate-400 uppercase tracking-wider text-sm font-bold">Score</span>
            <span className="text-2xl font-mono font-bold text-white">{score}</span>
          </div>

          {/* Board Container */}
          <div className="relative group">
            <GameBoard 
              snake={snake} 
              food={food} 
              gridSize={GRID_SIZE} 
              isGameOver={gameStatus === GameStatus.GAME_OVER} 
            />
            
            {/* Overlay for Game Over / Start */}
            {gameStatus !== GameStatus.PLAYING && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-20 transition-all">
                {gameStatus === GameStatus.GAME_OVER ? (
                  <div className="text-center p-6 animate-in fade-in zoom-in duration-300">
                    <h2 className="text-4xl font-arcade text-red-500 mb-4">GAME OVER</h2>
                    <p className="text-xl text-white mb-6">Final Score: {score}</p>
                    
                    {/* AI Commentary Section */}
                    <div className="bg-slate-800/90 p-4 rounded-lg border border-slate-600 max-w-xs mx-auto mb-6 min-h-[80px] flex items-center justify-center">
                      {isAiLoading ? (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      ) : (
                        <p className="text-sm text-emerald-300 italic">"{aiMessage || "Better luck next time!"}"</p>
                      )}
                    </div>

                    <button 
                      onClick={startGame}
                      className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all transform hover:scale-105 active:scale-95 font-arcade text-sm"
                    >
                      TRY AGAIN
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                     <button 
                      onClick={startGame}
                      className="px-10 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-full shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all transform hover:scale-105 active:scale-95 font-arcade tracking-widest"
                    >
                      START GAME
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Controls */}
          <div className="grid grid-cols-3 gap-2 lg:hidden mt-4">
            <div />
            <button 
              className="p-4 bg-slate-700 rounded-lg active:bg-slate-600"
              onPointerDown={() => { if (lastProcessedDirectionRef.current !== Direction.DOWN) directionRef.current = Direction.UP; }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            </button>
            <div />
            <button 
              className="p-4 bg-slate-700 rounded-lg active:bg-slate-600"
              onPointerDown={() => { if (lastProcessedDirectionRef.current !== Direction.RIGHT) directionRef.current = Direction.LEFT; }}
            >
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button 
              className="p-4 bg-slate-700 rounded-lg active:bg-slate-600"
              onPointerDown={() => { if (lastProcessedDirectionRef.current !== Direction.UP) directionRef.current = Direction.DOWN; }}
            >
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <button 
              className="p-4 bg-slate-700 rounded-lg active:bg-slate-600"
              onPointerDown={() => { if (lastProcessedDirectionRef.current !== Direction.LEFT) directionRef.current = Direction.RIGHT; }}
            >
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

        {/* Leaderboard Section */}
        <Leaderboard scores={highScores} />
        
      </div>
    </div>
  );
};

export default App;