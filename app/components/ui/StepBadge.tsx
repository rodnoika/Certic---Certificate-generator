import React from "react";

export default function StepBadge({ n, current, label }: { n: number; current: number; label: string }) {
  const active = current === n;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
        active ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      <span className="text-xs font-semibold">{n}</span>
      <span className="text-xs">{label}</span>
    </div>
  );
}
