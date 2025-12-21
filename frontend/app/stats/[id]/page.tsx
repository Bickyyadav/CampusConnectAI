"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";

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
    console.log("call", call);

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
                const response = await fetch(`http://localhost:8000/users/call/${id}`);
                console.log("💦💦💦💦💦💦💦💦💦💦💦💦💦");
                console.log(response);

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

    const recordingUrl = call.Recording_URL || call.Recording_Url; // Handle different casing

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

            <div className="max-w-7xl mx-auto relative z-10">
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
                    {/* Main Header Card */}
                    <div className="relative bg-[#0f172a]/70 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl mb-8">
                        <div className="relative border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                                    {getInitials(call.name)}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{call.name}</h1>
                                    <div className="flex items-center gap-4 mt-2 text-indigo-200/70 font-mono text-sm">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                            </svg>
                                            {call.phonenumber || "No Number"}
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-white/20"></div>
                                        <div>{call.email || "No Email"}</div>
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
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Column 1: Audio & Transaction Details */}
                        <div className="space-y-8 lg:col-span-1">

                            {/* Audio Player Section */}
                            <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                                    </svg>
                                    Recording
                                </h3>
                                {recordingUrl ? (
                                    <AudioPlayer src={recordingUrl} />
                                ) : (
                                    <div className="p-8 rounded-2xl bg-white/5 border border-white/5 border-dashed flex flex-col items-center justify-center text-slate-500 gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                        </svg>
                                        <span className="text-sm">No Recording Available</span>
                                    </div>
                                )}
                            </div>

                            {/* Transaction Details Box */}
                            <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-xl">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                                    </svg>
                                    Transaction Details
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { label: "Date", value: new Date(call.createdAt).toLocaleDateString() },
                                        { label: "Duration", value: `${Math.floor(call.Duration / 60)}m ${call.Duration % 60}s` },
                                        { label: "System ID", value: call._id, mono: true },
                                        { label: "Call SID", value: call.call_sid || "N/A", mono: true },
                                        { label: "From Country", value: call.FromCountry || "N/A" },
                                        { label: "To Country", value: call.ToCountry || "N/A" },
                                        { label: "Caller Zip", value: call.CallerZip || "N/A" },
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white/[0.03] border-b border-white/5 hover:bg-white/5 transition-colors">
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
                            <div className="bg-[#0f172a]/70 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-xl h-full flex flex-col">
                                <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                    </svg>
                                    Analysis & Insights
                                </h3>

                                {/* Quality Score */}
                                <div className="mb-10">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-sm text-slate-400 font-medium">Call Quality Score</span>
                                        <div className="text-right">
                                            <span className={`text-3xl font-bold ${(call.Quality_Score || 0) >= 80 ? 'text-emerald-400' :
                                                (call.Quality_Score || 0) >= 50 ? 'text-amber-400' : 'text-rose-400'
                                                }`}>
                                                {call.Quality_Score !== undefined && call.Quality_Score !== null ? call.Quality_Score : "--"}
                                            </span>
                                            <span className="text-sm text-slate-500 ml-1">/ 100</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,0,0,0.3)] ${(call.Quality_Score || 0) >= 80 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                                                (call.Quality_Score || 0) >= 50 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-rose-600 to-rose-400'
                                                }`}
                                            style={{ width: `${call.Quality_Score || 0}%` }}
                                        ></div>
                                    </div>
                                    {!call.Quality_Score && (
                                        <p className="text-xs text-slate-500 mt-2 italic text-right">* No score available</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                                    {/* Analysis Text */}
                                    <div className="flex flex-col">
                                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                            AI Analysis
                                        </h4>
                                        <div className="flex-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-300 leading-relaxed text-sm">
                                            {call.Analysis ? (
                                                <p>{call.Analysis}</p>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 min-h-[150px]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-40">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                                    </svg>
                                                    <span className="italic">No analysis generated yet</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transcript */}
                                    <div className="flex flex-col">
                                        <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                            Transcript
                                        </h4>
                                        <div className="flex-1 p-6 rounded-2xl bg-black/20 border border-white/5 font-mono text-sm text-slate-300 leading-relaxed max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {call.Transcript ? (
                                                <p>{call.Transcript}</p>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 min-h-[150px]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-40">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                                                    </svg>
                                                    <span className="italic">No transcript available</span>
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
    );
}
