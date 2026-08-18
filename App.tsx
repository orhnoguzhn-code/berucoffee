import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from './src/context/AuthContext';
import { I18nProvider } from './src/i18n/I18nContext';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationHandler from './src/components/NotificationHandler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <I18nProvider>
          <AuthProvider>
            <CartProvider>
              <NotificationHandler>
                <AppNavigator />
              </NotificationHandler>
              <StatusBar barStyle="dark-content" backgroundColor="#F8F4F0" />
            </CartProvider>
          </AuthProvider>
        </I18nProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
