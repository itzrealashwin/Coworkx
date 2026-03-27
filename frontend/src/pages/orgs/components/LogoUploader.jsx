import React, { useState, useRef } from "react";
import { Label } from "@/components/ui/label";

export default function LogoUploader({ value, onChange }) {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview instantly
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    // Simulate upload delay and return fake url for now
    // Since API mapping mentions: The logo should be uploaded to your storage first (S3/Cloudinary), 
    // then the returned URL is sent as logoUrl in the org creation payload.
    setIsUploading(true);
    try {
      // TODO: Replace with real upload to S3/Cloudinary
      await new Promise(resolve => setTimeout(resolve, 800)); 
      onChange(`https://fake-storage.com/${file.name}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-semibold text-foreground">Workspace Logo</Label>
      <div className="flex items-center gap-4">
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-16 h-16 rounded-[4px] border border-dashed border-border bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors relative overflow-hidden group"
        >
          {preview ? (
            <img src={preview} alt="Logo preview" className="w-full h-full object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground group-hover:text-foreground">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <p>Recommended size: 256x256px.</p>
          <p>Max file size: 2MB.</p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*"
          className="hidden" 
        />
      </div>
    </div>
  );
}
