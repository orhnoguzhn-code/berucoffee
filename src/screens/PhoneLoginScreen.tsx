import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { getAuth, signInWithPhoneNumber, getIdToken } from '@react-native-firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import AlertModal from '../components/AlertModal';
import Icon from '../components/ui/Icon';
import ValidatedInput from '../components/ui/ValidatedInput';
import OtpInput from '../components/ui/OtpInput';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';
import { isValidEmail, isValidName, passwordScore, normalizeTRPhone } from '../utils/validators';

type Stage = 'phone' | 'register' | 'otp';

export default function PhoneLoginScreen({ navigation }: any) {
  const { t } = useI18n();
  const { loginWithFirebaseIdToken, checkPhone, registerWithPhone } = useAuth();

  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ firstName: false, lastName: false, email: false });
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [modal, setModal] = useState<{ icon: string; title: string; message: string } | null>(null);

  const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

  const continueWithPhone = async () => {
    const full = normalizeTRPhone(phone);
    if (!full) {
      setModal({ icon: '!', title: t('common.error'), message: t('auth.required') });
      return;
    }
    setSending(true);
    try {
      const info = await checkPhone(full);
      if (info.exists) {
        await sendCode(full);
      } else {
        setPhone(full);
        setStage('register');
      }
    } catch {
      setModal({ icon: '!', title: t('common.error'), message: t('phone.sendFail') });
    } finally {
      setSending(false);
    }
  };

  const sendCode = async (full: string) => {
    try {
      const auth = getAuth();
      const conf = await signInWithPhoneNumber(auth, full);
      setConfirmation(conf);
      setCode('');
      setStage('otp');
    } catch (err: any) {
      setModal({ icon: '!', title: t('common.error'), message: (err as any).message || t('phone.sendFail') });
      throw err;
    }
  };

  const verifyCode = async () => {
    if (!code.trim()) {
      setModal({ icon: '!', title: t('common.error'), message: t('auth.required') });
      return;
    }
    setVerifying(true);
    try {
      const cred = await confirmation.confirm(code.trim());
      const idToken = await getIdToken(cred.user);
      await loginWithFirebaseIdToken(idToken);
      navigation.getParent()?.goBack();
    } catch (err: any) {
      setModal({ icon: '!', title: t('common.error'), message: (err as any).message || t('phone.verifyFail') });
      setVerifying(false);
    }
  };

  const firstNameError = touched.firstName && !isValidName(firstName) ? t('form.nameMin') : null;
  const lastNameError = touched.lastName && !isValidName(lastName) ? t('form.nameMin') : null;
  const emailError = touched.email && !isValidEmail(email) ? t('form.emailInvalid') : null;

  const createAccount = async () => {
    setTouched({ firstName: true, lastName: true, email: true });
    if (!isValidName(firstName) || !isValidName(lastName)) {
      setModal({ icon: '!', title: t('common.error'), message: t('form.nameMin') });
      return;
    }
    if (!isValidEmail(email)) {
      setModal({ icon: '!', title: t('common.error'), message: t('form.emailInvalid') });
      return;
    }
    if (password && passwordScore(password) < 5) {
      setModal({ icon: '!', title: t('common.error'), message: t('form.pwImprove') });
      return;
    }
    setRegistering(true);
    try {
      await registerWithPhone({
        phone,
        name: fullName,
        email: email.trim().toLowerCase(),
        password: password || undefined,
      });
      navigation.getParent()?.goBack();
    } catch (err: any) {
      const msg = err.response?.data?.message || t('common.error');
      setModal({ icon: '!', title: t('auth.registerError'), message: msg });
      setRegistering(false);
    }
  };

  const backToPhone = () => {
    setConfirmation(null);
    setCode('');
    setStage('phone');
  };

  return (
    <View className="flex-1 bg-primary-soft">
      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        className="px-7 pb-10"
      >
        <View className="items-end pt-12 mb-6">
          <LanguageSelector />
        </View>

        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center mb-5 shadow-md shadow-primary/40">
            <Icon name="coffee" size={44} color="#FFFFFF" />
          </View>
          <Text className="text-3xl font-extrabold tracking-tight text-primary-dark mb-1.5">{t('app.name')}</Text>
          <Text className="text-sm text-ink-secondary text-center leading-6">
            {stage === 'register' ? t('phone.newUserTitle') : t('phone.subtitle')}
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md shadow-black/10">
          {stage === 'phone' && (
            <>
              <Text className="text-xs font-semibold text-ink-secondary mb-2 tracking-wider uppercase">{t('phone.phone')}</Text>
              <View className="flex-row">
                <View className="bg-brand-soft border-[1.5px] border-line rounded-2xl justify-center px-4">
                  <Text className="text-base font-bold text-ink">+90</Text>
                </View>
                <TextInput
                  className="flex-1 ml-3 bg-brand-soft border-[1.5px] border-line rounded-2xl px-4 py-3.5 text-base text-ink"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="5XX XXX XX XX"
                  placeholderTextColor="#9CA3AF"
                  maxLength={10}
                />
              </View>

              <TouchableOpacity className="mt-5 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/40 disabled:opacity-70" onPress={continueWithPhone} disabled={sending} activeOpacity={0.85}>
                {sending ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold tracking-wide">{t('phone.continue')}</Text>}
              </TouchableOpacity>

              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-line" />
                <Text className="mx-3 text-ink-muted text-xs">{t('phone.or')}</Text>
                <View className="flex-1 h-px bg-line" />
              </View>

              <TouchableOpacity onPress={() => navigation.navigate('Login')} className="items-center py-2" activeOpacity={0.7}>
                <Text className="text-primary text-sm font-semibold">{t('auth.hasAccount')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Register')} className="items-center py-1" activeOpacity={0.7}>
                <Text className="text-primary text-sm font-semibold">{t('auth.noAccount')}</Text>
              </TouchableOpacity>
            </>
          )}

          {stage === 'register' && (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="bg-brand-soft border-[1.5px] border-line rounded-xl px-3 py-1.5">
                    <Text className="text-xs font-bold text-ink">{phone}</Text>
                  </View>
                  <TouchableOpacity onPress={backToPhone} activeOpacity={0.7}>
                    <Text className="text-primary text-xs font-semibold">{t('phone.changeNumber')}</Text>
                  </TouchableOpacity>
                </View>
                <Icon name="check" size={18} color="#0E7A4A" />
              </View>

              <Text className="text-xs font-semibold text-ink-secondary mb-3 tracking-wider uppercase">{t('phone.newUserTitle')}</Text>
              <Text className="text-sm text-ink-secondary leading-5 mb-4">{t('phone.newUserDesc')}</Text>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <ValidatedInput
                    label={t('phone.firstName')}
                    value={firstName}
                    onChangeText={setFirstName}
                    onBlur={() => setTouched((p) => ({ ...p, firstName: true }))}
                    placeholder={t('phone.firstName')}
                    autoCorrect={false}
                    error={firstNameError}
                    showSuccess={touched.firstName}
                  />
                </View>
                <View className="flex-1">
                  <ValidatedInput
                    label={t('phone.lastName')}
                    value={lastName}
                    onChangeText={setLastName}
                    onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
                    placeholder={t('phone.lastName')}
                    autoCorrect={false}
                    error={lastNameError}
                    showSuccess={touched.lastName}
                  />
                </View>
              </View>

              <ValidatedInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                placeholder="mail@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
                showSuccess={touched.email}
              />

              <ValidatedInput
                label={t('phone.passwordOptional')}
                value={password}
                onChangeText={setPassword}
                placeholder=""
                secureTextEntry
              />
              {password.length > 0 ? <PasswordStrengthMeter password={password} t={t} /> : null}

              <TouchableOpacity className="mt-4 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/40 disabled:opacity-70" onPress={createAccount} disabled={registering} activeOpacity={0.85}>
                {registering ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold tracking-wide">{t('auth.registerButton')}</Text>}
              </TouchableOpacity>
            </>
          )}

          {stage === 'otp' && (
            <>
              <Text className="text-xs font-semibold text-ink-secondary mb-3 tracking-wider uppercase">{t('phone.code')}</Text>
              <OtpInput value={code} onChange={setCode} />

              <TouchableOpacity className="mt-2 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/40 disabled:opacity-70" onPress={verifyCode} disabled={verifying} activeOpacity={0.85}>
                {verifying ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold tracking-wide">{t('phone.verify')}</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={backToPhone} className="items-center mt-4 py-2" activeOpacity={0.7}>
                <Text className="text-ink-secondary text-sm font-medium">{t('phone.changeNumber')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <AlertModal
        visible={!!modal}
        title={modal?.title || ''}
        message={modal?.message || ''}
        type="error"
        icon={modal?.icon}
        buttons={[{ text: t('common.ok'), onPress: () => setModal(null) }]}
      />
    </View>
  );
}