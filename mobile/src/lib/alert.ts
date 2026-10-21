import { Alert as NativeAlert, Platform } from 'react-native';

interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Drop-in replacement for React Native's Alert.
 * react-native-web's Alert does nothing, so on the web we use the browser's dialogs instead.
 */
export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    if (Platform.OS !== 'web') {
      NativeAlert.alert(title, message, buttons);
      return;
    }

    const text = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }

    const cancel = buttons.find((b) => b.style === 'cancel');
    const action = buttons.find((b) => b.style !== 'cancel') ?? buttons[0];
    if (window.confirm(text)) action.onPress?.();
    else cancel?.onPress?.();
  },
};
