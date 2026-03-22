export type Round = {
  votes: Record<string, string>; // { "VoterName": "OptionA" }
};

export type Poll = {
  code: string;
  options: string[]; // Currently active options
  eliminated: string[];
  rounds: Round[]; // History of rounds
  status: 'nominating' | 'voting' | 'finished';
  nominations: Record<string, { title: string | null }>;
  winner: string | null;
};

// Global object to persist data across hot-reloads in dev and requests in production
const globalForStore = global as unknown as { polls: Record<string, Poll> };
export const polls = globalForStore.polls || {};
if (process.env.NODE_ENV !== 'production') globalForStore.polls = polls;
