import React, { useState } from "react";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const HomePage = () => {
  const [prompt, setPrompt] = useState("");
  const [singer, setSinger] = useState("");
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPlaylist = async () => {
    if (!prompt) return;
    setLoading(true);
    setPlaylist([]);

    try {
      const response = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              "You are an AI that generates music playlists based on user input. Format the output as a JSON array of objects with 'title' and 'artist' keys. Limit the playlist to 5 songs.",
          },
          {
            role: "user",
            content: `Generate a music playlist based on: ${prompt}${
              singer ? `, featuring songs by ${singer}` : ""
            }`,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_completion_tokens: 200,
        top_p: 1,
        stop: null,
        stream: false,
      });
      let rawText = response.choices?.[0]?.message?.content || "";

      // Remove potential code block markers (```json and ```)
      rawText = rawText.replace(/```json\n?|```/g, "").trim();

      console.log("Raw text received from API:", rawText);

      // Extract only the JSON part if there's extra text
      let formattedPlaylist = [];

      try {
        formattedPlaylist = JSON.parse(rawText);
      } catch (error) {
        // Handle cases where the JSON is not properly formatted
        console.log("Error parsing JSON:", error);
        const jsonStart = rawText.indexOf("[");
        const jsonEnd = rawText.lastIndexOf("]") + 1;
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = rawText.substring(jsonStart, jsonEnd);
          formattedPlaylist = JSON.parse(jsonString);
        } else {
          throw new Error("Invalid JSON format received from AI");
        }
      }

      // Limit the playlist to 5 songs
      formattedPlaylist = formattedPlaylist.slice(0, 5);

      setPlaylist(formattedPlaylist);
    } catch (error) {
      console.error("Error fetching playlist:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Generate Your AI Music Playlist
      </h1>
      <div className="w-full max-w-lg bg-gray-800 p-6 rounded-xl shadow-lg">
        <input
          type="text"
          placeholder="Enter your mood, genre, or theme..."
          className="w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <input
          type="text"
          placeholder="Optional: Enter a singer or band..."
          className="w-full p-3 mt-4 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={singer}
          onChange={(e) => setSinger(e.target.value)}
        />
        <button
          className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition"
          onClick={fetchPlaylist}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Playlist"}
        </button>
      </div>
      <div className="mt-8 w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">Generated Playlist</h2>
        <ul className="space-y-3">
          {playlist.length > 0 ? (
            playlist.map((song, index) => (
              <li
                key={index}
                className="bg-gray-800 p-3 rounded-lg shadow text-center"
              >
                <span className="font-bold">{song.title}</span> - {song.artist}
              </li>
            ))
          ) : (
            <p className="text-gray-400 text-center">No songs generated yet.</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default HomePage;
