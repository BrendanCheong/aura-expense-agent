import MemoryClient from 'mem0ai';

let mem0Instance: MemoryClient | null = null;

export function getMem0Client(): MemoryClient {
  const apiKey = process.env.MEM0_API_KEY;
  if (!apiKey) {
    throw new Error('MEM0_API_KEY is not defined');
  }
  if (!mem0Instance) {
    mem0Instance = new MemoryClient({ apiKey });
  }
  return mem0Instance;
}
