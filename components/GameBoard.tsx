import React from 'react';
import { Coordinate } from '../types';

interface GameBoardProps {
  snake: Coordinate[];
  food: Coordinate;
  gridSize: number;
  isGameOver: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({ snake, food, gridSize, isGameOver }) => {
  // Create a flat array representing the grid for rendering
  const gridCells = Array.from({ length: gridSize * gridSize }, (_, i) => {
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    return { x, y };
  });

  const isSnakeHead = (x: number, y: number) => snake[0].x === x && snake[0].y === y;
  const isSnakeBody = (x: number, y: number) => {
    return snake.some((segment, index) => index !== 0 && segment.x === x && segment.y === y);
  };
  const isFood = (x: number, y: number) => food.x === x && food.y === y;

  return (
    <div 
      className={`relative grid bg-slate-800 border-4 border-slate-600 rounded-lg shadow-2xl overflow-hidden transition-colors duration-300 ${isGameOver ? 'border-red-500' : 'border-slate-600'}`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        width: 'min(90vw, 500px)',
        height: 'min(90vw, 500px)',
      }}
    >
      {gridCells.map((cell) => {
        const isHead = isSnakeHead(cell.x, cell.y);
        const isBody = isSnakeBody(cell.x, cell.y);
        const isFoodCell = isFood(cell.x, cell.y);

        let cellClass = "w-full h-full transition-all duration-100 ";
        
        if (isHead) {
          cellClass += "bg-emerald-400 z-10 rounded-sm transform scale-110 shadow-[0_0_10px_rgba(52,211,153,0.8)]";
        } else if (isBody) {
          cellClass += "bg-emerald-600 opacity-80 rounded-sm";
        } else if (isFoodCell) {
          cellClass += "bg-rose-500 rounded-full transform scale-75 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]";
        } else {
          cellClass += "bg-slate-800/50";
        }

        return (
          <div key={`${cell.x}-${cell.y}`} className={cellClass} />
        );
      })}
      
      {/* Optional Grid Lines Overlay for retro feel */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{
             backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
             backgroundSize: `${100/gridSize}% ${100/gridSize}%`
           }}
      />
    </div>
  );
};

export default GameBoard;