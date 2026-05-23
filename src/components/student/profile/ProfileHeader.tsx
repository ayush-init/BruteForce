// 🌟 Code by Ayush Chaurasiya — Eat 💻 Sleep 😴 Code ⚡ Repeat 💪

"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Edit2, BarChart3, GraduationCap, MapPin, Edit3, Linkedin, Copy } from 'lucide-react';
import { StudentProfile } from '@/types/student/index.types';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { showSuccess, showError } from '@/ui/toast';

interface ProfileHeaderProps {
    student: StudentProfile;
    canEdit: boolean;
    onEditProfile: () => void;
    onShowTopicProgress: () => void;
    onEditUsername?: () => void;
    onShareLinkedIn?: () => void;
}

export function ProfileHeader({
    student,
    canEdit,
    onEditProfile,
    onShowTopicProgress,
    onEditUsername,
    onShareLinkedIn,
}: ProfileHeaderProps) {

    const handleCopyUrl = async () => {
        try {
            const url = typeof window !== 'undefined' ? window.location.href : '';
            await navigator.clipboard.writeText(url);
            showSuccess('Link copied!', 'Profile URL copied to clipboard.');
        } catch {
            showError('Could not copy', 'Please copy the URL manually.');
        }
    };

    return (
        <div className="glass backdrop-blur-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-4 rounded-2xl ">

            {/* MAIN CONTAINER */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                {/* LEFT */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">

                    {/* PROFILE IMAGE */}
                    <div className="relative">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 shrink-0 overflow-hidden border-2 glass hover-glow transition-all duration-200 hover:scale-105 rounded-full border-[var(--border)]">
                            {student.profileImageUrl ? (
                                <Image
                                    src={student.profileImageUrl}
                                    alt={student.name}
                                    width={144}
                                    height={144}
                                    quality={85}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <ProfileAvatar username={student.name} size={null} className="text-3xl sm:text-4xl lg:text-5xl" />
                            )}
                        </div>
                    </div>

                    {/* TEXT INFO */}
                    <div className="w-full">

                        <h1 className="font-bold text-xl sm:text-2xl lg:text-[var(--text-3xl)] text-[var(--foreground)] mb-1">
                            {student.name}
                        </h1>

                        <div className="flex items-center gap-2 mb-3">
                            <p className="font-mono text-sm sm:text-base text-[var(--text-secondary)]">
                                @{student.username}
                            </p>

                            {canEdit && onEditUsername && (
                                <button
                                    onClick={onEditUsername}
                                    className=" p-1 rounded-lg hover:bg-[var(--accent-primary)]/20 transition text-logo"
                                >
                                    <Edit3 className="w-3 h-3 " />
                                </button>
                            )}
                        </div>

                        {/* METADATA */}
                        <div className="flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-[var(--text-secondary)]">

                            {student.batch && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent-primary)] text-[var(--primary-foreground)]">
                                    <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Batch {student.batch} {student.year && `(${student.year})`}
                                </span>
                            )}

                            {student.city && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--accent-secondary)] text-[var(--secondary-foreground)]">
                                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                    {student.city}
                                </span>
                            )}

                            {/* SHARE STRIP — only visible to the profile owner */}
                            {canEdit && (
                                <div className="flex items-center gap-1.5 ml-1">
                                    <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] select-none">
                                        Share:
                                    </span>
                                    <button
                                        type="button"
                                        onClick={onShareLinkedIn}
                                        aria-label="Share on LinkedIn"
                                        title="Share on LinkedIn"
                                        className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--accent-secondary)] border border-[var(--border)] text-logo hover:bg-logo/15 hover:border-logo/40 transition-all duration-200 hover-glow"
                                    >
                                        <Linkedin className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCopyUrl}
                                        aria-label="Copy profile link"
                                        title="Copy profile link"
                                        className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--accent-secondary)] border border-[var(--border)] text-logo hover:bg-logo/15 hover:border-logo/40 transition-all duration-200 hover-glow"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--muted)] text-[var(--muted-foreground)]">
                                ID: {student.enrollmentId}
                            </span> */}
                        </div>
                    </div>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">

                    {canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onEditProfile}
                            className="w-full sm:w-auto hover-glow justify-center"
                        >
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit Profile
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onShowTopicProgress}
                        className="w-full sm:w-auto hover-glow justify-center"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Topic Progress
                    </Button>
                </div>
            </div>
        </div>
    );
}