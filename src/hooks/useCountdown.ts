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

export function useCountdown(scheduledAt?: string | null): CountdownState {
  const calculate = (): CountdownState => {
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
  };

  const [state, setState] = useState<CountdownState>(calculate);

  useEffect(() => {
    setState(calculate());
    if (!scheduledAt) return;

    const interval = setInterval(() => {
      const newState = calculate();
      setState(newState);
      if (newState.isLive) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledAt]);

  return state;
}
