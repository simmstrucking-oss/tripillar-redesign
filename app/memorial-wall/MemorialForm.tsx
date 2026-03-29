"use client";

import { useState } from "react";

export default function MemorialForm() {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [tribute, setTribute] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/memorial-wall-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, relationship, tribute }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message);
        setName("");
        setRelationship("");
        setTribute("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Could not submit. Please check your connection and try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-gold text-xl">✦</span>
        </div>
        <p className="text-navy font-medium font-serif text-lg mb-1">{message}</p>
        <p className="text-muted text-sm">
          We review all submissions before adding them to the wall.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-gold hover:underline"
        >
          Submit another name
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card-bg border border-card-border rounded-xl p-8 space-y-5">
      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">
          Name <span className="text-gold">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          maxLength={100}
          required
          className="w-full border border-card-border rounded-md px-4 py-2.5 text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">
          Your relationship to them <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="e.g. My mother, My best friend"
          maxLength={100}
          className="w-full border border-card-border rounded-md px-4 py-2.5 text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1.5">
          A brief tribute <span className="text-muted font-normal">(optional, max 200 characters)</span>
        </label>
        <textarea
          value={tribute}
          onChange={(e) => setTribute(e.target.value)}
          placeholder="A few words to honor them"
          maxLength={200}
          rows={3}
          className="w-full border border-card-border rounded-md px-4 py-2.5 text-sm text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-colors resize-none"
        />
        <p className="text-xs text-muted mt-1 text-right">{tribute.length}/200</p>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-4 py-2.5">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || !name.trim()}
        className="w-full bg-gold text-white font-semibold px-6 py-3 rounded-md hover:bg-gold-light transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Submitting…" : "Submit Name for Review"}
      </button>

      <p className="text-xs text-muted text-center">
        All submissions are reviewed before being added to the wall.
      </p>
    </form>
  );
}
