module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // En production, on supprime les console.log mais on garde warn et error
      ...(process.env.NODE_ENV === 'production' ? [
        ['transform-remove-console', { exclude: ['error', 'warn'] }]
      ] : []),
      'react-native-reanimated/plugin', // Doit être en dernier
    ],
  };
};
