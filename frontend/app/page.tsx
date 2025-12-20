"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mouse tracking for 3D tilt and spotlight effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize to -1 to 1 for rotation logic
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -2; // Max 2 degrees
    const rotateY = ((x - centerX) / centerX) * 2; // Max 2 degrees

    setMousePosition({ x, y });
    containerRef.current.style.setProperty("--rx", `${rotateX}deg`);
    containerRef.current.style.setProperty("--ry", `${rotateY}deg`);
    containerRef.current.style.setProperty("--mx", `${x}px`);
    containerRef.current.style.setProperty("--my", `${y}px`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ... (drag handlers same as before)
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("http://localhost:8000/upload", { method: "POST", body: formData });
      if (response.ok) {
        clearFile();
        router.push("/stats");
      } else {
        console.error("Upload failed");
      }
    } catch (error) { console.error(error); } finally { setIsUploading(false); }
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center p-6 min-h-[85vh] gap-16 max-w-7xl mx-auto overflow-hidden preserve-3d"
      onMouseMove={handleMouseMove}
    >

      {/* Cinematic Grain Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-50 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse mix-blend-screen"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse animation-delay-4000 mix-blend-screen"></div>
        {/* Moving Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] animate-[pan_20s_linear_infinite]"></div>
      </div>

      {/* Hero Text */}
      <div className="text-center space-y-8 animate-in fade-in slide-in-from-top-6 duration-1000 z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 shadow-2xl backdrop-blur-xl text-xs font-semibold tracking-widest text-indigo-200 uppercase mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-[ping_2s_infinite]"></span>
          Next-Gen Analytics
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-indigo-200 to-indigo-400 tracking-tighter drop-shadow-2xl">
          Call Analytics<br />Reimagined.
        </h1>
      </div>

      {/* 3D Upload Card Container */}
      <div
        ref={containerRef}
        className="group relative w-full max-w-2xl perspective-1000"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full bg-[#0f172a]/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/10 transition-transform duration-100 ease-out overflow-hidden"
          style={{
            transform: `rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))`,
            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`
          }}
        >

          {/* Spotlight Effect Layer */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
            style={{
              background: `radial-gradient(600px circle at var(--mx) var(--my), rgba(255,255,255,0.06), transparent 40%)`
            }}
          ></div>

          {/* Glowing Border Spotlight */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
            style={{
              background: `radial-gradient(600px circle at var(--mx) var(--my), rgba(129, 140, 248, 0.15), transparent 40%)`,
              maskImage: 'linear-gradient(#fff, #fff), linear-gradient(#fff, #fff)',
              maskClip: 'content-box, border-box',
              maskComposite: 'exclude',
              border: '1px solid transparent', // Fallback
              borderRadius: '2.5rem'
            }}
          ></div>


          {/* Card Content */}
          <div className="relative z-10 p-10">

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <span className="text-white font-semibold tracking-wide text-sm uppercase">Import Dataset</span>
              </div>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500/50"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50"></div>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              className={`
                  relative cursor-pointer flex flex-col items-center justify-center w-full h-72 rounded-3xl border-2 border-dashed transition-all duration-500 ease-out overflow-hidden group/zone
                  ${isDragging
                  ? "border-indigo-400 bg-indigo-500/10 shadow-[inner_0_0_20px_rgba(99,102,241,0.2)]"
                  : "border-white/5 hover:border-white/20 hover:bg-white/5"
                } 
                  ${isUploading ? "opacity-50 pointer-events-none" : ""}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" disabled={isUploading} />

              {/* Subtle Grid in Dropzone */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none transition-opacity duration-300 group-hover/zone:opacity-[0.1]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

              <div className="flex flex-col items-center text-center space-y-6 z-10 transition-transform duration-300 group-hover/zone:scale-105">
                <div className={`
                    relative p-6 rounded-full bg-gradient-to-b from-white/10 to-white/5 text-indigo-300 shadow-2xl 
                    backdrop-blur-md border-t border-white/10
                    ${isDragging ? "text-white shadow-[0_0_40px_rgba(99,102,241,0.6)] scale-110" : "group-hover/zone:text-white group-hover/zone:shadow-[0_0_30px_rgba(99,102,241,0.3)]"}
                `}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 relative z-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-white tracking-tight">
                    {isDragging ? "Drop to Upload" : "Select Excel File"}
                  </p>
                  <p className="text-sm text-indigo-200/50 font-medium tracking-wide">Or drag and drop</p>
                </div>
              </div>
            </div>

            {/* File Preview */}
            {file && (
              <div className="mt-8 p-1 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-2xl animate-in zoom-in-95 duration-300">
                <div className="bg-[#0f172a]/90 backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-white/5">
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white truncate max-w-[200px]">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <p className="text-xs text-slate-400 font-mono">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); clearFile(); }} disabled={isUploading} className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-10">
              <button
                onClick={handleSubmit}
                disabled={!file || isUploading}
                className={`
                  relative w-full py-5 rounded-2xl font-bold text-lg tracking-wide transition-all duration-300 transform flex items-center justify-center overflow-hidden
                  ${file && !isUploading
                    ? "text-white shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(79,70,229,0.6)] hover:-translate-y-1 active:scale-[0.98]"
                    : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"}
                `}
              >
                {file && !isUploading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-[shimmer_3s_infinite] bg-[length:200%_100%]"></div>
                )}

                <span className="relative z-10 flex items-center gap-3">
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Generate Insights</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 opacity-70">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Footer / Trust badges */}
      <div className="mt-8 flex gap-6 opacity-30 invert pointer-events-none animate-in fade-in duration-1000 delay-700">
        {/* Simple placeholders for "Trusted Company" logos if needed, currently just icons */}
        <div className="h-6 w-20 bg-white rounded-md"></div>
        <div className="h-6 w-20 bg-white rounded-md"></div>
        <div className="h-6 w-20 bg-white rounded-md"></div>
      </div>

    </div>
  );
}
