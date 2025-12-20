"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Custom Audio Player Component ---
const AudioPlayer = ({ src }: { src: string }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const skip = (seconds: number) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime += seconds;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const time = Number(e.target.value);
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-lg">
            <audio ref={audioRef} src={src} preload="metadata" />

            <div className="flex flex-col gap-3">
                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                    <button
                        onClick={() => skip(-10)}
                        className="p-2 text-indigo-300 hover:text-white transition-colors hover:bg-white/5 rounded-full"
                        title="Rewind 10s"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] transition-all transform hover:scale-105"
                    >
                        {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 fill-current">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 fill-current ml-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 0 1 0 1.971l-11.54 6.347a1.125 1.125 0 0 1-1.667-.985V5.653Z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={() => skip(10)}
                        className="p-2 text-indigo-300 hover:text-white transition-colors hover:bg-white/5 rounded-full"
                        title="Forward 10s"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="w-10 text-right">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(129,140,248,0.5)]"
                    />
                    <span className="w-10">{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
};


export default function CallDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const { id } = resolvedParams;

    const [call, setCall] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Mouse tracking for 3D tilt
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -1; // Max 1 deg
        const rotateY = ((x - centerX) / centerX) * 1; // Max 1 deg

        containerRef.current.style.setProperty("--rx", `${rotateX}deg`);
        containerRef.current.style.setProperty("--ry", `${rotateY}deg`);
        containerRef.current.style.setProperty("--mx", `${x}px`);
        containerRef.current.style.setProperty("--my", `${y}px`);
    };

    useEffect(() => {
        const fetchCallDetails = async () => {
            try {
                // Try specific endpoint first
                const response = await fetch(`http://localhost:8000/users/calls/${id}`);
                console.log("💦💦💦💦💦💦💦💦💦💦💦💦💦");
                console.log(response);

                if (response.ok) {
                    const data = await response.json();
                    setCall(data);
                } else {
                    // Fallback to list filtering
                    const listResponse = await fetch("http://localhost:8000/users/calls");
                    if (!listResponse.ok) throw new Error("Failed to fetch calls");
                    const listData = await listResponse.json();
                    const found = listData.find((c: any) => c._id === id);
                    if (found) {
                        setCall(found);
                    } else {
                        throw new Error("Call not found");
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCallDetails();
        }
    }, [id]);

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                        <div className="absolute inset-0 h-16 w-16 rounded-full border-r-2 border-l-2 border-purple-500 animate-spin animation-delay-150 opacity-70"></div>
                    </div>
                    <p className="text-indigo-200 font-medium tracking-wide animate-pulse">Retrieving Call Data...</p>
                </div>
            </div>
        );
    }

    if (error || !call) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-rose-200 backdrop-blur-xl shadow-2xl">
                    <h2 className="text-2xl font-bold mb-2">Details Unavailable</h2>
                    <p className="text-rose-200/70">{error || "Call not found"}</p>
                    <Link href="/stats" className="mt-6 inline-flex px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white font-medium">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative min-h-screen p-6 md:p-12 font-sans overflow-hidden bg-[#0f172a]"
            onMouseMove={handleMouseMove}
        >
            {/* Cinematic Grain Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-50 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse animation-delay-2000"></div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                <Link href="/stats" className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition-colors mb-8 group animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </div>
                    <span className="font-medium tracking-wide text-sm">Back to Analytics</span>
                </Link>

                <div
                    ref={containerRef}
                    className="group relative w-full perspective-1000 animate-in fade-in slide-in-from-bottom-8 duration-1000"
                    style={{ perspective: "1500px" }}
                >
                    <div
                        className="relative bg-[#0f172a]/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden transition-transform duration-100 ease-out shadow-2xl"
                        style={{
                            transform: `rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))`,
                            boxShadow: `0 40px 80px -20px rgba(0, 0, 0, 0.5)`
                        }}
                    >
                        {/* Spotlight Effect Layer */}
                        <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"
                            style={{
                                background: `radial-gradient(800px circle at var(--mx) var(--my), rgba(255,255,255,0.03), transparent 40%)`
                            }}
                        ></div>

                        {/* Top Banner / Status */}
                        <div className="relative border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                                    {getInitials(call.name)}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{call.name}</h1>
                                    <div className="flex items-center gap-2 mt-2 text-indigo-200/70 font-mono text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                        </svg>
                                        {call.phonenumber || "No Number"}
                                    </div>
                                </div>
                            </div>

                            <div className={`
                                px-6 py-3 rounded-2xl border backdrop-blur-md flex items-center gap-3
                                ${call.status === 'completed'
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200'}
                            `}>
                                <div className={`w-2.5 h-2.5 rounded-full ${call.status === 'completed' ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`}></div>
                                <span className="font-semibold capitalize tracking-wide">{call.status}</span>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">

                            {/* Left Column */}
                            <div className="space-y-8">
                                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-indigo-500/50"></span>
                                    Session Metrics
                                </h3>

                                {call.Recording_Url && (
                                    <div className="mb-6">
                                        <p className="text-indigo-200/80 text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 animate-pulse text-indigo-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                                            </svg>
                                            Call Recording
                                        </p>
                                        <AudioPlayer src={call.Recording_Url} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/card">
                                        <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-wider mb-2">Duration</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-white group-hover/card:text-indigo-200 transition-colors">
                                                {Math.floor(call.Duration / 60)}
                                            </span>
                                            <span className="text-sm text-slate-400">m</span>
                                            <span className="text-2xl font-bold text-white group-hover/card:text-indigo-200 transition-colors ml-2">
                                                {call.Duration % 60}
                                            </span>
                                            <span className="text-sm text-slate-400">s</span>
                                        </div>
                                    </div>

                                    <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/card">
                                        <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-wider mb-2">Date</p>
                                        <span className="text-lg font-bold text-white group-hover/card:text-indigo-200 transition-colors">
                                            {new Date(call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(call.createdAt).getFullYear()}
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <p className="text-indigo-200/60 text-xs font-medium uppercase tracking-wider mb-2">Full Timestamp</p>
                                    <p className="text-white font-mono text-sm">
                                        {new Date(call.createdAt).toLocaleString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-8">
                                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-purple-500/50"></span>
                                    Client Details
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        { label: "Email Address", value: call.email },
                                        { label: "Location", value: call.FromCountry || call.CallerCountry },
                                        { label: "Postal Code", value: call.CallerZip },
                                        // Removed explicit Recording URL text here, as per user request to hide raw URL
                                        { label: "System ID", value: call._id, mono: true }
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.02] border-b border-white/5 hover:bg-white/5 transition-colors group/row">
                                            <span className="text-sm text-indigo-200/60 font-medium">{item.label}</span>
                                            <span className={`text-sm text-white ${item.mono ? 'font-mono text-xs opacity-50' : 'font-medium'}`}>
                                                {item.value || <span className="text-white/20 italic">Not Provided</span>}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Quality Score */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.02] to-white/[0.05] border border-white/5 mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-slate-400 font-medium">Quality Score</span>
                                            <span className={`text-sm font-bold ${(call.Quality_Score || 0) >= 80 ? 'text-emerald-400' :
                                                (call.Quality_Score || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                                                }`}>
                                                {call.Quality_Score || 0}/100
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${(call.Quality_Score || 0) >= 80 ? 'bg-emerald-500' :
                                                    (call.Quality_Score || 0) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}
                                                style={{ width: `${call.Quality_Score || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Transcript Section - Full Width Below Grid */}
                        {call.Transcript && (
                            <div className="px-10 pb-10">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <span className="w-8 h-[1px] bg-slate-500/50"></span>
                                    Transcript
                                </h3>
                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 font-mono text-sm text-slate-300 leading-relaxed max-h-96 overflow-y-auto shadow-inner">
                                    {call.Transcript}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
