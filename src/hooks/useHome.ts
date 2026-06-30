/**
 * useHome Hook
 */

import { useEffect } from 'react';
import { useHomeStore, HomeStore } from '@store/home.store';
import { HomeService } from '@services/home/home.service';
import { Logger } from '@utils/logger';

const logger = Logger.getInstance();
const SCOPE = 'useHome';

export function useHome(): HomeStore & { initialize: () => Promise<void> } {
  const store = useHomeStore();

  const initialize = async (): Promise<void> => {
    try {
      logger.debug(SCOPE, 'Initializing home page');
      store.setLoading(true);

      // Fetch all data in parallel
      const [tasks, actions, providers, status] = await Promise.all([
        HomeService.getRecentTasks(),
        HomeService.getSuggestedActions(),
        HomeService.getAIProviders(),
        HomeService.getSystemStatus(),
      ]);

      // Update store
      store.setRecentTasks(tasks);
      store.setSuggestedActions(actions);
      store.setAIProviders(providers);
      store.setSystemStatus(status);

      logger.info(SCOPE, 'Home page initialized');
    } catch (error) {
      logger.error(SCOPE, 'Failed to initialize home page', error);
      store.setSystemStatus('error');
    } finally {
      store.setLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  return {
    ...store,
    initialize,
  };
}
