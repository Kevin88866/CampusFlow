import { NativeModules, TurboModuleRegistry, Dimensions } from 'react-native';
import fetchMock from 'jest-fetch-mock';
fetchMock.enableMocks();

Object.defineProperty(Dimensions, 'screen', {
  get: () => ({ width: 375, height: 667 }),
  set: () => {},
});
Object.defineProperty(Dimensions, 'window', {
  get: () => ({ width: 375, height: 667 }),
  set: () => {},
});

const CONSTANTS = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  IN_PROGRESS: 'IN_PROGRESS',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

const mockGoogleModule = {
  getConstants: jest.fn(() => CONSTANTS),
  NativeModule: { getConstants: jest.fn(() => CONSTANTS) },
  configure: jest.fn(),
  hasPlayServices: jest.fn(),
  signIn: jest.fn().mockResolvedValue({ user: { id: '123', name: 'Test User' } }),
  signOut: jest.fn().mockResolvedValue(),
  getTokens: jest.fn().mockResolvedValue({ idToken: 'fake-token' }),
};

NativeModules.RNGoogleSignin = mockGoogleModule;
TurboModuleRegistry.getEnforcing = () => mockGoogleModule;

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => () => null);
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ reset: jest.fn() }),
}));
