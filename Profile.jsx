import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import axios from "axios";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  // 🧠 Fetch logged-in user + profile details
  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, full_name, bio, phone")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url || "");
          setName(profile.full_name || "");
          setBio(profile.bio || "");
          setPhone(profile.phone || "");
        }
      }
    };
    fetchUser();
  }, []);

  // 🌩️ Cloudinary credentials
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // 📸 Upload Profile Picture
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formData
      );

      const imageUrl = response.data.secure_url;
      setAvatarUrl(imageUrl);

      await supabase
        .from("profiles")
        .update({ avatar_url: imageUrl })
        .eq("user_id", user.id);

      alert("Profile picture updated!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error uploading image!");
    }
  };

  // 📝 Update Name, Bio, and Phone
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: name,
          bio,
          phone,
        })
        .eq("id", user.id);

      alert("Profile info updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile info!");
    }
  };

  // 🎨 UI
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 text-gray-800 p-6">
      <h1 className="text-4xl font-bold mb-6 text-indigo-700">My Profile</h1>

      {/* Avatar Section */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile"
          className="w-36 h-36 rounded-full shadow-lg mb-4 border-4 border-white transition-transform hover:scale-105 duration-200"
        />
      ) : (
        <div className="w-36 h-36 rounded-full bg-gray-300 flex items-center justify-center mb-4 text-gray-600">
          No Image
        </div>
      )}

      <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition duration-200">
        Upload New Image
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>

      {/* Profile Form */}
      <form
        onSubmit={handleProfileUpdate}
        className="bg-white rounded-xl shadow-md p-6 mt-6 w-full max-w-md"
      >
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter your full name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 h-24 resize-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Write something about yourself..."
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-indigo-400"
            placeholder="+91 98765 43210"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200"
        >
          Save Changes
        </button>
      </form>

      {user && (
        <p className="mt-6 text-gray-700 text-lg">
          <span className="font-medium">Email:</span> {user.email}
        </p>
      )}
    </div>
  );
}
