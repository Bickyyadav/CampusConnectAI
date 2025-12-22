"use client";

import { use, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {toast} from "react-toastify"

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

    const [redialling, setRedialling] = useState(false);

    const handleRedial = async () => {
        if (!call || !call.phonenumber) return;
        setRedialling(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/redial/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            if (response.ok) {
                toast("Redial initiated successfully!");
            } else {
                toast("Failed to initiate redial.");
            }
        } catch (err) {
            console.error(err);
            alert("Error initiating redial.");
        } finally {
            setRedialling(false);
        }
    };
    

    useEffect(() => {
        const fetchCallDetails = async () => {
            try {
                // Try specific endpoint first
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/call/${id}`);

                if (response.ok) {
                    const data = await response.json();
                    setCall(data);
                } else {
                    throw new Error("Call not found");
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
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[#0f172a]">
                <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-3xl text-rose-200 backdrop-blur-xl shadow-2xl">
                    <h2 className="text-2xl font-bold mb-2">Details Unavailable</h2>
                    <p className="text-rose-200/70">{error || "Call not found"}</p>
                </div>
            </div>
        );
    }

    const recordingUrl = call.Recording_URL || call.Recording_Url; // Handle different casing

    return (
        <div
            className="min-h-screen p-8 lg:p-12 font-sans overflow-hidden bg-[#0f172a] relative"
            onMouseMove={handleMouseMove}
        >
            {/* Cinematic Grain Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-50 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse animation-delay-2000"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">

                {/* 3D Container */}
                <div
                    ref={containerRef}
                    className="group relative w-full perspective-1000 animate-in fade-in slide-in-from-bottom-8 duration-1000"
                    style={{ perspective: "1500px" }}
                >
                    {/* Main Header Card */}
                    <div className="relative bg-[#0f172a]/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl mb-8 transition-transform duration-200 ease-out"
                        style={{
                            transform: `rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))`,
                            boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.5)`
                        }}
                    >
                        {/* Spotlight */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ mixBlendMode: 'overlay' }}></div>

                        <div className="relative border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">

                            <div className="flex items-center gap-8">
                                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-indigo-500/20 ring-4 ring-white/5">
                                    {getInitials(call.name)}
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{call.name}</h1>
                                    <div className="flex items-center gap-6 mt-3 text-indigo-200/70 font-mono text-sm">
                                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                            {call.phonenumber || "No Number"}
                                        </div>
                                        <div>{call.email || "No Email"}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3">
                                <div className={`
                                    px-8 py-3 rounded-2xl border backdrop-blur-md flex items-center gap-3 shadow-lg
                                    ${call.status === 'completed'
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200 shadow-emerald-500/10'
                                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-200 shadow-indigo-500/10'}
                                `}>
                                    <div className={`w-3 h-3 rounded-full ${call.status === 'completed' ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`}></div>
                                    <span className="font-semibold capitalize tracking-wide text-lg">{call.status}</span>
                                </div>

                                <button
                                    onClick={handleRedial}
                                    disabled={redialling}
                                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {redialling ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Redialling...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                            Redial
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Column 1: Audio & Transaction Details */}
                        <div className="space-y-8 lg:col-span-1">

                            {/* Audio Player Section */}
                            <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group/card relative overflow-hidden">
                                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 group-hover/card:text-white transition-colors relative z-10">
                                    Recording
                                </h3>

                                {recordingUrl ? (
                                    <div className="relative z-10">
                                        <AudioPlayer src={recordingUrl} />
                                    </div>
                                ) : (
                                    <div className="relative z-10 p-8 rounded-2xl bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center text-slate-500 gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        <span className="text-sm">No Recording Available</span>
                                    </div>
                                )}
                            </div>

                            {/* Transaction Details Box */}
                            <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 group/card relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/card:opacity-20 transition-opacity">

                                </div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2 group-hover/card:text-slate-200 transition-colors relative z-10">
                                    Transaction Details
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    {[
                                        { label: "Date", value: new Date(call.createdAt).toLocaleDateString() },
                                        { label: "Duration", value: `${Math.floor(call.Duration / 60)}m ${call.Duration % 60}s` },
                                        { label: "System ID", value: call._id, mono: true },
                                        { label: "Call SID", value: call.call_sid || "N/A", mono: true },
                                        { label: "From Country", value: call.FromCountry || "N/A" },
                                        { label: "To Country", value: call.ToCountry || "N/A" },
                                        { label: "Caller Zip", value: call.CallerZip || "N/A" },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/[0.03] border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{item.label}</span>
                                            <span className={`text-sm text-slate-200 text-right ${item.mono ? 'font-mono text-xs opacity-70' : ''}`}>
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Column 2: Analysis & Insights */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 p-10 shadow-2xl h-full flex flex-col relative overflow-hidden group/main">
                                {/* Decorative Gradients */}
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none group-hover/main:bg-indigo-500/10 transition-colors duration-1000"></div>

                                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                    </svg>
                                    Analysis & Insights
                                </h3>

                                {/* Quality Score */}
                                <div className="mb-12 relative z-10">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-sm text-slate-400 font-medium">Call Quality Score</span>
                                        <div className="text-right">
                                            <span className={`text-4xl font-bold ${(call.Quality_Score || 0) >= 80 ? 'text-emerald-400' :
                                                (call.Quality_Score || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                                                }`}>
                                                {call.Quality_Score !== undefined && call.Quality_Score !== null ? call.Quality_Score : "--"}
                                            </span>
                                            <span className="text-sm text-slate-500 ml-1">/ 100</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,0,0,0.3)] relative ${(call.Quality_Score || 0) >= 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                                (call.Quality_Score || 0) >= 50 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                                                }`}
                                            style={{ width: `${call.Quality_Score || 0}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
                                        </div>
                                    </div>
                                    {!call.Quality_Score && (
                                        <p className="text-xs text-slate-500 mt-2 italic text-right">* No score available</p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-12 flex-1 relative z-10">
                                    {/* Analysis Text */}
                                    <div className="group/param">
                                        <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300 mb-4 flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-purple-500/20 ring-1 ring-purple-500/50">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-purple-400">
                                                    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813a3.75 3.75 0 0 0 2.576-2.576l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.394a.75.75 0 0 1 0 1.422l-1.183.394c-.447.15-.799.5-.948.948l-.394 1.183a.75.75 0 0 1-1.422 0l-.394-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.394a.75.75 0 0 1 0-1.422l1.183-.394c.447-.15.799-.5.948-.948l.394-1.183A.75.75 0 0 1 16.5 15Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            AI Analysis
                                        </h4>
                                        <div className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 hover:border-purple-500/30 transition-colors duration-500 p-8 shadow-lg">
                                            {/* Decorative blob */}
                                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>

                                            {call.Analysis ? (
                                                <div className="relative text-slate-300 leading-8 text-[15px] font-normal tracking-wide">
                                                    {call.Analysis.split('\n').map((paragraph: string, i: number) => (
                                                        <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
                                                    ))}

                                                    {/* Intent & Outcome Grid */}
                                                    {(call.Intent || call.Outcome) && (
                                                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-6">
                                                            <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/20 transition-colors">
                                                                <div className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-1">Intent</div>
                                                                <div className="text-white font-medium">{call.Intent || "N/A"}</div>
                                                            </div>
                                                            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/20 transition-colors">
                                                                <div className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-1">Outcome</div>
                                                                <div className="text-white font-medium">{call.Outcome || "N/A"}</div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center text-slate-600 gap-3 py-10">
                                                    <div className="p-4 rounded-full bg-white/5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 opacity-40">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                                        </svg>
                                                    </div>
                                                    <span className="italic text-sm font-medium">No analysis generated yet</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transcript */}
                                    <div className="flex flex-col">
                                        <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 mb-4 flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-indigo-500/20 ring-1 ring-indigo-500/50">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-400">
                                                    <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97ZM6.75 8.25a.75.75 0 0 1 .75-.75h9a.75.75 0 0 1 0 1.5h-9a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H7.5Z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            Transcript
                                        </h4>
                                        <div className="w-full p-1 rounded-2xl bg-gradient-to-b from-white/10 to-transparent">
                                            <div className="w-full bg-[#0b1221] rounded-xl border border-white/5 overflow-hidden relative shadow-inner">
                                                {/* Header for 'Terminal' feel */}
                                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Read-Only</div>
                                                </div>

                                                <div className="p-6 font-mono text-sm text-slate-300/90 leading-relaxed max-h-[500px] overflow-y-auto custom-scrollbar space-y-4">
                                                    {call.Transcript ? (
                                                        (() => {
                                                            // Simple parser to split by User/Bot
                                                            const text = call.Transcript;
                                                            const parts = text.split(/(User:|Bot:|Assistant:|AI:|System:)/i).filter((p: string) => p.trim());

                                                            if (parts.length < 2) return <p className="whitespace-pre-wrap">{text}</p>;

                                                            const messages = [];
                                                            let currentSpeaker = "Unknown";
                                                            let currentMessage = "";

                                                            for (let i = 0; i < parts.length; i++) {
                                                                const part = parts[i];
                                                                if (part.match(/^(User:|Bot:|Assistant:|AI:|System:)$/i)) {
                                                                    if (currentMessage) {
                                                                        messages.push({ speaker: currentSpeaker, text: currentMessage.trim() });
                                                                        currentMessage = "";
                                                                    }
                                                                    currentSpeaker = part.replace(':', '').trim();
                                                                    if (currentSpeaker.toLowerCase() === 'ai' || currentSpeaker.toLowerCase() === 'assistant') currentSpeaker = 'Bot';
                                                                } else {
                                                                    currentMessage += part;
                                                                }
                                                            }
                                                            if (currentMessage) {
                                                                messages.push({ speaker: currentSpeaker, text: currentMessage.trim() });
                                                            }

                                                            return messages.map((msg, idx) => {
                                                                const isUser = msg.speaker.toLowerCase() === 'user';
                                                                return (
                                                                    <div key={idx} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                                        <div className={`
                                                                            max-w-[85%] p-3 rounded-2xl text-xs sm:text-sm font-sans
                                                                            ${isUser
                                                                                ? 'bg-indigo-500/20 text-indigo-100 rounded-tr-none border border-indigo-500/20'
                                                                                : 'bg-slate-700/40 text-slate-200 rounded-tl-none border border-white/5'}
                                                                        `}>
                                                                            <div className={`text-[10px] font-bold uppercase mb-1 tracking-wider ${isUser ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                                                                {msg.speaker}
                                                                            </div>
                                                                            {msg.text}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            });
                                                        })()
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center text-slate-600 gap-3 py-10">
                                                            <div className="p-4 rounded-full bg-white/5">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 opacity-40">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                                                </svg>
                                                            </div>
                                                            <span className="italic text-sm font-medium">No transcript available</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
