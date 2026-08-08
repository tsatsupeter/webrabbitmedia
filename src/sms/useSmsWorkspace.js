import { useBusinesses } from '../hooks/useBusinesses'

/**
 * Messaging workspace context.
 *
 * The messaging dashboard is a standalone product: it has no Test/Live toggle.
 * Everything runs in a single workspace backed by a prepaid credit wallet.
 * This hook mirrors the shape the messaging pages consume so they stay simple.
 */
export function useSmsWorkspace() {
  const { active, loading } = useBusinesses()
  return {
    business: active,
    mode: 'live',
    modeReady: !loading,
    loading,
  }
}

/** No-op: kept so pages can declare their loading state without a mode overlay. */
export function useModeDataLoading() {}
