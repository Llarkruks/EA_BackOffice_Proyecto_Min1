export type RouteDifficulty = 'easy' | 'medium' | 'hard';

export interface RouteItem {
  _id: string;
  name: string;
  description: string;
  city: string;
  country: string;
  distance: number;
  duration: number;
  difficulty: RouteDifficulty;
  tags: string[];
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  // [key: string]: unknown; // Uncomment if you want to allow additional properties
}

export interface CreateRoutePayload {
  name: string;
  description: string;
  city: string;
  country: string;
  distance: number;
  duration: number;
  difficulty: RouteDifficulty;
  tags: string[];
  userId: string;
}

export type UpdateRoutePayload = Partial<CreateRoutePayload>;