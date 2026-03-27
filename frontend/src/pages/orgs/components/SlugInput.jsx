import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SlugInput({ nameValue, value, onChange, error }) {
  const [isTouched, setIsTouched] = useState(false);

  // Auto-generate slug from name unless user manually edited it
  useEffect(() => {
    if (!isTouched && nameValue) {
      const generated = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      onChange(generated);
    }
  }, [nameValue, isTouched, onChange]);

  const handleChange = (e) => {
    setIsTouched(true);
    onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  };

  // Check state to determine indicator color
  // gray (empty), red (invalid or error), green (valid and length > 3)
  let indicatorColor = "bg-muted-foreground/30"; // gray
  if (error || (value && value.length < 3)) {
    indicatorColor = "bg-destructive"; // red
  } else if (value && value.length >= 3 && !error) {
    indicatorColor = "bg-green-500"; // green
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="slug" className="text-[13px] font-semibold text-foreground">
        Workspace URL
      </Label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-sm text-muted-foreground select-none pointer-events-none">
          coworkx.com/
        </span>
        <Input
          id="slug"
          value={value}
          onChange={handleChange}
          className={`pl-[97px] h-10 text-sm font-medium transition-all duration-150 ${
            error ? "border-destructive focus-visible:ring-destructive/20" : ""
          }`}
          placeholder="your-workspace"
        />
        <div className="absolute right-3">
          <div className={`w-2 h-2 rounded-full ${indicatorColor} transition-colors`} />
        </div>
      </div>
      {error && (
        <p className="text-[12px] text-destructive font-medium flex items-center gap-1.5 mt-1">
          {error}
        </p>
      )}
      {!error && (
        <p className="text-[12px] text-muted-foreground font-medium mt-1">
          This is where you'll log in to your workspace.
        </p>
      )}
    </div>
  );
}
