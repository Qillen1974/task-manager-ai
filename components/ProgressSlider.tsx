"use client";

import { useState, useEffect } from "react";

interface ProgressSliderProps {
  value: number; // 0-100
  onChange: (value: number) => void;
  onCommit?: (value: number) => void; // Called when user finishes editing
  showLabel?: boolean;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}

export function ProgressSlider({
  value,
  onChange,
  onCommit,
  showLabel = true,
  size = "medium",
  disabled = false,
}: ProgressSliderProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleBlur = () => {
    onCommit?.(localValue);
  };

  // Determine color based on progress
  const getColor = () => {
    if (localValue < 33) return "from-red-500 to-red-600";
    if (localValue < 67) return "from-yellow-500 to-yellow-600";
    return "from-green-500 to-green-600";
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return "h-1.5";
      case "large":
        return "h-3";
      default:
        return "h-2";
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min="0"
        max="100"
        value={localValue}
        onChange={(e) => handleChange(Number(e.target.value))}
        onBlur={handleBlur}
        disabled={disabled}
        className={`flex-1 appearance-none bg-gray-200 rounded-full cursor-pointer accent-blue-600 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
        style={{
          height: getSizeClasses(),
        }}
      />

      {showLabel && (
        <div className="flex items-center gap-2">
          <div className={`w-16 h-${size === "small" ? "6" : size === "large" ? "10" : "8"} bg-gradient-to-r ${getColor()} rounded-lg flex items-center justify-center`}>
            <span className="text-xs font-bold text-white">{localValue}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
