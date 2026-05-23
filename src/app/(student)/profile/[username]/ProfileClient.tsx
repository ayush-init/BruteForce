"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { studentProfileService } from '@/services/student/profile.service';
import { studentAuthService } from '@/services/student/auth.service';
import { Button } from '@/components/ui/button';
import { ProfileDataState, CurrentUserState, ApiError } from '@/types/student/index.types';
import { EditProfileModal } from '@/components/student/profile/EditProfileModal';
import { EditUsernameModal } from '@/components/student/profile/EditUsernameModal';
import { DeleteImageModal } from '@/components/student/profile/DeleteImageModal';
import { ProfilePageShimmer } from '@/components/student/profile/shimmers';
import { ProfileHeader } from '@/components/student/profile/ProfileHeader';
import { ProfileNotFound } from '@/components/student/profile/ProfileNotFound';
import { ProfileErrorState } from '@/components/student/profile/ProfileErrorState';
import { OverviewStats } from '@/components/student/profile/OverviewStats';
import { ProfileInfo } from '@/components/student/profile/ProfileInfo';
import { SocialLinks } from '@/components/student/profile/SocialLinks';
import { ProblemSolvingStats } from '@/components/student/profile/ProblemSolvingStats';
import ActivityHeatmap from '@/components/student/profile/ActivityHeatmap';
import { RecentActivity } from '@/components/student/profile/RecentActivity';
import TopicProgressModal from '@/components/student/topics/TopicProgressModal';
import { showSuccess } from '@/ui/toast';
import { getErrorMessage } from '@/errors';
import { useCanEditProfile } from '@/hooks/useCanEditProfile';
import { useQueryClient } from '@tanstack/react-query';
import { ImageCropModal } from '@/components/ui/ImageCropModal';

interface ProfileClientProps {
  username: string;
  initialData?: ProfileDataState;
}

export default function ProfileClient({ username, initialData }: ProfileClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState<ProfileDataState>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUsernameEditModal, setShowUsernameEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    github: '',
    linkedin: '',
    leetcode: '',
    gfg: ''
  });

  const [originalEditForm, setOriginalEditForm] = useState({
    name: '',
    github: '',
    linkedin: '',
    leetcode: '',
    gfg: ''
  });

  const [usernameForm, setUsernameForm] = useState({
    username: ''
  });
  const [currentUser, setCurrentUser] = useState<CurrentUserState | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const canEdit = useCanEditProfile({
    authChecked,
    currentUser,
    profileStudent: profileData?.student,
  });
  const [showTopicProgressModal, setShowTopicProgressModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isFetching = useRef(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);

  useEffect(() => {
    const initializeProfile = async () => {
      // Populate edit form from SSR data synchronously
      if (initialData?.student) {
        const formValues = {
          name: initialData.student.name || '',
          github: initialData.student.github || '',
          linkedin: initialData.student.linkedin || '',
          leetcode: initialData.student.leetcode || '',
          gfg: initialData.student.gfg || ''
        };
        setEditForm(formValues);
        setOriginalEditForm(formValues);
      }

      const { isStudentToken } = await import('@/lib/auth-utils');
      const isStudent = isStudentToken();

      // Run profile fetch and current-user fetch in parallel instead of sequentially
      const profilePromise = initialData
        ? Promise.resolve()
        : fetchProfileByUsername();

      const userPromise = isStudent
        ? fetchCurrentUser().catch(() => {
          setCurrentUser(null);
          setAuthChecked(true);
        })
        : (() => {
          setCurrentUser(null);
          setAuthChecked(true);
          return Promise.resolve();
        })();

      await Promise.all([profilePromise, userPromise]);
    };
    initializeProfile();
  }, [username]);

  const fetchCurrentUser = async () => {
    try {
      const user = await studentAuthService.getCurrentStudent().catch((e: unknown) => {
        console.error("Failed to fetch current user", e);
        const error = e as { response?: { data?: unknown; status?: number } };
        console.error("Error details:", error.response?.data, error.response?.status);
        return null;
      });
      setCurrentUser(user);
      if (user?.error === "Access denied. Students only.") {
        setCurrentUser(null);
        return;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === "Access denied. Students only.") {
          setCurrentUser(null);
          return;
        }
      }
    } finally {
      setAuthChecked(true);
    }
  };

  const fetchProfileByUsername = async () => {
    if (!username) return;
    if (isFetching.current) return;
    setLoading(true);
    setProfileError(null);
    isFetching.current = true;
    try {
      const data = await studentProfileService.getProfileByUsername(username);
      setProfileData(data);
      const formValues = {
        name: data?.student?.name || '',
        github: data?.student?.github || '',
        linkedin: data?.student?.linkedin || '',
        leetcode: data?.student?.leetcode || '',
        gfg: data?.student?.gfg || ''
      };
      setEditForm(formValues);
      setOriginalEditForm(formValues);
      setUsernameForm({
        username: data?.student?.username || ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      setImageRemoved(false);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, { context: 'fetchProfileByUsername' });
      const apiError = err as ApiError;
      const isStudentNotFoundError =
        apiError?.response?.status === 404 ||
        (err as { code?: string })?.code === 'STUDENT_PROFILE_NOT_FOUND' ||
        errorMessage === "Student not found";
      setProfileError(errorMessage);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!canEdit) return;
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) return;
    // Open crop modal instead of using file directly
    setPendingCropFile(file);
  };

  const handleCropComplete = (blob: Blob) => {
    const croppedFile = new File([blob], pendingCropFile?.name ?? 'profile.jpg', { type: 'image/jpeg' });
    setSelectedImage(croppedFile);
    setImagePreview(URL.createObjectURL(blob));
    setImageRemoved(false);
    setPendingCropFile(null);
  };

  const handleCropCancel = () => setPendingCropFile(null);

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      const needsImageUpload = selectedImage !== null;
      const needsImageDelete = imageRemoved;
      const needsProfileUpdate =
        editForm.github !== originalEditForm.github ||
        editForm.linkedin !== originalEditForm.linkedin;
      if (needsImageUpload) {
        await studentProfileService.updateProfileImage(selectedImage);
      }
      if (needsImageDelete) {
        await studentProfileService.deleteProfileImage();
      }
      if (needsProfileUpdate) {
        await studentProfileService.updateProfileDetails({
          github: editForm.github,
          linkedin: editForm.linkedin
        });
      }
      await fetchProfileByUsername();
      setShowEditModal(false);
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      queryClient.invalidateQueries({ queryKey: ['currentStudent'] });
      showSuccess('Profile Updated', 'Your profile changes have been saved.');
    } catch (error) {
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveUsername = async () => {
    try {
      if (!usernameForm.username.trim()) {
        return;
      }
      const localStorageToken = localStorage.getItem('accessToken');
      const cookieToken = document.cookie.split('; ').find(row => row.startsWith('accessToken='))?.split('=')[1];
      const token = localStorageToken || cookieToken;
      if (!token) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        return;
      }
      const newUsername = usernameForm.username.trim();
      await studentProfileService.updateUsername(newUsername);

      // Update local state immediately to prevent "username not found" flash
      setCurrentUser(prev => prev ? { ...prev, username: newUsername } : null);
      setProfileData(prev => prev ? { ...prev, student: { ...prev.student, username: newUsername } } : null);
      setUsernameForm({ username: newUsername });

      setShowUsernameEditModal(false);
      window.dispatchEvent(new CustomEvent('profileUpdated'));

      if (newUsername !== username) {
        router.push(`/profile/${newUsername}`);
      }
      showSuccess('Username Updated', 'Your username has been changed. Redirecting to your new profile...');
    } catch (error: unknown) {
    }
  };

  const handleDeleteImage = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteImage = () => {
    if (!canEdit) {
      setShowDeleteConfirm(false);
      return;
    }
    setImageRemoved(true);
    setImagePreview(null);
    setSelectedImage(null);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return <ProfilePageShimmer />;
  }

  if (profileError && !profileError.includes("Student not found")) {
    return <ProfileErrorState error={profileError} />;
  }

  if (!profileData || !profileData.student) {
    return <ProfileNotFound username={username || undefined} error={profileError || undefined} />;
  }

  const { student, codingStats, streak, leaderboard, recentActivity, heatmap, heatmapStartMonth } = profileData || {
    student: {},
    codingStats: {},
    streak: {},
    leaderboard: {},
    recentActivity: [],
    heatmap: [],
    heatmapStartMonth: undefined
  };

  const handleShareLinkedIn = async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';
    const total = codingStats?.totalSolved ?? 0;
    const easy = codingStats?.easy?.solved ?? 0;
    const medium = codingStats?.medium?.solved ?? 0;
    const hard = codingStats?.hard?.solved ?? 0;
    const globalRank = leaderboard?.globalRank;
    const cityRank = leaderboard?.cityRank;
    const city = student.city;

    // LinkedIn doesn't support markdown, so we use Unicode Mathematical Sans-Serif Bold
    // characters to fake bold text. This is a widely-used LinkedIn formatting trick.
    const toBold = (str: string) =>
      str
        .split('')
        .map((ch) => {
          const code = ch.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1d5d4 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1d5ee + (code - 97));
          if (code >= 48 && code <= 57) return String.fromCodePoint(0x1d7ec + (code - 48));
          return ch;
        })
        .join('');

    const rankParts: string[] = [];
    if (globalRank) rankParts.push(`#${globalRank} globally`);
    if (cityRank) rankParts.push(`#${cityRank} ${city ? `in ${city}` : 'in my city'}`);

    const lines: string[] = [];

    lines.push(`${toBold(`Just crossed a meaningful milestone on BruteForce`)}, my college's DSA practice platform.`);
    lines.push(``);
    lines.push(`${toBold(`${total} problems solved`)} so far:`);
    lines.push(``);
    lines.push(`→ ${easy} Easy`);
    lines.push(`→ ${medium} Medium`);
    lines.push(`→ ${hard} Hard`);

    if (rankParts.length) {
      lines.push(``);
      lines.push(`${toBold('Ranking:')} ${rankParts.join(' and ')}.`);
    }

    lines.push(``);
    lines.push(`${toBold('The number is not the point.')} The real shift is in how you start thinking:`);
    lines.push(``);
    lines.push(`→ You recognize patterns where you used to see chaos`);
    lines.push(`→ You debug faster and write cleaner code`);
    lines.push(`→ You ask better questions before you start coding`);
    lines.push(`→ You stop fearing the hard ones`);
    lines.push(``);
    lines.push(`${toBold('Consistency over intensity.')} One problem a day, even on the busy ones.`);
    lines.push(``);
    lines.push(`If you are early in your DSA journey, here is what has worked for me:`);
    lines.push(``);
    lines.push(`→ Pick one platform and stay loyal`);
    lines.push(`→ Show up every single day`);
    lines.push(`→ Never skip the hard ones`);
    lines.push(`→ Revisit old problems after a week`);
    lines.push(``);
    lines.push(`Still a long way to go.`);
    lines.push(``);
    lines.push(`My profile: ${profileUrl}`);
    lines.push(``);
    lines.push(`#DSA #DataStructures #Algorithms #Coding #BruteForce #pwioi`);
    const text = lines.join('\n');

    // LinkedIn's undocumented /feed/?shareActive=true&text= endpoint opens the
    // share composer with the text already prefilled (when the user is logged in).
    // Also copy to clipboard as a fallback if LinkedIn ignores the param.
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* clipboard failure is non-fatal */
    }
    const shareUrl = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    showSuccess('Opening LinkedIn', 'Your post is ready to share.');
  };

  return (
    <div className="w-full max-w-325 xl:max-w-275 2xl:max-w-325  mx-auto pb-16 mt-3">

      {/* PROFILE HEADER */}


      <ProfileHeader
        student={student}
        canEdit={canEdit}
        onEditProfile={() => setShowEditModal(true)}
        onShowTopicProgress={() => setShowTopicProgressModal(true)}
        onEditUsername={() => setShowUsernameEditModal(true)}
        onShareLinkedIn={handleShareLinkedIn}
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <OverviewStats
            leaderboard={leaderboard}
            streak={streak}
          />
          <ProfileInfo student={student} />
          <SocialLinks
            student={student}
            canEdit={canEdit}
            onEditSocialLinks={() => setShowEditModal(true)}
          />
        </div>
        <div className="lg:col-span-3 space-y-4">
          <ProblemSolvingStats codingStats={codingStats} />
          <ActivityHeatmap
            heatmap={heatmap || []}
            currentStreak={streak?.currentStreak}
            maxStreak={streak?.maxStreak}
          />
          <RecentActivity recentActivity={recentActivity} />
        </div>
      </div>
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        student={student}
        editForm={editForm}
        setEditForm={setEditForm}
        uploading={uploading}
        savingProfile={savingProfile}
        fileInputRef={fileInputRef}
        handleImageUpload={handleImageUpload}
        handleDeleteImage={handleDeleteImage}
        handleSaveProfile={handleSaveProfile}
        imagePreview={imagePreview}
        imageRemoved={imageRemoved}
      />

      <ImageCropModal
        file={pendingCropFile}
        onCrop={handleCropComplete}
        onClose={handleCropCancel}
        aspectRatio={1}
        cropShape="round"
        title="Crop Profile Photo"
      />

      <EditUsernameModal
        isOpen={showUsernameEditModal}
        onClose={() => setShowUsernameEditModal(false)}
        usernameForm={usernameForm}
        setUsernameForm={setUsernameForm}
        handleSaveUsername={handleSaveUsername}
        currentUsername={currentUser?.username}
      />

      <TopicProgressModal
        isOpen={showTopicProgressModal}
        onClose={() => setShowTopicProgressModal(false)}
        username={username}
      />

      {/* Delete Image Confirmation Dialog */}
      <DeleteImageModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDeleteImage}
        uploading={uploading}
      />
    </div>
  );
}