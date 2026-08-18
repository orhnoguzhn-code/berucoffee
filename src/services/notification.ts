import { DeviceEventEmitter, Platform } from 'react-native';
import api from './api';

export const NOTIF_EVENT = 'app:notification-received';

function getMessaging() {
  try {
    const { getMessaging } = require('@react-native-firebase/messaging');
    return getMessaging();
  } catch {
    return null;
  }
}

async function registerDeviceToken() {
  try {
    const m = getMessaging();
    if (!m) return;

    const status = await m.requestPermission();
    if (status !== 1 && status !== 2) return;

    const token = await m.getToken();
    if (!token || token.length < 10) return;

    await api.post('/users/device-token', { token, platform: Platform.OS });
  } catch {
    // silently fail
  }
}

function onMessageReceived(callback: (msg: any) => void) {
  try {
    const m = getMessaging();
    if (!m) return () => {};
    return m.onMessage(callback);
  } catch {
    return () => {};
  }
}

function onNotificationOpened(callback: (msg: any) => void) {
  try {
    const m = getMessaging();
    if (!m) return () => {};
    return m.onNotificationOpenedApp(callback);
  } catch {
    return () => {};
  }
}

async function getInitialNotification() {
  try {
    const m = getMessaging();
    if (!m) return null;
    return await m.getInitialNotification();
  } catch {
    return null;
  }
}

function setupBackgroundHandler() {
  try {
    const { setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
    setBackgroundMessageHandler(async () => {
      // data payload handled locally; list is always refreshed from server
    });
  } catch {
    // Firebase messaging not available
  }
}

function emitNotificationReceived(msg: any) {
  try {
    DeviceEventEmitter.emit(NOTIF_EVENT, msg);
  } catch {
    // noop
  }
}

export {
  registerDeviceToken,
  onMessageReceived,
  onNotificationOpened,
  getInitialNotification,
  setupBackgroundHandler,
  emitNotificationReceived,
};