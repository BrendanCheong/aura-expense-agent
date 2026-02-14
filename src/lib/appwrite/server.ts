/**
 * Server-side Appwrite SDK instance.
 * Uses the Node SDK with API key for admin-level access.
 * Singleton pattern — one instance per process.
 */

import { Client, TablesDB } from 'node-appwrite';

interface AppwriteServerInstance {
  client: Client;
  tablesDb: TablesDB;
}

let instance: AppwriteServerInstance | null = null;

export function getAppwriteServer(): AppwriteServerInstance {
  if (instance) return instance;

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;

  if (!endpoint) {
    throw new Error('Missing required env var: NEXT_PUBLIC_APPWRITE_ENDPOINT');
  }
  if (!projectId) {
    throw new Error('Missing required env var: NEXT_PUBLIC_APPWRITE_PROJECT_ID');
  }
  if (!apiKey) {
    throw new Error('Missing required env var: APPWRITE_API_KEY');
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const tablesDb = new TablesDB(client);

  instance = { client, tablesDb };
  return instance;
}

/**
 * Reset the singleton. Only use in tests.
 */
export function resetAppwriteServer(): void {
  instance = null;
}
