import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const timerNotificationId = 1001;
let pendingUpdate = Promise.resolve();

// Serialize updates so changing or stopping a timer cannot leave an older alert behind.
export function syncTimerNotification(deadline) {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(true);

  pendingUpdate = pendingUpdate.catch(() => {}).then(async () => {
    await LocalNotifications.cancel({ notifications: [{ id: timerNotificationId }] });
    if (!Number.isFinite(deadline) || deadline <= Date.now()) return true;

    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') {
      permission = await LocalNotifications.requestPermissions();
    }
    if (permission.display !== 'granted') return false;

    await LocalNotifications.schedule({
      notifications: [{
        id: timerNotificationId,
        title: 'ChefSpeak timer finished',
        body: 'Check your dish.',
        schedule: { at: new Date(deadline) },
        sound: 'default',
      }],
    });
    return true;
  });

  return pendingUpdate;
}
