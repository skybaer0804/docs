import { useEffect, useRef } from 'preact/hooks';
import { logInteraction } from '../utils/api';

/**
 * 문서 조회 체류 시간 및 로그 기록을 담당하는 Custom Hook
 * @param {string} nodeId - 문서 ID
 */
export function useInteractionLogger(nodeId) {
  const startTimeRef = useRef(Date.now());
  const lastLoggedNodeIdRef = useRef(null);

  useEffect(() => {
    if (!nodeId) return;

    // 이전 노드의 이탈 로그 기록 (컴포넌트가 재사용되는 경우를 대비)
    if (lastLoggedNodeIdRef.current && lastLoggedNodeIdRef.current !== nodeId) {
      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (durationSec > 0) {
        logInteraction({
          node_id: lastLoggedNodeIdRef.current,
          interaction_type: 'view',
          duration_sec: durationSec
        }).catch(console.error);
      }
    }

    startTimeRef.current = Date.now();
    lastLoggedNodeIdRef.current = nodeId;
    
    // 페이지 진입 시 초기 VIEW 로그 기록
    logInteraction({
      node_id: nodeId,
      interaction_type: 'view',
      duration_sec: 0
    }).catch(console.error);

    return () => {
      // 컴포넌트 언마운트 시 체류 시간 로그 기록
      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (durationSec > 0 && lastLoggedNodeIdRef.current) {
        logInteraction({
          node_id: lastLoggedNodeIdRef.current,
          interaction_type: 'view',
          duration_sec: durationSec
        }).catch(console.error);
      }
    };
  }, [nodeId]);
}

