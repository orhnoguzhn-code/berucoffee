import { DeviceEventEmitter, Platform } from 'react-native';
import api from './api';

export const NOTIF_EVENT = 'app:notification-received';

type NotificationCallback = (msg: any) => void;

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
    const messaging = getMessaging();
    if (!messaging) return;

    const status = await messaging.requestPermission();
    if (status !== 1 && status !== 2) return;

    const token = await messaging.getToken();
    if (!token || token.length < 10) return;

    await api.post('/users/device-token', { token, platform: Platform.OS });
  } catch (error) {
    console.warn('Bildirim cihaz kaydı başarısız:', error);
  }
}

function onMessageReceived(callback: NotificationCallback) {
  try {
    const messaging = getMessaging();
    if (!messaging) return () => {};
    return messaging.onMessage(callback);
  } catch (error) {
    console.warn('Ön plan bildirimi dinlenemedi:', error);
    return () => {};
  }
}

function onNotificationOpened(callback: NotificationCallback) {
  try {
    const messaging = getMessaging();
    if (!messaging) return () => {};
    return messaging.onNotificationOpenedApp(callback);
  } catch (error) {
    console.warn('Bildirim açılış dinleyicisi kurulamadı:', error);
    return () => {};
  }
}

async function getInitialNotification() {
  try {
    const messaging = getMessaging();
    if (!messaging) return null;
    return await messaging.getInitialNotification();
  } catch (error) {
    console.warn('Başlangıç bildirimi alınamadı:', error);
    return null;
  }
}

function setupBackgroundHandler() {
  try {
    const { setBackgroundMessageHandler } = require('@react-native-firebase/messaging');
    setBackgroundMessageHandler(async () => undefined);
  } catch (error) {
    console.warn('Arka plan bildirim işleyicisi kurulamadı:', error);
  }
}

function emitNotificationReceived(msg: any) {
  DeviceEventEmitter.emit(NOTIF_EVENT, msg);
}

export {
  registerDeviceToken,
  onMessageReceived,
  onNotificationOpened,
  getInitialNotification,
  setupBackgroundHandler,
  emitNotificationReceived,
};
