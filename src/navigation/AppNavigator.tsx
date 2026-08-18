import React, { useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import LoginScreen from '../screens/LoginScreen';
import PhoneLoginScreen from '../screens/PhoneLoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import PayScreen from '../screens/PayScreen';
import RewardsScreen from '../screens/RewardsScreen';
import AccountScreen from '../screens/AccountScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import QRScanScreen from '../screens/QRScanScreen';
import QRScreen from '../screens/QRScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import CartScreen from '../screens/CartScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AddressFormScreen from '../screens/AddressFormScreen';
import StoreScreen from '../screens/StoreScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import GiftCoffeeScreen from '../screens/GiftCoffeeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import Icon from '../components/ui/Icon';
import { colors, spacing, typography, shadow } from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export const navigationRef = createNavigationContainerRef<any>();

type TabName = 'Home' | 'Order' | 'Pay' | 'Rewards' | 'Account';

const TAB_META: Record<TabName, { icon: string; activeIcon: string; labelKey: string }> = {
  Home: { icon: 'home', activeIcon: 'home', labelKey: 'tabs.home' },
  Order: { icon: 'menu', activeIcon: 'menu', labelKey: 'tabs.menu' },
  Pay: { icon: 'qr', activeIcon: 'qr', labelKey: 'tabs.pay' },
  Rewards: { icon: 'star', activeIcon: 'starFill', labelKey: 'tabs.rewards' },
  Account: { icon: 'account', activeIcon: 'account', labelKey: 'tabs.account' },
};

function TabBar({ state, descriptors, navigation }: any) {
  const { t } = useI18n();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const payScale = useRef(new Animated.Value(1)).current;

  const onPayPressIn = () => {
    Animated.spring(payScale, { toValue: 0.88, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const onPayPressOut = () => {
    Animated.spring(payScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 10 }).start();
  };

  return (
    <View style={[styles.tabBarWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const name = route.name as TabName;
          const focused = state.index === index;
          const meta = TAB_META[name];
          const isPay = name === 'Pay';
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              if (!token && name !== 'Home' && name !== 'Order') {
                navigation.navigate('Auth', { screen: 'PhoneLogin' });
                return;
              }
              navigation.navigate(route.name);
            }
          };

          if (isPay) {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} onPressIn={onPayPressIn} onPressOut={onPayPressOut} activeOpacity={0.9} style={styles.payBtnWrap}>
                <Animated.View style={[styles.payBtn, focused && styles.payBtnActive, { transform: [{ scale: payScale }] }]}>
                  <Icon name="qr" size={30} color={colors.textOnPrimary} />
                </Animated.View>
                <Text style={styles.payLabel}>{t(meta.labelKey)}</Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity key={route.key} onPress={onPress} activeOpacity={0.7} style={styles.tab}>
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Icon name={focused ? meta.activeIcon : meta.icon} size={22} color={focused ? colors.textOnPrimary : colors.textMuted} />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{t(meta.labelKey)}</Text>
              <View style={[styles.activeDot, focused && styles.activeDotOn]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const HomeTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0, shadowOpacity: 0 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Order" component={MenuScreen} />
      <Tab.Screen name="Pay" component={PayScreen} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
};

const MainStack = () => (
  <Stack.Navigator screenOptions={{
    headerStyle: { backgroundColor: colors.bg, elevation: 0, shadowOpacity: 0 },
    headerTitleStyle: { color: colors.textPrimary, fontWeight: '700', fontSize: 17 },
    headerTintColor: colors.primary,
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  }}>
    <Stack.Screen name="MainTabs" component={HomeTabs} options={{ headerShown: false }} />
    <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Cart" component={CartScreen} options={{ title: '', headerShown: false }} />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AddressForm" component={AddressFormScreen} options={{ title: '' }} />
    <Stack.Screen name="Store" component={StoreScreen} options={{ headerShown: false }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: '', headerShown: false }} />
    <Stack.Screen name="QROkut" component={QRScanScreen} options={{ title: '' }} />
    <Stack.Screen name="QRKodum" component={QRScreen} options={{ title: '' }} />
    <Stack.Screen name="History" component={HistoryScreen} options={{ title: '' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
    <Stack.Screen name="GiftCoffee" component={GiftCoffeeScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const RootStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="App" component={MainStack} />
    <Stack.Screen name="Auth" component={AuthStack} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { loading } = useAuth();
  if (loading) return null;
  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    backgroundColor: 'transparent',
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 30,
    marginHorizontal: 14,
    paddingTop: 28,
    paddingHorizontal: 4,
    borderWidth: 1, borderColor: colors.divider,
    ...shadow.lg,
  },
  tab: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  iconWrap: {
    width: 48, height: 32, borderRadius: 999, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrapActive: { backgroundColor: colors.primary, borderRadius: 999, overflow: 'hidden', transform: [{ scale: 1.05 }], ...shadow.sm },
  tabLabel: { ...typography.micro, color: colors.textMuted, marginTop: 4, textTransform: 'uppercase' },
  tabLabelActive: { color: colors.primary, fontWeight: '800', transform: [{ translateY: -1 }] },
  activeDot: {
    position: 'absolute', bottom: 6,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeDotOn: { backgroundColor: colors.primary },
  payBtnWrap: { flex: 1, alignItems: 'center', marginTop: -46, zIndex: 10 },
  payBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.white,
    ...shadow.lg,
  },
  payBtnActive: { backgroundColor: colors.primaryDark },
  payLabel: { ...typography.micro, color: colors.primary, marginTop: 4, textTransform: 'uppercase', fontWeight: '800', fontSize: 15 },
});
