import { RouteDifficulty, UserItem } from '../../../core/models/items';

export type UserFormValue = {
  name: string;
  surname: string;
  username: string;
  email: string;
  password: string;
  enabled: boolean;
  role: UserItem['role'];
};

export type RouteFormValue = {
  name: string;
  description: string;
  city: string;
  country: string;
  distance: number | null;
  duration: number | null;
  difficulty: RouteDifficulty;
  tags: string;
  userId: string;
};

export type PointFormValue = {
  name: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  image: string;
  routeId: string;
  index: number | null;
};

export type QuestionFormValue = {
  title: string;
  description: string;
  pointId: string;
};