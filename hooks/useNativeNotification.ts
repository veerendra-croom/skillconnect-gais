
import { useCallback, useEffect, useState } from 'react';

export const useNativeNotification = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, []);

  const fireNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png', // Assumes PWA icon exists, fallback handled by browser
        badge: '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        ...options,
      } as any);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else {
        // Fallback: If permission not granted, try requesting it for next time
        if (permission !== 'denied') {
            requestPermission();
        }
    }
  }, [permission, requestPermission]);

  return { permission, requestPermission, fireNotification };
};
