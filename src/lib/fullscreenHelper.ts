export const requestUniversalFullscreen = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (window.innerWidth < 1024) return;
  const doc = document as any;
  const fsElement = doc.fullscreenElement || 
                    doc.webkitFullscreenElement || 
                    doc.mozFullScreenElement || 
                    doc.msFullscreenElement;

  if (!fsElement) {
    const el = (document.documentElement || document.body) as any;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((err: any) => {
        console.warn("Auto-fullscreen failed:", err);
      });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }
};
