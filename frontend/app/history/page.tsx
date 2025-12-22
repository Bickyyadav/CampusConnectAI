"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- Types ---
interface CallData {
    _id: string;
    name: string;
    email?: string;
    phonenumber?: string;
    status: string;
    createdAt: string;
    Duration: number;
    CallerCountry?: string;
    ToCountry?: string;
    CallerZip?: string;
    Recording_Url?: string;
    Recording_Url_Lower?: string; // fallback
    Quality_Score?: number;
    Analysis?: string;
    Transcript?: string;
    Intent?: string;
    Outcome?: string;
}

export default function HistoryPage() {
    const router = useRouter();

    const [history, setHistory] = useState<CallData[]>([]);
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [loadingHistory, setLoadingHistory] = useState(true);
    const [loadingCall, setLoadingCall] = useState(false);

    const [selectedCall, setSelectedCall] = useState<CallData | null>(null);

    // Fetch history list
    useEffect(() => {
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/calls`);
                if (response.ok) {
                    const data = await response.json();
                    setHistory(data);
                    // Optionally select first call
                    // if (data.length > 0) setSelectedCallId(data[0]._id);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoadingHistory(false);
            }
        };
        fetchHistory();
    }, []);

    // Fetch specific call details when selected
    useEffect(() => {
        const fetchCallDetails = async () => {
            if (!selectedCallId) return;

            setLoadingCall(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/call/${selectedCallId}`);
                if (response.ok) {
                    const data = await response.json();
                    setSelectedCall(data);
                }
            } catch (err) {
                console.error("Failed to fetch call details", err);
            } finally {
                setLoadingCall(false);
            }
        };

        if (selectedCallId) {
            fetchCallDetails();
        } else {
            setSelectedCall(null);
        }
    }, [selectedCallId]);

    const filteredHistory = useMemo(() => {
        return history.filter(h =>
            h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.status.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [history, searchQuery]);

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    };

    return (
        <div className="relative min-h-screen font-sans overflow-hidden bg-[#0f172a] flex">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04] z-50 mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
            </div>

            {/* --- Sidebar --- */}
            <aside className="w-80 flex-shrink-0 flex flex-col bg-[#0b1120]/80 border-r border-white/5 backdrop-blur-2xl z-20 h-screen overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent">
                    <h2 className="text-xl font-bold text-white tracking-tight">Call History</h2>
                    <div className="relative mt-4">
                        <input
                            type="text"
                            placeholder="Search calls..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1e293b] border border-white/10 rounded-xl py-2 px-4 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-500 absolute left-3 top-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                    {loadingHistory ? (
                        <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        filteredHistory.map((h) => {
                            const isActive = h._id === selectedCallId;
                            return (
                                <div
                                    key={h._id}
                                    onClick={() => setSelectedCallId(h._id)}
                                    className={`
                                        cursor-pointer p-3 rounded-xl border transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-indigo-500/20 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                            : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                                            {h.name}
                                        </span>
                                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full border ${h.status === 'completed' ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10' : 'text-indigo-300 border-indigo-500/20 bg-indigo-500/10'
                                            }`}>
                                            {h.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs text-slate-500">
                                            {new Date(h.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </aside>

            {/* --- Main Content Area --- */}
            <main className="flex-1 overflow-y-auto h-screen relative bg-[#0f172a]">
                {selectedCallId ? (
                    loadingCall || !selectedCall ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center gap-4">
                                <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                                <p className="text-indigo-200 font-medium tracking-wide">Loading Details...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto p-8 animate-in fade-in zoom-in-95 duration-500">
                            {/* Simple Header for selected call */}
                            <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-white">{selectedCall.name}</h1>
                                    <p className="text-slate-400 mt-1 flex items-center gap-2">
                                        <span className="font-mono text-sm">{selectedCall.phonenumber}</span>
                                        <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                                        <span className="text-sm">{new Date(selectedCall.createdAt).toLocaleString()}</span>
                                    </p>
                                </div>
                                <Link
                                    href={`/stats/${selectedCall._id}`}
                                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                                >
                                    Open Full View
                                </Link>
                            </div>

                            {/* Two Column Grid for Quick View */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Basic Info */}
                                <div className="space-y-6">
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Call Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Duration</span> <span className="text-slate-200">{Math.floor(selectedCall.Duration / 60)}m {selectedCall.Duration % 60}s</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">From</span> <span className="text-slate-200">{selectedCall.CallerCountry || "N/A"}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">To</span> <span className="text-slate-200">{selectedCall.ToCountry || "N/A"}</span></div>
                                            <div className="flex justify-between text-sm"><span className="text-slate-500">Quality Score</span> <span className="text-emerald-400 font-bold">{selectedCall.Quality_Score || "N/A"}</span></div>
                                        </div>
                                    </div>

                                    {/* Summary / Analysis Preview */}
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Analysis Summary</h3>
                                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-6">
                                            {selectedCall.Analysis || "No analysis available."}
                                        </p>
                                    </div>
                                </div>

                                {/* Transcript Preview */}
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 max-h-[600px] overflow-hidden flex flex-col">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Transcript Preview</h3>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-slate-300 font-mono whitespace-pre-wrap">
                                        {selectedCall.Transcript || "No transcript available."}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center h-full text-center">
                        <div className="max-w-md p-8 rounded-3xl bg-white/[0.02] border border-white/5">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 17.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Select a Call</h2>
                            <p className="text-slate-400">Choose a call from the history list on the left to view its details and analysis.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
