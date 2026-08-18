import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, PermissionsAndroid, Alert, Linking,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Geolocation from '@react-native-community/geolocation';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useI18n } from '../i18n/I18nContext';
import api from '../services/api';

const LABELS = ['Ev', 'İş', 'Diğer'];
const geocodeCache: Record<string, string> = {};

interface Props {
  navigation: any;
  route?: any;
}

export default function AddressFormScreen({ navigation, route }: Props) {
  const { t, language } = useI18n();
  const mapRef = useRef<MapView>(null);
  const editAddress = route?.params?.address;

  const [label, setLabel] = useState(editAddress?.label || 'Ev');
  const [fullAddress, setFullAddress] = useState(editAddress?.full_address || '');
  const [phone, setPhone] = useState(editAddress?.phone || '');
  const [apartment, setApartment] = useState(editAddress?.apartment || '');
  const [floor, setFloor] = useState(editAddress?.floor || '');
  const [doorNumber, setDoorNumber] = useState(editAddress?.door_number || '');
  const [description, setDescription] = useState(editAddress?.description || '');
  const [latitude, setLatitude] = useState(editAddress ? parseFloat(editAddress.latitude) : 36.787);
  const [longitude, setLongitude] = useState(editAddress ? parseFloat(editAddress.longitude) : 31.443);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [markerKey, setMarkerKey] = useState(0);

  useEffect(() => {
    if (editAddress) {
      setLabel(editAddress.label || 'Ev');
      setFullAddress(editAddress.full_address || '');
      setPhone(editAddress.phone || '');
      setApartment(editAddress.apartment || '');
      setFloor(editAddress.floor || '');
      setDoorNumber(editAddress.door_number || '');
      setDescription(editAddress.description || '');
    }
  }, [editAddress]);

  useEffect(() => {
    if (editAddress) return;
    reverseGeocode(latitude, longitude);
    requestUserLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestUserLocation = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          handleLocationError({ code: 1 });
          return;
        }
      }

      const pos = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
        );
      });

      setLatitude(pos.latitude);
      setLongitude(pos.longitude);
      setMarkerKey(k => k + 1);
      mapRef.current?.animateToRegion({
        latitude: pos.latitude,
        longitude: pos.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      reverseGeocode(pos.latitude, pos.longitude);
    } catch (err: any) {
      handleLocationError(err);
    }
  };

  const handleLocationError = (err: any) => {
    const code = err?.code ?? err?.positionError?.code;
    if (code === 2) {
      Alert.alert(
        t('location.offTitle'),
        t('location.offDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('location.openSettings'),
            onPress: () => {
              if (Platform.OS === 'android') {
                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() =>
                  Linking.openSettings()
                );
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
    } else if (code === 1) {
      Alert.alert(
        t('location.permissionTitle'),
        t('location.permissionDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('location.openSettings'), onPress: () => Linking.openSettings() },
        ],
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (geocodeCache[cacheKey]) {
      setFullAddress(geocodeCache[cacheKey]);
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${language || 'tr'}`,
        { headers: { 'User-Agent': 'CoffeeLoyaltyApp/1.0' } }
      );
      const data = await res.json();
      if (data?.display_name) {
        geocodeCache[cacheKey] = data.display_name;
        setFullAddress(data.display_name);
      }
    } catch (err) {
      console.log('Geocode error:', err);
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapLongPress = (e: any) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
    setMarkerKey(k => k + 1);
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (geocodeCache[key]) {
      setFullAddress(geocodeCache[key]);
    } else {
      reverseGeocode(lat, lng);
    }
    mapRef.current?.animateToRegion({
      latitude: lat, longitude: lng,
      latitudeDelta: 0.01, longitudeDelta: 0.01,
    }, 300);
  };

  const handleMarkerDragEnd = (e: any) => {
    const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
    setLatitude(lat);
    setLongitude(lng);
    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    if (geocodeCache[key]) {
      setFullAddress(geocodeCache[key]);
    } else {
      reverseGeocode(lat, lng);
    }
  };

  const handleSave = async () => {
    if (!fullAddress.trim() || !phone.trim() || !apartment.trim() || !floor.trim() || !doorNumber.trim()) return;
    setSaving(true);
    try {
      const payload = {
        label,
        full_address: fullAddress,
        phone,
        latitude,
        longitude,
        apartment,
        floor,
        door_number: doorNumber,
        description: description || null,
      };

      if (editAddress) {
        await api.put(`/users/addresses/${editAddress.id}`, payload);
      } else {
        await api.post('/users/addresses', payload);
      }
      navigation.goBack();
    } catch (err) {
      console.log('Save address error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-soft">
      <View className="h-60 relative">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          showsUserLocation
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onLongPress={handleMapLongPress}
        >
          <Marker
            key={markerKey}
            coordinate={{ latitude, longitude }}
            title={t('checkout.yourLocation')}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        </MapView>
        <Text className="absolute bottom-2 left-0 right-0 self-center text-center text-xs text-ink-secondary bg-white/90 py-1 px-3 rounded-lg overflow-hidden">{t('checkout.longPressPin')}</Text>
      </View>

      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-5">
          <Text className="text-[13px] font-semibold text-ink mt-3 mb-1.5">{t('checkout.addressLabel')}</Text>
          <View className="flex-row gap-2 mb-2">
            {LABELS.map(l => (
              <TouchableOpacity
                key={l}
                className={`px-5 py-2.5 rounded-full ${label === l ? 'bg-primary' : 'bg-brand-muted'}`}
                onPress={() => setLabel(l)}
              >
                <Text className={`text-sm font-semibold ${label === l ? 'text-white' : 'text-ink-secondary'}`}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldLabel text={`${t('checkout.fullAddress')} *`} />
          {geocoding && <ActivityIndicator size="small" color="#0E7A4A" className="mb-2" />}
          <TextInput
            className="bg-white rounded-xl p-3.5 text-[15px] border border-line text-ink mb-2"
            value={fullAddress}
            onChangeText={setFullAddress}
            multiline
            placeholder="Örn: Atatürk Cad. No:123"
            placeholderTextColor="#9CA3AF"
          />

          <FieldLabel text={`${t('checkout.phone')} *`} />
          <TextInput
            className="bg-white rounded-xl p-3.5 text-[15px] border border-line text-ink mb-2"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder={t('checkout.phonePlaceholder')}
            placeholderTextColor="#9CA3AF"
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <FieldLabel text={`${t('checkout.apartment')} *`} />
              <TextInput className="bg-white rounded-xl p-3.5 text-[15px] border border-line text-ink mb-2" value={apartment} onChangeText={setApartment} placeholder="Daire" placeholderTextColor="#9CA3AF" />
            </View>
            <View className="flex-1">
              <FieldLabel text={`${t('checkout.floor')} *`} />
              <TextInput className="bg-white rounded-xl p-3.5 text-[15px] border border-line text-ink mb-2" value={floor} onChangeText={setFloor} placeholder="Kat" placeholderTextColor="#9CA3AF" />
            </View>
          </View>

          <FieldLabel text={`${t('checkout.doorNumber')} *`} />
          <TextInput className="bg-white rounded-xl p-3.5 text-[15px] border border-line text-ink mb-2" value={doorNumber} onChangeText={setDoorNumber} placeholder="Kapı No" placeholderTextColor="#9CA3AF" />

          <FieldLabel text={t('checkout.addressDesc')} />
          <TextInput
            className="bg-white rounded-xl p-3.5 text-[15px] border border-line text-ink mb-2 min-h-20 textAlignVertical-top"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder={t('checkout.addressDescPlaceholder')}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          className="mx-5 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/30"
          onPress={handleSave}
          disabled={saving || !fullAddress.trim() || !phone.trim() || !apartment.trim() || !floor.trim() || !doorNumber.trim()}
        >
          <Text className="text-white text-base font-bold">
            {saving ? t('common.loading') : (editAddress ? t('common.update') : t('common.save'))}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  const required = text.endsWith('*');
  return (
    <Text className="text-[13px] font-semibold text-ink mt-3 mb-1.5">
      {text.slice(0, -1)}
      {required && <Text className="text-[#C0392B] font-bold">*</Text>}
    </Text>
  );
}