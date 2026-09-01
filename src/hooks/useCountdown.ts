import { useState, useEffect } from 'react';

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
  formattedCountdown: string;
  formattedScheduledDate: string;
}

// Global subscribers set for items with active upcoming schedules
type Subscriber = () => void;
const subscribers = new Set<Subscriber>();
let globalTimer: ReturnType<typeof setInterval> | null = null;

function subscribe(callback: Subscriber) {
  subscribers.add(callback);
  if (!globalTimer && subscribers.size > 0) {
    globalTimer = setInterval(() => {
      subscribers.forEach(cb => cb());
    }, 1000);
  }
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && globalTimer) {
      clearInterval(globalTimer);
      globalTimer = null;
    }
  };
}

function computeCountdown(scheduledAt?: string | null): CountdownState {
  if (!scheduledAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLive: true,
      formattedCountdown: '',
      formattedScheduledDate: '',
    };
  }

  const target = new Date(scheduledAt).getTime();
  if (isNaN(target)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLive: true,
      formattedCountdown: '',
      formattedScheduledDate: '',
    };
  }

  const now = Date.now();
  const diff = target - now;

  const formattedScheduledDate = new Date(target).toLocaleString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLive: true,
      formattedCountdown: '00:00:00',
      formattedScheduledDate,
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours.toString().padStart(2, '0')}h`);
  parts.push(`${minutes.toString().padStart(2, '0')}m`);
  parts.push(`${seconds.toString().padStart(2, '0')}s`);

  return {
    days,
    hours,
    minutes,
    seconds,
    isLive: false,
    formattedCountdown: parts.join(' '),
    formattedScheduledDate,
  };
}

export function useCountdown(scheduledAt?: string | null): CountdownState {
  const [state, setState] = useState<CountdownState>(() => computeCountdown(scheduledAt));

  useEffect(() => {
    const initial = computeCountdown(scheduledAt);
    setState(initial);

    // If it's already live or unscheduled, never start any timer!
    if (!scheduledAt || initial.isLive) return;

    // Subscribe to the single global 1s clock
    const unsubscribe = subscribe(() => {
      const current = computeCountdown(scheduledAt);
      setState(current);
    });

    return unsubscribe;
  }, [scheduledAt]);

  return state;
}
