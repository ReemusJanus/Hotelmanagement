export default {
  expo: {
    name: 'Byteberrytech',
    slug: 'knockout-hospitality',
    version: '2.0.0',
    icon: './assets/byteberrytech-logo.png',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/byteberrytech-logo.png',
      resizeMode: 'contain',
      backgroundColor: '#090a08'
    },
    scheme: 'knockout',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.knockout.hospitality',
      infoPlist: {UIStatusBarStyle: 'UIStatusBarStyleLightContent'}
    },
    android: {
      package: 'com.knockout.hospitality',
      adaptiveIcon: {
        foregroundImage: './assets/byteberrytech-logo.png',
        backgroundColor: '#090a08'
      },
      edgeToEdgeEnabled: true
    },
    extra: {roles: ['admin', 'waiter', 'chef']},
    plugins: ['expo-font', 'expo-asset', 'expo-status-bar']
  }
};
