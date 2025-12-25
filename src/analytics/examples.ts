/**
 * Analytics v2 - Usage Examples
 * 
 * This file demonstrates how to use analytics throughout the app.
 * These are reference examples, not meant to be imported directly.
 */

import { analytics } from './Analytics';

// ============================================================================
// Example 1: Navigation Container Integration
// ============================================================================
/*
// In src/navigation/AppNavigator.tsx

import { useNavigationTracking } from '@/analytics/hooks/useNavigationTracking';

export const AppNavigator = React.forwardRef<any, {}>((props, ref) => {
  const handleStateChange = useNavigationTracking();
  
  return (
    <NavigationContainer 
      ref={ref} 
      theme={navigationTheme}
      onStateChange={handleStateChange}
    >
      {/* ... rest of navigator *\/}
    </NavigationContainer>
  );
});
*/

// ============================================================================
// Example 2: Track Dhikr Completion
// ============================================================================
/*
// In src/services/userAnalytics.ts or component

import { analytics } from '@/analytics';

export function onDhikrCompleted(count: number, dhikrType?: string) {
  analytics.track('dhikr_completed', {
    count,
    dhikr_type: dhikrType || 'general',
    // Never include: user notes, intentions, personal text
  });
}
*/

// ============================================================================
// Example 3: Track Feature Usage
// ============================================================================
/*
// In src/pages/BaytAnNur.tsx or similar

import { analytics } from '@/analytics';

function startKhalwaSession(sessionData: KhalwaSession) {
  analytics.track('khalwa_session_started', {
    duration_minutes: sessionData.duration,
    guided: sessionData.guided,
    // Never include: intention text, personal feelings
  });
}

function completeKhalwaSession(sessionData: KhalwaSession) {
  analytics.track('khalwa_session_completed', {
    duration_minutes: sessionData.duration,
    completed: true,
    // Never include: personal notes, feelings, intentions
  });
}
*/

// ============================================================================
// Example 4: User Identification
// ============================================================================
/*
// In src/contexts/UserContext.tsx

import { analytics } from '@/analytics';

async function login(email: string, password: string) {
  // ... authentication logic ...
  
  const user = await signIn(email, password);
  
  // Identify user after successful login
  await analytics.identify(user.id, {
    theme: user.theme,
    locale: user.locale,
    // Never include: email, password, personal data
  });
  
  return user;
}
*/

// ============================================================================
// Example 5: Track Conversions
// ============================================================================
/*
// In src/pages/Signup.tsx

import { analytics } from '@/analytics';

async function handleSignup(email: string, password: string) {
  try {
    const user = await signUp(email, password);
    
    // Track conversion
    analytics.track('user_signup_completed', {
      method: 'email', // or 'google', 'apple'
    });
    
    // Identify user
    await analytics.identify(user.id);
    
    return user;
  } catch (error) {
    analytics.track('user_signup_failed', {
      error_type: error.name,
      // Never include: email, password
    });
    throw error;
  }
}
*/

// ============================================================================
// Example 6: Flush Before Logout
// ============================================================================
/*
// In src/contexts/UserContext.tsx

import { analytics } from '@/analytics';

async function logout() {
  // Flush analytics before logout
  await analytics.flush();
  
  // Clear analytics user
  // (optOut clears queue, so don't use here)
  // User will be cleared automatically when identify() is called with new user
  
  // ... rest of logout logic ...
}
*/

// ============================================================================
// Example 7: GDPR Compliance - User Data Export
// ============================================================================
/*
// In src/pages/Profile.tsx or Settings

import { analytics } from '@/analytics';
import { useUser } from '@/contexts/UserContext';

function ExportDataButton() {
  const { user } = useUser();
  
  const handleExport = async () => {
    if (!user?.id) return;
    
    const events = await analytics.exportUserData(user.id);
    
    // Convert to JSON for download/share
    const json = JSON.stringify(events, null, 2);
    
    // Implement file sharing (using expo-sharing or similar)
    // ...
  };
  
  return <Button onPress={handleExport}>Export My Data</Button>;
}
*/

// ============================================================================
// Example 8: GDPR Compliance - Opt Out
// ============================================================================
/*
// In src/pages/Settings.tsx

import { analytics } from '@/analytics';
import { useState } from 'react';

function AnalyticsSettings() {
  const [optOutEnabled, setOptOutEnabled] = useState(false);
  
  const handleOptOut = async () => {
    await analytics.optOut();
    setOptOutEnabled(true);
    Alert.alert('Analytics disabled', 'Your analytics data has been cleared.');
  };
  
  const handleOptIn = () => {
    analytics.optIn();
    setOptOutEnabled(false);
  };
  
  return (
    <Switch
      value={!optOutEnabled}
      onValueChange={(value) => value ? handleOptIn() : handleOptOut()}
    />
  );
}
*/

// ============================================================================
// Example 9: Track Errors (Non-PII)
// ============================================================================
/*
// In error boundary or catch blocks

import { analytics } from '@/analytics';

try {
  // ... some operation ...
} catch (error) {
  analytics.track('error_occurred', {
    error_type: error.name,
    error_message: error.message?.substring(0, 100), // Truncated
    // Never include: stack traces with user data, file paths with user info
  });
}
*/

// ============================================================================
// Example 10: Check Queue Status (Debug)
// ============================================================================
/*
// For debugging/monitoring

import { analytics } from '@/analytics';

async function checkAnalyticsHealth() {
  const stats = await analytics.getStats();
  
  console.log('Analytics Queue:', {
    queued: stats.queued,
    failedSyncs: stats.failedSyncs,
    lastSync: stats.lastSyncTime ? new Date(stats.lastSyncTime).toISOString() : 'never',
  });
  
  if (stats.queued > 500) {
    console.warn('High queue size, sync may be failing');
  }
}
*/





