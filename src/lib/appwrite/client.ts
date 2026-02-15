/**
 * Client-side Appwrite SDK instance.
 * Used for authentication and browser-side operations.
 * Singleton pattern — one instance per browser session.
 */

import { Client, Account } from 'appwrite';

let client: Client | null = null;
let account: Account | null = null;

function getClient(): Client {
  if (client) {return client;}

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

  if (!endpoint || !projectId) {
    throw new Error(
      'Missing Appwrite client env vars: NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID'
    );
  }

  client = new Client().setEndpoint(endpoint).setProject(projectId);
  return client;
}

export function getAppwriteAccount(): Account {
  if (account) {return account;}
  account = new Account(getClient());
  return account;
}

export function getAppwriteClient(): Client {
  return getClient();
}
