import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/I18nContext';
import LanguageSelector from '../components/LanguageSelector';
import AlertModal from '../components/AlertModal';
import Icon from '../components/ui/Icon';
import ValidatedInput from '../components/ui/ValidatedInput';
import OtpInput from '../components/ui/OtpInput';
import PasswordStrengthMeter from '../components/ui/PasswordStrengthMeter';
import { isValidEmail, isValidName, isValidPhone, passwordScore, normalizeTRPhone } from '../utils/validators';

type Touched = { name: boolean; email: boolean; phone: boolean; password: boolean; confirm: boolean };
type Stage = 'form' | 'otp';

export default function RegisterScreen({ navigation }: any) {
  const { register, checkPhone, checkEmail } = useAuth();
  const { t } = useI18n();

  const [stage, setStage] = useState<Stage>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Touched>({ name: false, email: false, phone: false, password: false, confirm: false });
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const touch = (field: keyof Touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const nameError = touched.name && !isValidName(name) ? t('form.nameMin') : null;
  const emailError = touched.email
    ? !email.trim() ? t('form.required') : !isValidEmail(email) ? t('form.emailInvalid') : null
    : null;
  const phoneError = touched.phone && !isValidPhone(phone) ? t('form.phoneInvalid') : null;
  const passwordError = touched.password && password && passwordScore(password) < 5 ? t('form.pwImprove') : null;
  const confirmError =
    touched.confirm && (!confirm || confirm !== password) ? t('form.passwordMismatch') : null;

  const formValid =
    isValidName(name) &&
    isValidEmail(email) &&
    isValidPhone(phone) &&
    passwordScore(password) >= 5 &&
    confirm === password;

  const sendCode = async (full: string) => {
    try {
      const auth = getAuth();
      const conf = await signInWithPhoneNumber(auth, full);
      setConfirmation(conf);
      setCode('');
      setStage('otp');
    } catch (err: any) {
      setErrorMsg((err as any)?.message || t('phone.sendFail'));
      setShowError(true);
      throw err;
    }
  };

  const handleRegister = async () => {
    setTouched({ name: true, email: true, phone: true, password: true, confirm: true });
    if (!formValid) return;
    const fullPhone = normalizeTRPhone(phone);
    if (!fullPhone) return;
    setSending(true);
    try {
      const [phoneInfo, emailInfo] = await Promise.all([
        checkPhone(fullPhone),
        checkEmail(email.trim().toLowerCase()),
      ]);
      if (phoneInfo.exists) {
        setErrorMsg(t('phone.inUse'));
        setShowError(true);
        return;
      }
      if (emailInfo.exists) {
        setErrorMsg(t('auth.emailInUse'));
        setShowError(true);
        return;
      }
      await sendCode(fullPhone);
    } catch {
      // hata mesajları ilgili fonksiyonlarda gösterilir
    } finally {
      setSending(false);
    }
  };

  const verifyAndRegister = async () => {
    if (!code.trim()) return;
    setVerifying(true);
    try {
      const cred = await confirmation.confirm(code.trim());
      const fullPhone = normalizeTRPhone(phone);
      await register(name.trim(), email.trim().toLowerCase(), password, fullPhone || undefined);
      navigation.getParent()?.goBack();
    } catch (err: any) {
      setErrorMsg((err as any)?.message || t('phone.verifyFail'));
      setShowError(true);
      setVerifying(false);
    }
  };

  const backToForm = () => {
    setConfirmation(null);
    setCode('');
    setStage('form');
  };

  const eye = (visible: boolean, toggle: () => void) => (
    <TouchableOpacity onPress={toggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7}>
      <Icon name={visible ? 'eyeOff' : 'eye'} size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-primary-soft">
      <KeyboardAwareScrollView
        bottomOffset={16}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        className="px-7 pb-10"
      >
        <View className="flex-row justify-end pt-6 mb-4">
          <LanguageSelector />
        </View>

        <View className="items-center mb-5">
          <View className="w-16 h-16 rounded-3xl bg-white items-center justify-center mb-3 shadow-md shadow-black/10">
            <Text className="text-3xl">☕</Text>
          </View>
          <Text className="text-2xl font-extrabold tracking-tight text-ink mb-1">{t('app.name')}</Text>
          <Text className="text-sm text-ink-secondary text-center leading-6">
            {stage === 'otp' ? t('phone.code') : t('auth.register')}
          </Text>
        </View>

        <View className="bg-white rounded-3xl p-6 shadow-md shadow-black/10">
          {stage === 'otp' ? (
            <>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="bg-brand-soft border-[1.5px] border-line rounded-xl px-3 py-1.5">
                    <Text className="text-xs font-bold text-ink">+90 {phone}</Text>
                  </View>
                  <TouchableOpacity onPress={backToForm} activeOpacity={0.7}>
                    <Text className="text-primary text-xs font-semibold">{t('phone.changeNumber')}</Text>
                  </TouchableOpacity>
                </View>
                <Icon name="check" size={18} color="#0E7A4A" />
              </View>

              <Text className="text-xs font-semibold text-ink-secondary mb-3 tracking-wider uppercase">{t('phone.code')}</Text>
              <OtpInput value={code} onChange={setCode} />

              <TouchableOpacity className="mt-2 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/40 disabled:opacity-70" onPress={verifyAndRegister} disabled={verifying || !code.trim()} activeOpacity={0.85}>
                {verifying ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-bold tracking-wide">{t('phone.verify')}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ValidatedInput
                label={t('auth.name')}
                icon="person"
                value={name}
                onChangeText={setName}
                onBlur={() => touch('name')}
                placeholder={t('auth.name')}
                autoCorrect={false}
                error={nameError}
                showSuccess={touched.name}
              />

              <ValidatedInput
                label="Email"
                icon="mail"
                value={email}
                onChangeText={setEmail}
                onBlur={() => touch('email')}
                placeholder="mail@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={emailError}
                showSuccess={touched.email}
              />

              <ValidatedInput
                label={t('phone.phone')}
                icon="phone"
                value={phone}
                onChangeText={setPhone}
                onBlur={() => touch('phone')}
                placeholder="5XX XXX XX XX"
                keyboardType="phone-pad"
                maxLength={10}
                prefix="+90"
                error={phoneError}
                showSuccess={touched.phone}
              />

              <View className="mb-4">
                <ValidatedInput
                  label={t('auth.password')}
                  icon="lock"
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => touch('password')}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  error={passwordError}
                  showSuccess={touched.password && passwordScore(password) >= 5}
                  rightElement={eye(showPassword, () => setShowPassword((p) => !p))}
                />
                {password.length > 0 ? <PasswordStrengthMeter password={password} t={t} /> : null}
              </View>

              <ValidatedInput
                label={t('form.passwordConfirm')}
                icon="lock"
                value={confirm}
                onChangeText={setConfirm}
                onBlur={() => touch('confirm')}
                placeholder="••••••••"
                secureTextEntry={!showConfirm}
                error={confirmError}
                showSuccess={touched.confirm && confirm === password}
                rightElement={eye(showConfirm, () => setShowConfirm((p) => !p))}
              />

              <TouchableOpacity
                className={`mt-2 bg-primary rounded-2xl py-4 items-center shadow-md shadow-primary/40 ${!formValid || sending ? 'opacity-50' : ''}`}
                onPress={handleRegister}
                disabled={sending || !formValid}
                activeOpacity={0.85}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold tracking-wide">{t('auth.registerButton')}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {stage === 'form' && (
          <TouchableOpacity onPress={() => navigation.navigate('PhoneLogin')} className="items-center mt-6" activeOpacity={0.7}>
            <Text className="text-ink-secondary text-sm font-medium">{t('auth.hasAccount')}</Text>
          </TouchableOpacity>
        )}
      </KeyboardAwareScrollView>

      <AlertModal
        visible={showError}
        title={t('auth.registerError')}
        message={errorMsg}
        type="error"
        buttons={[{ text: t('common.ok'), onPress: () => setShowError(false) }]}
      />
    </View>
  );
}