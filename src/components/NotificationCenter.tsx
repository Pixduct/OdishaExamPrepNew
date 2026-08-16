import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Clock, Award, FileText, Target, Sparkles, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface NotificationItem {
  id: string;
  type: 'new_exam' | 'new_test' | 'new_bank' | 'scheduled_live' | 'scheduled_upcoming';
  title: string;
  message: string;
  timestamp: string;
  itemData: any;
  actionType: 'exam' | 'test' | 'bank' | 'none';
  isLive?: boolean;
  scheduledAt?: string;
}

interface NotificationCenterProps {
  exams: any[];
  mockTests: any[];
  dynamicQuestionBanks: Record<string, any[]>;
  onViewExam: (examId: string) => void;
  onLaunchMockTest: (test: any) => void;
  onLaunchBank: (bank: any) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  exams = [],
  mockTests = [],
  dynamicQuestionBanks = {},
  onViewExam,
  onLaunchMockTest,
  onLaunchBank,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oep_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [clearedIds, setClearedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('oep_cleared_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save readIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oep_read_notifications', JSON.stringify(readIds));
    } catch (e) {}
  }, [readIds]);

  // Save clearedIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('oep_cleared_notifications', JSON.stringify(clearedIds));
    } catch (e) {}
  }, [clearedIds]);

  // Generate dynamic notification list from active database items
  const notifications = useMemo(() => {
    const list: NotificationItem[] = [];
    const now = Date.now();

    // 1. Mock Tests — both regular and scheduled
    mockTests.forEach((test: any) => {
      let parsedSchedule = null;
      if (test?.seriesId && typeof test.seriesId === 'string' && test.seriesId.startsWith('{')) {
        try { parsedSchedule = JSON.parse(test.seriesId).scheduled_at || JSON.parse(test.seriesId).scheduledAt || null; } catch (e) {}
      }
      const rawScheduled = test?.scheduled_at || test?.scheduledAt || parsedSchedule;
      const hasSchedule = !!rawScheduled;
      const scheduleTime = hasSchedule ? new Date(rawScheduled).getTime() : 0;
      const isScheduleLive = hasSchedule && !isNaN(scheduleTime) && scheduleTime <= now;
      const isScheduleUpcoming = hasSchedule && !isNaN(scheduleTime) && scheduleTime > now;

      if (isScheduleLive) {
        // Test just went live — show a special LIVE NOW alert (pinned at top)
        list.push({
          id: `scheduled_live_${test.id}`,
          type: 'scheduled_live',
          title: test.title || 'Scheduled Test',
          message: 'Your scheduled test is now LIVE — start it before time runs out!',
          timestamp: test.scheduled_at,
          itemData: test,
          actionType: 'test',
          isLive: true,
          scheduledAt: test.scheduled_at,
        });
      } else if (isScheduleUpcoming) {
        // Test is coming soon — inform the student
        const diffMs = scheduleTime - now;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);
        let countdown = '';
        if (diffDays > 0) countdown = `in ${diffDays}d ${diffHrs % 24}h`;
        else if (diffHrs > 0) countdown = `in ${diffHrs}h ${diffMins % 60}m`;
        else countdown = `in ${diffMins}m`;
        list.push({
          id: `scheduled_upcoming_${test.id}`,
          type: 'scheduled_upcoming',
          title: test.title || 'Upcoming Scheduled Test',
          message: `Scheduled test goes live ${countdown}. Be ready!`,
          timestamp: test.scheduled_at,
          itemData: test,
          actionType: 'none',
          isLive: false,
          scheduledAt: test.scheduled_at,
        });
      } else {
        // Regular (no schedule or already live without a special scheduled_at)
        list.push({
          id: `new_test_${test.id}`,
          type: 'new_test',
          title: test.title || 'New Mock Test Available',
          message: 'New mock test has been added to your preparation portal.',
          timestamp: test.created_at || new Date().toISOString(),
          itemData: test,
          actionType: 'test',
        });
      }
    });

    const flatBanks = Object.values(dynamicQuestionBanks).flat();
    // 2. Newly Added Practice Sets
    // Only include banks that are actually live (have questions or PDF materials)
    flatBanks
      .filter((bank: any) => {
        const hasQuestions = (bank.questionCount || bank.questions || bank.practiceQuestionCount || 0) > 0;
        const hasPdfs = Array.isArray(bank.pdfLinks) ? bank.pdfLinks.length > 0 : !!bank.pdfUrl;
        return hasQuestions || hasPdfs;
      })
      .forEach((bank: any) => {
        list.push({
          id: `new_bank_${bank.id}`,
          type: 'new_bank',
          title: bank.title || 'New Topic Practice Set',
          message: 'New practice set is live and ready for practice.',
          timestamp: bank.created_at || bank.scheduled_at || new Date().toISOString(),
          itemData: bank,
          actionType: 'bank',
        });
      });

    // 3. Newly Added Exams (excluding system settings & URL rows)
    const validExams = exams.filter((e: any) => 
      e &&
      e.category !== 'blog' && 
      e.category !== 'system' && 
      !(e.name || '').startsWith('SYSTEM_SETTINGS_') && 
      !(e.name || '').startsWith('http')
    );

    validExams.forEach((exam: any) => {
      list.push({
        id: `new_exam_${exam.id}`,
        type: 'new_exam',
        title: exam.name || 'New Exam Portal Added',
        message: 'New exam module is now live with test series.',
        timestamp: exam.created_at || new Date().toISOString(),
        itemData: exam,
        actionType: 'exam',
      });
    });

    // Sort: LIVE scheduled tests always pinned first, then rest by timestamp descending
    const liveItems = list.filter(n => n.type === 'scheduled_live');
    const otherItems = list
      .filter(n => n.type !== 'scheduled_live')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return [...liveItems, ...otherItems];
  }, [exams, mockTests, dynamicQuestionBanks]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => !clearedIds.includes(n.id));
  }, [notifications, clearedIds]);

  const unreadCount = useMemo(() => {
    return visibleNotifications.filter(n => !readIds.includes(n.id)).length;
  }, [visibleNotifications, readIds]);

  const markAllAsRead = () => {
    const allIds = visibleNotifications.map(n => n.id);
    setReadIds(prev => Array.from(new Set([...prev, ...allIds])));
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    setClearedIds(allIds);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (item.actionType === 'none') return; // Upcoming (not yet live) — no action
    if (!readIds.includes(item.id)) {
      setReadIds(prev => [...prev, item.id]);
    }
    setIsOpen(false);

    if (item.actionType === 'exam') {
      onViewExam(item.itemData.id);
    } else if (item.actionType === 'test') {
      onLaunchMockTest(item.itemData);
    } else if (item.actionType === 'bank') {
      const bank = item.itemData;
      // Safety guard: only open the modal if the bank has actual content to show.
      const hasQuestions = (bank.questionCount || bank.questions || bank.practiceQuestionCount || 0) > 0;
      const hasPdfs = Array.isArray(bank.pdfLinks) ? bank.pdfLinks.length > 0 : !!bank.pdfUrl;
      if (!hasQuestions && !hasPdfs) return;
      onLaunchBank(bank);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-brand-600 hover:bg-slate-100/80 transition-all duration-200 cursor-pointer group"
        title="Notifications & Live Release Alerts"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Popover Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismiss */}
            <div className="fixed inset-0 z-[140]" onClick={() => setIsOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-3xl shadow-[0_20px_50px_rgba(12,35,64,0.15)] dark:shadow-slate-950/80 border border-white/60 dark:border-slate-700/60 overflow-hidden z-[150] premium-shadow"
            >
              {/* Header Bar */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-black text-rose-700 bg-rose-100 rounded-full border border-rose-200 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-extrabold text-brand-600 hover:text-brand-800 flex items-center gap-0.5 cursor-pointer"
                      title="Mark all notifications as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark read
                    </button>
                  )}
                  {visibleNotifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] font-extrabold text-slate-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer border-l border-slate-200 pl-2"
                      title="Clear all notifications"
                    >
                      <X className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* List Content */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/60 premium-scrollbar scroll-smooth overscroll-contain [transform:translate3d(0,0,0)] [backface-visibility:hidden] [-webkit-overflow-scrolling:touch]" data-lenis-prevent>
                {visibleNotifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2 py-14">
                    <Sparkles className="w-8 h-8 text-brand-500/60 mx-auto animate-bounce" />
                    <h5 className="text-xs font-black text-slate-800">You're all caught up!</h5>
                    <p className="text-[10px] font-semibold text-slate-400">No new content notifications at the moment.</p>
                  </div>
                ) : (
                  visibleNotifications.map(item => {
                    const isRead = readIds.includes(item.id);
                    const isLiveNow = item.type === 'scheduled_live';
                    const isUpcoming = item.type === 'scheduled_upcoming';
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className={cn(
                          "p-3.5 flex items-start gap-3.5 group transition-all duration-300 border-l-2 border-b border-b-slate-100/40",
                          isLiveNow
                            ? "bg-amber-50/60 hover:bg-amber-50 border-l-amber-500 cursor-pointer"
                            : isUpcoming
                              ? "bg-slate-50/50 border-l-slate-200 cursor-default opacity-80"
                              : isRead
                                ? "bg-transparent hover:bg-white/40 border-l-transparent hover:border-l-brand-500/40 cursor-pointer"
                                : "bg-brand-500/[0.02] hover:bg-brand-500/[0.05] border-l-brand-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] cursor-pointer"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white mt-0.5 transition-all duration-350",
                            isLiveNow
                              ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/25 animate-pulse"
                              : isUpcoming
                                ? "bg-gradient-to-br from-slate-400 to-slate-500 shadow-sm"
                                : item.type === 'new_exam'
                                  ? "bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/15"
                                  : item.type === 'new_test'
                                    ? "bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/15"
                                    : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/15"
                          )}
                        >
                          {(isLiveNow || isUpcoming) ? (
                            <Clock className="w-4 h-4" />
                          ) : item.type === 'new_exam' ? (
                            <Award className="w-4 h-4" />
                          ) : item.type === 'new_test' ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <Target className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h5 className={cn(
                              "font-extrabold text-xs truncate transition-colors",
                              isLiveNow ? "text-amber-900 group-hover:text-amber-700" : "text-slate-900 group-hover:text-brand-600"
                            )}>
                              {item.title}
                            </h5>
                            {isLiveNow ? (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase tracking-wide shrink-0 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                LIVE
                              </span>
                            ) : isUpcoming ? (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black rounded uppercase tracking-wide shrink-0">
                                SOON
                              </span>
                            ) : !isRead ? (
                              <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 animate-pulse" />
                            ) : null}
                          </div>
                          <p className={cn(
                            "text-[11px] font-semibold leading-snug line-clamp-2 transition-colors",
                            isLiveNow ? "text-amber-700 group-hover:text-amber-800" : "text-slate-500 group-hover:text-slate-600"
                          )}>
                            {item.message}
                          </p>
                        </div>

                        {!isUpcoming && (
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-white/50 border-t border-slate-100/80 text-center backdrop-blur-xs">
                <p className="text-[10px] font-extrabold text-slate-400">
                  Daily content updates & live release alerts
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
