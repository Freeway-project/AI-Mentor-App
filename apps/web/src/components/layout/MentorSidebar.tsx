'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, User, Calendar, Settings, LogOut, Clock, CalendarCheck, FileUp, X, ChevronDown } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { useAuth } from '@/lib/auth-context';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const NAV = [
    { href: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/mentor/dashboard/profile', label: 'My Profile', icon: User },
    { href: '/mentor/bookings', label: 'Bookings', icon: CalendarCheck },
    { href: '/mentor/dashboard/availability', label: 'Availability', icon: Calendar },
    { href: '/mentor/dashboard/settings', label: 'Settings', icon: Settings },
];

interface MentorSidebarProps {
    approvalStatus?: 'pending' | 'approved' | 'rejected' | string;
}

type MentorSidebarProfile = {
    id: string;
    name: string;
    headline?: string;
};

const statusConfig = {
    pending: { label: 'Under Review', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    approved: { label: 'Approved', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
    rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700 border-red-200' },
};

const PROFILE_KEY = 'active_mentor_profile_id';

export function MentorSidebar({ approvalStatus }: MentorSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const [showUpload, setShowUpload] = useState(false);
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showProfileSwitch, setShowProfileSwitch] = useState(false);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

    const { data: profiles = [] } = useQuery<MentorSidebarProfile[]>({
        queryKey: ['mentor-profiles'],
        queryFn: async () => {
            const profile = await apiClient.getMyMentorProfile();
            return profile ? [profile as MentorSidebarProfile] : [];
        },
        enabled: !!user,
    });

    useEffect(() => {
        const stored = localStorage.getItem(PROFILE_KEY);
        if (stored) setActiveProfileId(stored);
    }, []);

    function switchProfile(id: string) {
        localStorage.setItem(PROFILE_KEY, id);
        setActiveProfileId(id);
        setShowProfileSwitch(false);
        router.refresh();
    }

    const multiProfile = profiles.length > 1;
    const activeProfile = profiles?.find(p => p.id === activeProfileId) ?? profiles?.[0];

    const handleUpload = async () => {
        if (!resumeFile) return;
        setUploading(true);
        setUploadStatus('idle');
        try {
            await apiClient.uploadCareerResume(resumeFile);
            setUploadStatus('success');
            setResumeFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
            setUploadStatus('error');
        } finally {
            setUploading(false);
        }
    };

    const handleToggle = () => {
        setShowUpload((v) => !v);
        setUploadStatus('idle');
        setResumeFile(null);
    };

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const status = approvalStatus as keyof typeof statusConfig;
    const statusInfo = statusConfig[status];

    return (
        <aside className="w-64 shrink-0 h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <Link href="/" className="flex items-center gap-2.5">
                    <BrandLogo
                        markClassName="h-9 w-9"
                        wordmarkClassName="text-xs tracking-[0.24em]"
                    />
                </Link>
                <p className="mt-1 text-xs text-slate-400 pl-0.5">Mentor Portal</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (href !== '/mentor/dashboard' && pathname.startsWith(href));
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md shadow-amber-900/40'
                                : 'text-slate-400 hover:text-white hover:bg-white/8'
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            {label}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="px-3 py-4 border-t border-white/10 space-y-3">
                {/* Profile switcher (shown when user has multiple mentor profiles) */}
                {multiProfile && (
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileSwitch(v => !v)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors"
                        >
                            <span className="truncate">{activeProfile?.name ?? 'Select Profile'}</span>
                            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        </button>
                        {showProfileSwitch && (
                            <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                                <p className="px-3 py-2 text-xs text-slate-500 border-b border-white/10">Switch profile</p>
                                {profiles?.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => switchProfile(p.id)}
                                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${p.id === (activeProfileId ?? profiles[0]?.id) ? 'bg-amber-700 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                                    >
                                        <span className="block font-medium truncate">{p.name}</span>
                                        {p.headline && <span className="block text-slate-400 truncate">{p.headline}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Approval status pill */}
                {statusInfo && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${statusInfo.classes}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Profile: {statusInfo.label}
                    </div>
                )}

                {/* User info */}
                <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || 'M'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>

                <button
                    onClick={handleToggle}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/10 text-sm text-amber-300 transition-colors hover:bg-amber-500/20"
                >
                    <FileUp className="w-4 h-4" />
                    Upload Resume
                </button>

                {showUpload && (
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-300">Select resume file</span>
                            <button onClick={handleToggle} className="text-slate-500 hover:text-white">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.doc,.html,.jpeg,.jpg,.png,.webp,.gif,.tiff,.bmp"
                            onChange={(e) => {
                                setResumeFile(e.target.files?.[0] ?? null);
                                setUploadStatus('idle');
                            }}
                            className="w-full text-xs text-slate-400 file:mr-2 file:rounded file:border-0 file:bg-amber-700 file:px-2 file:py-1 file:text-xs file:text-white file:cursor-pointer"
                        />
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !resumeFile}
                            className="w-full rounded bg-amber-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {uploading ? 'Uploading…' : 'Upload'}
                        </button>
                        {uploadStatus === 'success' && (
                            <p className="text-xs text-green-400">Resume uploaded successfully!</p>
                        )}
                        {uploadStatus === 'error' && (
                            <p className="text-xs text-red-400">Upload failed. Please try again.</p>
                        )}
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/8 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
