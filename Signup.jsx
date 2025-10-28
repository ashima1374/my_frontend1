import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signup successful! Please check your email for confirmation.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
  <h1 className="text-3xl font-bold text-blue-500">Hello Tailwind!</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-4 bg-white p-6 rounded shadow-md">
        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600" type="submit">Sign Up</button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>


  );
}
