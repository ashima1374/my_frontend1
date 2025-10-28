import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <Link to="/workspace" className="font-bold text-xl">WorkspaceApp</Link>
      <div className="space-x-4">
        <Link to="/workspace">Workspaces</Link>
        <Link to="/login">Logout</Link>
      </div>
    </nav>
  );
}
