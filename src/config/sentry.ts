import * as Sentry from '@sentry/react-native';

// Initialisation de Sentry pour le monitoring des crashs en production
Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    // Debug mode en dev seulement
    debug: __DEV__,
    // Enabled only in production or if explicitly testing
    enabled: !__DEV__,
});

export default Sentry;
