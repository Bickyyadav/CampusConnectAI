"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface CallData {
    _id: string;
    name: string;
    email?: string;
    phonenumber?: string;
    call_sid?: string;
    Duration: number;
    status: string;
    createdAt: string;
    CallerCountry?: string;
    CallerZip?: string;
    FromCountry?: string;
    Recording_Url?: string;
}

interface DailyStats {
    date: string;
    count: number;
}

interface AggregatedMetrics {
    totalCalls: number;
    successRate: number;
    totalDuration: number;
    activeToday: number;
}

export default function StatsPage() {
    const router = useRouter();
    const [calls, setCalls] = useState<CallData[]>([]);
    const [todaysCalls, setTodaysCalls] = useState<CallData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Derived metrics
    const metrics: AggregatedMetrics = useMemo(() => {
        if (!calls.length) return { totalCalls: 0, successRate: 0, totalDuration: 0, activeToday: 0 };

        const totalCalls = calls.length;
        const completedCalls = calls.filter(c => c.status === 'completed').length;
        const successRate = Math.round((completedCalls / totalCalls) * 100);
        const totalDuration = calls.reduce((acc, curr) => acc + (curr.Duration || 0), 0);
        const activeToday = todaysCalls.length;

        return { totalCalls, successRate, totalDuration, activeToday };
    }, [calls, todaysCalls]);

    // Daily stats for chart
    const dailyStats: DailyStats[] = useMemo(() => {
        const statsMap: Record<string, number> = {};
        calls.forEach((call) => {
            const dateStr = new Date(call.createdAt).toISOString().split("T")[0];
            statsMap[dateStr] = (statsMap[dateStr] || 0) + 1;
        });
        return Object.entries(statsMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [calls]);

    useEffect(() => {
        const fetchCalls = async () => {
            try {
                const response = await fetch("http://localhost:8000/users/calls");
                if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
                const data: CallData[] = await response.json();
                setCalls(data);

                // Filter today's calls initially
                const today = new Date().toISOString().split("T")[0];
                const todayList = data.filter(c => new Date(c.createdAt).toISOString().split("T")[0] === today);
                setTodaysCalls(todayList);

            } catch (err: any) {
                setError(err.message || "An unexpected error occurred");
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCalls();
    }, []);

    // Filter logic
    const filteredCalls = useMemo(() => {
        if (!searchQuery) return todaysCalls;
        return todaysCalls.filter(call =>
            call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            call.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            call.phonenumber?.includes(searchQuery)
        );
    }, [todaysCalls, searchQuery]);

    const formatDuration = (seconds: number) => {
        if (!seconds && seconds !== 0) return "--";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatTotalDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${mins}m`;
    };

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
    };

    const maxDailyCount = Math.max(...dailyStats.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                    <p className="text-indigo-200 font-medium tracking-wide">Loading Analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight">Dashboard</h1>
                        <p className="text-indigo-200 mt-2 text-lg">
                            Welcome back. Here's what's happening today, {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.alert("Exporting CSV... (Placeholder)")}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors border border-white/10 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="bg-rose-500/10 border-l-4 border-rose-500 p-4 rounded-r backdrop-blur-sm">
                        <p className="text-sm text-rose-200">Could not connect to live backend ({error}).</p>
                    </div>
                )}

                {/* Section 1: Aggregate Metrics */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-indigo-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                            </svg>
                        </div>
                        <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">Total Calls</p>
                        <p className="text-4xl font-bold text-white mt-2">{metrics.totalCalls.toLocaleString()}</p>
                        <div className="mt-4 text-xs text-indigo-300/60 font-medium">Lifetime volume</div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-emerald-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <p className="text-emerald-200 text-sm font-medium uppercase tracking-wider">Success Rate</p>
                        <p className="text-4xl font-bold text-white mt-2">{metrics.successRate}%</p>
                        <div className="mt-4 text-xs text-emerald-300/60 font-medium">Completed calls</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-blue-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <p className="text-blue-200 text-sm font-medium uppercase tracking-wider">Total Duration</p>
                        <p className="text-4xl font-bold text-white mt-2">{formatTotalDuration(metrics.totalDuration)}</p>
                        <div className="mt-4 text-xs text-blue-300/60 font-medium">All sessions</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-purple-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0h18M5 21h14a2 2 0 0 0 2-2v-5H5v5a2 2 0 0 0 2 2Zm5-10.5a.75.75 0 0 0 0 1.5h.007a.75.75 0 0 0 0-1.5H10Z" />
                            </svg>
                        </div>
                        <p className="text-purple-200 text-sm font-medium uppercase tracking-wider">Active Today</p>
                        <p className="text-4xl font-bold text-white mt-2">{metrics.activeToday}</p>
                        <div className="mt-4 text-xs text-purple-300/60 font-medium">Calls in last 24h</div>
                    </div>
                </section>

                {/* Section 2: Daily Trends Chart */}
                {/* <section className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            Activity Trends
                        </h2>
                    </div>

                    {dailyStats.length > 0 ? (
                        <div className="h-64 flex items-end justify-between gap-2">
                            {dailyStats.slice(-14).map((stat) => {
                                const heightPercentage = (stat.count / maxDailyCount) * 100;
                                return (
                                    <div key={stat.date} className="group relative flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-gradient-to-t from-indigo-500/40 to-indigo-500/60 rounded-t-lg hover:from-indigo-400/60 hover:to-indigo-400/80 transition-all duration-300 relative group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                                            style={{ height: `${Math.max(heightPercentage, 5)}%` }}
                                        >
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                {stat.count} calls
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-500 rotate-0 truncate w-full text-center">
                                            {new Date(stat.date).toLocaleDateString(undefined, { weekday: 'narrow' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-500 border border-dashed border-white/10 rounded-xl">
                            No trend data available.
                        </div>
                    )}
                </section> */}

                {/* Section 3: Recent Calls Table */}
                <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-white pl-1">Recent Calls</h2>
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full py-2 px-4 pl-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                            />
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="bg-white/5 text-xs uppercase font-bold text-indigo-200 tracking-wider">
                                    <tr>
                                        <th className="px-8 py-5">Customer</th>
                                        <th className="px-6 py-5">Status</th>
                                        <th className="px-6 py-5">Recording</th>
                                        <th className="px-6 py-5">Created At</th>
                                        <th className="px-6 py-5">Duration</th>
                                        <th className="px-6 py-5 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredCalls.map((call) => (
                                        <tr
                                            key={call._id}
                                            onClick={() => router.push(`/stats/${call._id}`)}
                                            className="hover:bg-indigo-500/5 transition-all duration-200 cursor-pointer group"
                                        >
                                            <td className="px-8 py-5 font-medium text-white">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-lg transform group-hover:scale-110 transition-transform">
                                                        {getInitials(call.name)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="group-hover:text-indigo-300 transition-colors">{call.name}</span>
                                                        {call.phonenumber && <span className="text-xs text-slate-500 font-mono">{call.phonenumber}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize border shadow-sm ${call.status === 'completed' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-emerald-500/10' :
                                                    call.status === 'busy' || call.status === 'no-answer' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20 shadow-rose-500/10' :
                                                        'bg-blue-500/10 text-blue-300 border-blue-500/20 shadow-blue-500/10'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full mr-2 ${call.status === 'completed' ? 'bg-emerald-400' :
                                                        call.status === 'busy' || call.status === 'no-answer' ? 'bg-rose-400' :
                                                            'bg-blue-400'
                                                        } animate-pulse`}></span>
                                                    {call.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                {call.Recording_Url ? (
                                                    <a
                                                        href={call.Recording_Url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/5 hover:bg-indigo-500 hover:text-white text-indigo-400 transition-colors border border-white/10"
                                                        title="Play Recording"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                                                        </svg>
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-600 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-slate-400">
                                                {new Date(call.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-5 font-mono text-slate-300">{formatDuration(call.Duration)}</td>
                                            <td className="px-6 py-5 text-right text-slate-400 font-mono">
                                                {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredCalls.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-20">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                                    </svg>
                                                    <p>No results found for "{searchQuery}".</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <footer className="text-center text-slate-600 text-sm pb-8 animate-in fade-in duration-1000 delay-500">
                    &copy; {new Date().getFullYear()} Analytics Dashboard. All updates live.
                </footer>
            </div>
        </div>
    );
}
