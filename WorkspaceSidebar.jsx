// components/WorkspaceSidebar.jsx
import React from 'react';

const WorkspaceSidebar = ({ setActiveModule, activeModule }) => {
  const modules = ["Chat", "Tasks", "Documents", "Whiteboard", "Video"];

  return (
    <div className="w-48 bg-gray-100 h-full p-4 flex flex-col space-y-4">
      {modules.map((module) => (
        <button
          key={module}
          className={`p-2 rounded hover:bg-gray-200 ${
            activeModule === module ? "bg-gray-300 font-bold" : ""
          }`}
          onClick={() => setActiveModule(module)}
        >
          {module}
        </button>
      ))}
    </div>
  );
};

export default WorkspaceSidebar;
