// client/src/hooks/useRealtimeTable.js
// Real-time table subscription reusing the project's existing Socket.IO
// backend (socketService). No polling, no page reload.
//
// Usage:
//   useRealtimeTable('devices', () => { fetchDevices(); fetchStats(); });
//   useRealtimeTable(['free-quotes', 'pre-assessments'], handleChange);
//
// - Single 'table:changed' channel emitted by server/utils/realtimeHelper.js
//   to role rooms "admins" / "engineers" / "customers"
//   (server.js auto-joins by role in joinUser).
// - Filters by entity client-side, debounces bursts, defers hidden tabs
//   (queues 1 pending update, flushes on visible/focus) to avoid
//   refetch storms without losing updates, cleans up on unmount.
// - socketService already dedups identical callbacks; we still call off().

import { useEffect, useRef } from 'react';
import socketService from '../services/socketService';

/**
 * Subscribe to real-time table changes.
 * @param {string|string[]} entities - entity name(s), e.g. 'users'
 * @param {(payload:{entity,action,record,id})=>void} onChange - refetch/merge callback
 * @param {{debounceMs?:number, skipWhenHidden?:boolean}} options
 */
export function useRealtimeTable(entities, onChange, options = {}) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const key = Array.isArray(entities)
    ? [...entities].sort().join(',')
    : String(entities || '');
  const debounceMs = options.debounceMs ?? 400;
  const skipWhenHidden = options.skipWhenHidden ?? true;

  useEffect(() => {
    const list = Array.isArray(entities) ? entities : [entities];

    let timer = null;
    // Queued payloads while hidden, keyed by entity so a projects update
    // + a solar-invoices update both flush (pages branching on
    // payload.entity need one call per entity). One entry max per entity.
    const pendingByEntity = new Map();

    const isHidden = () =>
      skipWhenHidden &&
      typeof document !== 'undefined' &&
      document.hidden;

    const flush = () => {
      if (pendingByEntity.size === 0) return;
      if (isHidden()) return;
      const batch = [...pendingByEntity.values()];
      pendingByEntity.clear();
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      try {
        if (import.meta.env?.DEV) {
          console.debug('[realtime] flushed on visible', batch.map((p) => p?.entity).join(','));
        }
        batch.forEach((payload) => cbRef.current?.(payload));
      } catch (e) {
        console.error('[useRealtimeTable] onChange failed:', e);
      }
    };

    const handler = (payload) => {
      if (!payload) return;
      // Ignore events for other entities sharing the channel
      if (payload.entity && !list.includes(payload.entity)) return;
      if (import.meta.env?.DEV) {
        console.debug('[realtime] recv', payload?.entity, payload?.action);
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          // Lightweight guard: hidden tabs defer (not drop) to avoid
          // background refetch storms. Flushed once on visible/focus.
          if (isHidden()) {
            pendingByEntity.set(payload?.entity || '__all__', payload);
            if (import.meta.env?.DEV) {
              console.debug('[realtime] queued while hidden', payload?.entity);
            }
            return;
          }
          pendingByEntity.clear();
          cbRef.current?.(payload);
        } catch (e) {
          console.error('[useRealtimeTable] onChange failed:', e);
        }
      }, debounceMs);
    };

    const onVisible = () => {
      flush();
    };
    const onFocus = () => {
      flush();
    };

    socketService.on('table:changed', handler);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus);
    }

    return () => {
      if (timer) clearTimeout(timer);
      socketService.off('table:changed', handler);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Instantly merge a realtime payload into a rows array state.
 * Dedups by _id/id so rapid create+refetch cycles never duplicate rows.
 * Status changes arrive as action:'updated' and patch the existing row.
 */
export function applyRealtimeRecord(prevRows, payload) {
  if (!payload || !Array.isArray(prevRows)) return prevRows;
  const { action, record, id } = payload;
  const rid = String(record?._id || record?.id || id || '');
  const rowId = (r) => String(r?._id || r?.id || '');

  if (action === 'created') {
    if (!record) return prevRows;
    if (rid && prevRows.some((r) => rowId(r) === rid && rid !== '')) return prevRows;
    return [record, ...prevRows];
  }

  if (action === 'updated') {
    if (!rid) return prevRows;
    let found = false;
    const next = prevRows.map((r) => {
      if (rowId(r) === rid) {
        found = true;
        return { ...r, ...record };
      }
      return r;
    });
    return found ? next : prevRows;
  }

  if (action === 'deleted') {
    if (!rid) return prevRows;
    return prevRows.filter((r) => rowId(r) !== rid);
  }

  return prevRows;
}

export default useRealtimeTable;
