import { Candidate, ElectionConfig } from '../types';

export const ELECTION_CONFIG: ElectionConfig = {
  schoolName: "Peki Senior High School",
  electionTitle: "2025 Prefectorial Elections",
  date: "Oct 3, 2025",
  startTime: "09:00 AM"
};

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: 'Kwame Mensah',
    position: 'School Prefect',
    photoUrl: 'https://picsum.photos/200/200?random=1',
    manifestoShort: 'Discipline, Integrity, and Academic Excellence.',
    votes: 145
  },
  {
    id: 'c2',
    name: 'Sarah Osei',
    position: 'School Prefect',
    photoUrl: 'https://picsum.photos/200/200?random=2',
    manifestoShort: 'Empowering students through technology and arts.',
    votes: 189
  },
  {
    id: 'c3',
    name: 'Daniel Boateng',
    position: 'School Prefect',
    photoUrl: 'https://picsum.photos/200/200?random=3',
    manifestoShort: 'Sports development and campus sanitation.',
    votes: 120
  },
  {
    id: 'c4',
    name: 'Grace Addo',
    position: 'Girls Prefect',
    photoUrl: 'https://picsum.photos/200/200?random=4',
    manifestoShort: 'Advocating for better hygiene facilities.',
    votes: 210
  },
  {
    id: 'c5',
    name: 'Abena Kusi',
    position: 'Girls Prefect',
    photoUrl: 'https://picsum.photos/200/200?random=5',
    manifestoShort: 'Unity and sisterhood among all halls.',
    votes: 195
  }
];

// Simulating a valid voter database
export const VALID_VOTER_IDS = ['102030', '405060', '708090', 'admin'];
