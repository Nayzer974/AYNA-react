/**
 * Analytics v2 - Navigation Tracking Hook
 * 
 * Hook to integrate screen tracking with React Navigation.
 * Should be used in NavigationContainer.
 */

import { useRef } from 'react';
import { NavigationState, Route } from '@react-navigation/native';
import { analytics } from '../Analytics';

const DEBOUNCE_MS = 500;

/**
 * Extract current route from navigation state
 * Handles nested navigators (Stack, Tab, etc.)
 */
function getCurrentRoute(state: NavigationState | undefined): Route<string> | undefined {
  if (!state || typeof state.index !== 'number') {
    return undefined;
  }

  const route = state.routes[state.index];

  // If route has nested state, recurse
  if (route.state) {
    return getCurrentRoute(route.state);
  }

  return route;
}

/**
 * Hook to track screen views from NavigationContainer
 * 
 * USAGE:
 *   <NavigationContainer onStateChange={useNavigationTracking()}>
 */
export function useNavigationTracking() {
  const previousRouteRef = useRef<string | null>(null);
  const lastTrackedRef = useRef<number>(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (state: NavigationState | undefined) => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce screen tracking
    debounceTimerRef.current = setTimeout(() => {
      const currentRoute = getCurrentRoute(state);
      if (!currentRoute) {
        return;
      }

      const routeName = currentRoute.name;
      const now = Date.now();

      // Skip if same route
      if (previousRouteRef.current === routeName) {
        return;
      }

      // Skip if debounce period not elapsed
      if ((now - lastTrackedRef.current) < DEBOUNCE_MS) {
        return;
      }

      // Update refs
      previousRouteRef.current = routeName;
      lastTrackedRef.current = now;

      // Track screen view
      analytics.screen(routeName, currentRoute.params as Record<string, unknown> | undefined);
    }, DEBOUNCE_MS);
  };
}

