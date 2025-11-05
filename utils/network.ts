import { Platform } from 'react-native';

// Importación condicional solo para mobile
let NetInfo: any = null;
if (Platform.OS !== 'web') {
  try {
    NetInfo = require('@react-native-community/netinfo');
  } catch (e) {
    console.warn('NetInfo not available');
  }
}

export const checkConnection = async (): Promise<boolean> => {
  // En web, asumir que hay conexión
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  try {
    if (!NetInfo) return true;
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch (error) {
    console.error('Error checking connection:', error);
    return false;
  }
};

export const isInternetReachable = async (): Promise<boolean> => {
  // En web, verificar navigator.onLine
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  try {
    if (!NetInfo) return true;
    const state = await NetInfo.fetch();
    return state.isInternetReachable ?? false;
  } catch (error) {
    console.error('Error checking internet:', error);
    return false;
  }
};