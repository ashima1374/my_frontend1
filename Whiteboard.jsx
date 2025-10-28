import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";

const socket = io("http://localhost:5000"); // backend socket URL

export default function Whiteboard() {
  const { workspaceId } = useParams();
  const [lines, setLines] = useState([]);
  const [color, setColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 120, // leave space for toolbar
  });

  const isDrawing = useRef(false);
  const stageRef = useRef();

  // Update canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({ width: window.innerWidth, height: window.innerHeight - 120 });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Socket listeners for real-time collaboration
  useEffect(() => {
    socket.on("whiteboard-draw", (line) => setLines((prev) => [...prev, line]));
    socket.on("whiteboard-clear", () => {
      setLines([]);
      setHistory([]);
      setRedoStack([]);
    });
    socket.on("whiteboard-undo", () => undoLocal(false));
    socket.on("whiteboard-redo", () => redoLocal(false));

    return () => {
      socket.off("whiteboard-draw");
      socket.off("whiteboard-clear");
      socket.off("whiteboard-undo");
      socket.off("whiteboard-redo");
    };
  }, [lines, history, redoStack]);

  // Drawing handlers
  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const pos = e.target.getStage().getPointerPosition();
    const newLine = { points: [pos.x, pos.y], stroke: color, strokeWidth };
    setLines([...lines, newLine]);
    setHistory([...history, newLine]);
    setRedoStack([]);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.splice(lines.length - 1, 1, lastLine);
    setLines([...lines]);
    socket.emit("whiteboard-draw", lastLine, workspaceId);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // Toolbar functions
  const clearBoard = () => {
    setLines([]);
    setHistory([]);
    setRedoStack([]);
    socket.emit("whiteboard-clear", workspaceId);
  };

  const undoLocal = (emit = true) => {
    if (lines.length === 0) return;
    const lastLine = lines[lines.length - 1];
    setLines(lines.slice(0, -1));
    setRedoStack([lastLine, ...redoStack]);
    if (emit) socket.emit("whiteboard-undo", workspaceId);
  };

  const redoLocal = (emit = true) => {
    if (redoStack.length === 0) return;
    const nextLine = redoStack[0];
    setLines([...lines, nextLine]);
    setRedoStack(redoStack.slice(1));
    if (emit) socket.emit("whiteboard-redo", workspaceId);
  };

  const saveAsImage = () => {
    if (!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = `whiteboard_${workspaceId}.png`;
    link.href = uri;
    link.click();
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Collaborative Whiteboard</h1>

      {/* Toolbar */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={clearBoard} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Clear Board</button>
        <button onClick={() => undoLocal()} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Undo</button>
        <button onClick={() => redoLocal()} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Redo</button>
        <button onClick={saveAsImage} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save as Image</button>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="border rounded" />
        <input type="range" min="1" max="10" value={strokeWidth} onChange={(e) => setStrokeWidth(parseInt(e.target.value))} className="border rounded" />
      </div>

      {/* Canvas */}
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="border bg-white"
      >
        <Layer>
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.points}
              stroke={line.stroke}
              strokeWidth={line.strokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
