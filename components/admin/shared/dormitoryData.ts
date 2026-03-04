export interface Dormitory {
  id: string;
  houseId: string;
  name: string;
  capacity: number;
}

export const initialDormitories: Dormitory[] = [
    // Ansa-Sasraku House
    { id: 'd1', houseId: 'h1', name: 'Room A1', capacity: 4 },
    { id: 'd2', houseId: 'h1', name: 'Room A2', capacity: 4 },
    { id: 'd3', houseId: 'h1', name: 'Room A3', capacity: 6 },
    // Dickson House
    { id: 'd4', houseId: 'h2', name: 'Room B1', capacity: 8 },
    { id: 'd5', houseId: 'h2', name: 'Room B2', capacity: 8 },
];
