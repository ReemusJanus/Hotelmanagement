export default {
  expo: {
    name: 'KnockOUT',
    slug: 'knockout-hospitality',
    version: '2.0.0',
    orientation: 'portrait',
    platforms: ['ios', 'android'],
    userInterfaceStyle: 'dark',
    scheme: 'knockout',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.knockout.hospitality',
      infoPlist: {UIStatusBarStyle: 'UIStatusBarStyleLightContent'}
    },
    android: {
      package: 'com.knockout.hospitality',
      adaptiveIcon: {backgroundColor: '#11120f'},
      edgeToEdgeEnabled: true
    },
    extra: {roles: ['admin', 'waiter', 'chef']},
    plugins: ['expo-font', 'expo-asset']
  }
};
