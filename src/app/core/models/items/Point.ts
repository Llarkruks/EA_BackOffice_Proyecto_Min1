export interface PointItem {
  _id: string;
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  image?: string;
  routeId: string;
  index: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface CreatePointPayload {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  image?: string;
  routeId: string;
  index: number;
}

export type UpdatePointPayload = Partial<CreatePointPayload>;