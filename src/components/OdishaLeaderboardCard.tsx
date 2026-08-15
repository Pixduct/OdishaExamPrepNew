import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Flame, Target, ChevronDown, ShieldCheck, MapPin, Zap, Award, Target as TargetIcon, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import {
  getUserXpState,
  getOdishaLeaderboard,
  UserXpState,
  StudentRankEntry
} from '../lib/xpManager';
import {
  getUserDistrict,
  setUserDistrict,
  getUserStudentName,
  setUserStudentName,
  ALL_30_ODISHA_DISTRICTS
} from '../lib/profileManager';

import { DynamicVectorCard } from './DynamicVectorCard';

interface OdishaLeaderboardCardProps {
  userId?: string;
}

export const OdishaLeaderboardCard: React.FC<OdishaLeaderboardCardProps> = ({ userId }) => {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'allTime'>('weekly');
  const [xpState, setXpState] = useState<UserXpState>(() => getUserXpState(userId, user));
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(() => getUserDistrict());
  const [districtSearch, setDistrictSearch] = useState('');

  useEffect(() => {
    setXpState(getUserXpState(userId, user));
  }, [userId, user]);

  useEffect(() => {
    const handleUpdate = () => {
      setXpState(getUserXpState(userId, user));
      setSelectedDistrict(getUserDistrict());
    };
    window.addEventListener('oep-activity-logged', handleUpdate);
    window.addEventListener('oep-streak-updated', handleUpdate);
    window.addEventListener('oep-study-plan-updated', handleUpdate);
    window.addEventListener('oep-profile-updated', handleUpdate);

    return () => {
      window.removeEventListener('oep-activity-logged', handleUpdate);
      window.removeEventListener('oep-streak-updated', handleUpdate);
      window.removeEventListener('oep-study-plan-updated', handleUpdate);
      window.removeEventListener('oep-profile-updated', handleUpdate);
    };
  }, [userId, user]);

  const { podium, rankList, userEntry, nearbyBracket, resetNotice } = getOdishaLeaderboard(userId, timeFilter, 'All Odisha', user);
  const { currentLeague, xpProgressPct, xpToNextTier, totalXp, userRank, percentileText, accuracyPct } = xpState;

  const handleSelectDistrict = (dist: string) => {
    setUserDistrict(dist);
    setSelectedDistrict(dist);
    setIsDistrictModalOpen(false);
  };

  const filteredDistricts = ALL_30_ODISHA_DISTRICTS.filter(d =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const getMobileDisplayName = (fullName: string) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  const getMobileDistrictName = (district: string) => {
    if (!district) return '';
    return district.split(' ')[0].replace(/,/g, '');
  };

  return (
    <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.15)" className="mb-6 sm:mb-8">
      <div className="p-5 sm:p-7 text-slate-900 dark:text-white rounded-[2.2rem] bg-gradient-to-br from-white via-blue-50/60 to-indigo-50/80 dark:bg-slate-900 border border-blue-200/80 dark:border-slate-800 shadow-xl shadow-blue-500/10 dark:shadow-none space-y-4 sm:space-y-5 relative overflow-hidden">
        {/* Radial Grid & Floating Watermark Icon */}
        <div className="absolute inset-0 bg-[radial-gradient(#0284c7_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.07] dark:opacity-10 pointer-events-none z-0" />
        <Trophy className="absolute -right-8 -bottom-8 w-52 h-52 opacity-10 dark:opacity-15 stroke-[1.2] text-blue-500 dark:text-amber-300 pointer-events-none transition-transform duration-700 hover:scale-110 hover:rotate-6 z-0" />

        {/* Top Header Bar (Inline on Mobile & Desktop) */}
        <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 border border-blue-300/40 font-black">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight block uppercase">
              <span className="sm:hidden">Odisha Rank & Leagues</span>
              <span className="hidden sm:inline truncate">Odisha Rank & Student Leagues</span>
            </h3>
            <p className="text-slate-600 dark:text-white/80 text-[10px] sm:text-xs font-medium truncate hidden sm:block">
              Earn effort XP points, unlock league tiers, and compete among 18,500 Odisha aspirants
            </p>
          </div>
        </div>

        {/* Current League Badge (Compact Inline) */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${currentLeague.badgeBg} ${currentLeague.badgeBorder} ${currentLeague.badgeTextColor} shrink-0 font-mono shadow-2xs backdrop-blur-md`}>
          <span>{currentLeague.badgeIcon}</span>
          <span className="truncate">{currentLeague.name}</span>
        </div>
      </div>

      {/* Pinned Student Dynamic Rank & League Progress Hero Banner (Mobile-Optimized Layout) */}
      <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 dark:bg-slate-800 dark:from-slate-800 dark:to-slate-800 text-white shadow-md relative overflow-hidden space-y-3">
        <div className="absolute right-0 top-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
          {/* User Dynamic State Rank Details */}
          <div className="flex items-center gap-3">
            {(() => {
              const rankStr = `#${userEntry.rank.toLocaleString()}`;
              const fontClass = rankStr.length > 6 ? 'text-[10px] sm:text-xs' : rankStr.length > 4 ? 'text-xs sm:text-sm' : 'text-sm sm:text-lg';
              return (
                <div className="min-w-[3.5rem] sm:min-w-[4rem] w-auto h-12 sm:h-14 px-2 py-1 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black flex flex-col items-center justify-center font-mono shadow-xs shrink-0 leading-none">
                  <span className="text-[9px] sm:text-[10px] uppercase font-sans tracking-wider opacity-75 pb-0.5">Rank</span>
                  <span className={`${fontClass} font-black tracking-tight`}>{rankStr}</span>
                </div>
              );
            })()}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-600 border border-amber-300 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center shrink-0 overflow-hidden">
                    {userEntry.avatarUrl ? (
                      <img src={userEntry.avatarUrl} alt={userEntry.name} className="w-full h-full object-cover" />
                    ) : (
                      userEntry.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="font-extrabold text-xs sm:text-base text-white truncate">{userEntry.name}</span>
                </div>

                {/* Interactive District Badge */}
                <button
                  type="button"
                  onClick={() => setIsDistrictModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 px-2 py-0.5 rounded border border-amber-400/30 transition-all cursor-pointer group shrink-0"
                  title="Click to set your exact Odisha district"
                >
                  <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[110px] sm:max-w-none">{userEntry.district}</span>
                  <Edit2 className="w-2 h-2 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                </button>
              </div>

              <p className="text-[10px] sm:text-xs text-amber-300 font-mono font-bold pt-0.5 leading-snug">
                <span className="sm:hidden">Top {percentileText.replace('in Odisha', '').trim()} • Acc: {accuracyPct}%</span>
                <span className="hidden sm:inline">{percentileText} • Acc: {accuracyPct}%</span>
              </p>
              <span className="text-[9px] sm:text-[10px] text-slate-200 dark:text-slate-300 font-medium block pt-0.5 truncate">
                {timeFilter === 'daily' ? 'Today' : timeFilter === 'weekly' ? 'Weekly' : 'Total'}: <strong className="text-white font-bold">{userEntry.xp.toLocaleString()} XP</strong> • {userEntry.streakDays} Day Streak 🔥
              </span>
            </div>
          </div>

          {/* League Tier Progress Bar (Compact Mobile Width) */}
          <div className="w-full md:w-64 space-y-1 bg-white/15 dark:bg-slate-800/80 p-2.5 sm:p-3 rounded-xl border border-white/25 dark:border-slate-700/70 shrink-0 text-white">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-white dark:text-slate-200">
              <span>{currentLeague.name}</span>
              <span className="text-amber-300 dark:text-amber-400 font-mono">{xpProgressPct}%</span>
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-black/20 dark:bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/20 dark:border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-500"
                style={{ width: `${xpProgressPct}%` }}
              />
            </div>
            {currentLeague.nextTierName && (
              <span className="text-[9px] sm:text-[10px] text-white/80 dark:text-slate-400 font-medium block text-right truncate">
                Need {xpToNextTier.toLocaleString()} XP for {currentLeague.nextTierName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Integrated Inline Filter Toolbar (Single Row on Mobile) */}
      <div className="space-y-2 pt-1 relative z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Time Reset Tabs */}
          <div className="flex items-center bg-slate-200/80 dark:bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-300/80 dark:border-slate-700/80 shrink-0">
            <button
              type="button"
              onClick={() => setTimeFilter('daily')}
              className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                timeFilter === 'daily'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:from-amber-400 dark:to-yellow-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('weekly')}
              className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                timeFilter === 'weekly'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:from-amber-400 dark:to-yellow-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('allTime')}
              className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black transition-all cursor-pointer ${
                timeFilter === 'allTime'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white dark:from-amber-400 dark:to-yellow-400 dark:text-slate-950 shadow-sm'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All-Time
            </button>
          </div>

          {/* All Odisha State Leaderboard Badge */}
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] sm:text-xs font-black text-slate-800 dark:text-white bg-white/80 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/90 shrink-0 font-mono shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
            <span>All Odisha</span>
          </div>
        </div>

        {/* Reset Notice Subtext */}
        <p className="text-xs font-semibold text-blue-700 dark:text-amber-200/90 pl-0.5 leading-snug">
          <span className="sm:hidden">{resetNotice.replace('at 00:00 AM', '').replace('practice sprint', 'sprint')}</span>
          <span className="hidden sm:inline">{resetNotice}</span>
        </p>
      </div>

      {/* Top 3 Visual Podium (Mobile-Optimized Cards) */}
      {podium.length >= 3 && (
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 pt-1 pb-1 items-end text-center relative z-10">
          {/* 2nd Place (Silver) */}
          <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white space-y-0.5 relative shadow-xs">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-base sm:text-xl">🥈</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 mx-auto rounded-full bg-slate-300 text-slate-800 font-bold text-[10px] sm:text-xs flex items-center justify-center border-2 border-white shadow-2xs overflow-hidden">
              {podium[1].avatarUrl ? (
                <img src={podium[1].avatarUrl} alt={podium[1].name} className="w-full h-full object-cover" />
              ) : (
                podium[1].name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="font-black text-slate-900 dark:text-white text-[11px] sm:text-sm block pt-0.5 leading-tight">
              <span className="sm:hidden">{getMobileDisplayName(podium[1].name)}</span>
              <span className="hidden sm:inline truncate block">{podium[1].name}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300 font-medium block truncate">{podium[1].district.split(' ')[0]}</span>
            <span className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-mono font-black text-[10px] sm:text-xs border border-slate-200 dark:border-slate-700">
              {podium[1].xp.toLocaleString()}
            </span>
          </div>

          {/* 1st Place (Gold Podium - Elevated) */}
          <div className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-amber-100/80 via-amber-50/50 to-white dark:from-amber-500/20 dark:via-amber-600/10 dark:to-slate-900 border-2 border-amber-400 space-y-0.5 relative -mt-2 shadow-md shadow-amber-500/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg sm:text-2xl">👑</span>
            <div className="w-8 h-8 sm:w-12 sm:h-12 mx-auto rounded-full bg-amber-400 text-amber-950 font-black text-xs sm:text-sm flex items-center justify-center border-2 border-white shadow-2xs overflow-hidden">
              {podium[0].avatarUrl ? (
                <img src={podium[0].avatarUrl} alt={podium[0].name} className="w-full h-full object-cover" />
              ) : (
                podium[0].name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="font-black text-slate-900 dark:text-white text-[11px] sm:text-sm block pt-0.5 leading-tight">
              <span className="sm:hidden">{getMobileDisplayName(podium[0].name)}</span>
              <span className="hidden sm:inline truncate block">{podium[0].name}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-300 font-bold block truncate">{podium[0].district.split(' ')[0]}</span>
            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-black text-[10px] sm:text-xs shadow-2xs">
              {podium[0].xp.toLocaleString()}
            </span>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white space-y-0.5 relative shadow-xs">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-base sm:text-xl">🥉</span>
            <div className="w-7 h-7 sm:w-10 sm:h-10 mx-auto rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] sm:text-xs flex items-center justify-center border-2 border-white shadow-2xs overflow-hidden">
              {podium[2].avatarUrl ? (
                <img src={podium[2].avatarUrl} alt={podium[2].name} className="w-full h-full object-cover" />
              ) : (
                podium[2].name.charAt(0).toUpperCase()
              )}
            </div>
            <span className="font-black text-slate-900 dark:text-white text-[11px] sm:text-sm block pt-0.5 leading-tight">
              <span className="sm:hidden">{getMobileDisplayName(podium[2].name)}</span>
              <span className="hidden sm:inline truncate block">{podium[2].name}</span>
            </span>
            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300 font-medium block truncate">{podium[2].district.split(' ')[0]}</span>
            <span className="inline-block px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-slate-950 text-amber-900 dark:text-amber-300 font-mono font-black text-[10px] sm:text-xs border border-amber-200 dark:border-slate-700">
              {podium[2].xp.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Master State Toppers List */}
      <div className="space-y-2 pt-1 relative z-10">
        <h4 className="text-[10px] sm:text-xs font-black text-blue-700 dark:text-amber-300 uppercase tracking-wider pl-0.5">
          {timeFilter === 'daily' ? "Today's Active Daily Toppers" : timeFilter === 'weekly' ? 'Weekly Sprint Leaders' : 'All-Time Master State Toppers'}
        </h4>
        {rankList.map((entry) => (
          <div
            key={entry.userId}
            className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              entry.isCurrentUser
                ? 'bg-blue-50 dark:bg-amber-400/20 border-blue-300 dark:border-amber-400/60 text-slate-900 dark:text-white font-bold ring-1 ring-blue-300 dark:ring-amber-400/30'
                : 'bg-white/90 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/70 hover:bg-white dark:hover:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
            }`}
          >
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
              <span className="w-7 sm:w-8 font-mono font-black text-blue-600 dark:text-amber-400 text-left shrink-0 text-[11px] sm:text-xs">#{entry.rank}</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${entry.avatarBg} text-white font-bold flex items-center justify-center shrink-0 text-xs overflow-hidden`}>
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                ) : (
                  entry.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 pr-1">
                <span className="font-bold text-slate-900 dark:text-white block truncate text-xs">{entry.name}</span>
                <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300 font-medium block truncate">
                  <span className="sm:hidden">{getMobileDistrictName(entry.district)} • {entry.league}</span>
                  <span className="hidden sm:inline">{entry.district} • {entry.league}</span>
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-slate-700 text-blue-700 dark:text-amber-300 font-mono font-black text-[10px] sm:text-xs shrink-0 shadow-2xs">
              {entry.xp.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>

      {/* Your Nearby Rivals Bracket (Shown if student rank > #10) */}
      {userEntry.rank > 10 && nearbyBracket.length > 0 && (
        <div className="space-y-1.5 pt-2.5 border-t border-blue-200/60 dark:border-slate-700/80 relative z-10">
          <div className="flex items-center justify-between pl-0.5">
            <h4 className="text-[10px] sm:text-xs font-black text-blue-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <TargetIcon className="w-3.5 h-3.5 text-blue-600 dark:text-amber-400" />
              <span>Nearby Rivals (Rank #{Math.max(11, userEntry.rank - 2)} to #{userEntry.rank + 2})</span>
            </h4>
            <span className="text-[9px] text-blue-600 dark:text-amber-200/90 font-bold hidden sm:inline">Overtake +20 XP to jump rank!</span>
          </div>

          {nearbyBracket.map((entry) => (
            <div
              key={entry.userId}
              className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                entry.isCurrentUser
                  ? 'bg-blue-100/70 dark:bg-amber-400/25 border-blue-300 dark:border-amber-400/70 text-slate-900 dark:text-white font-black'
                  : 'bg-white/90 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/70 text-slate-900 dark:text-white shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                <span className={`w-14 sm:w-16 font-mono font-black text-left shrink-0 text-[10px] sm:text-xs ${entry.isCurrentUser ? 'text-blue-700 dark:text-amber-300 text-xs sm:text-sm font-extrabold' : 'text-blue-600 dark:text-amber-400'}`}>
                  #{entry.rank.toLocaleString()}
                </span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${entry.avatarBg} text-white font-bold flex items-center justify-center shrink-0 text-xs overflow-hidden`}>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 pr-1">
                  <span className={`font-bold block truncate text-xs ${entry.isCurrentUser ? 'text-slate-950 dark:text-white font-black' : 'text-slate-900 dark:text-white'}`}>
                    {entry.isCurrentUser ? `👉 ${entry.name} (You)` : entry.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300 font-medium block truncate">
                    <span className="sm:hidden">{getMobileDistrictName(entry.district)} • Acc: {entry.accuracyPct}%</span>
                    <span className="hidden sm:inline">{entry.district} • Acc: {entry.accuracyPct}%</span>
                  </span>
                </div>
              </div>

              <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border font-mono font-black text-[10px] sm:text-xs shrink-0 ${
                entry.isCurrentUser ? 'bg-blue-600 text-white border-blue-500 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-300 shadow-xs' : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-slate-900 dark:text-amber-300 dark:border-slate-700'
              }`}>
                {entry.xp.toLocaleString()} XP
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Interactive Select Your Odisha District Modal */}
      <AnimatePresence>
        {isDistrictModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 max-h-[85vh] flex flex-col text-slate-900 dark:text-white"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="p-1.5 sm:p-2 bg-rose-50 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/30 shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">Select Your Odisha District</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">Pick from all 30 districts of Odisha</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDistrictModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* District Search Bar */}
              <input
                type="text"
                placeholder="Search district (e.g. Cuttack, Ganjam...)"
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="w-full px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />

              {/* District List Grid */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-1.5 max-h-[50vh]">
                {filteredDistricts.map((dist) => {
                  const isSelected = selectedDistrict === dist;
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleSelectDistrict(dist)}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs font-bold text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-400 dark:border-amber-500/40 text-amber-950 dark:text-amber-300 shadow-2xs font-extrabold'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span>📍</span>
                        <span className="truncate">{dist}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600 stroke-[3] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </DynamicVectorCard>
  );
};
