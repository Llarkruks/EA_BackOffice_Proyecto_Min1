import {
  UpdatePointPayload,
  UpdateRoutePayload,
  UpdateUserPayload
} from '../../../core/models/items';

export function buildUserInlineUpdatePayload(changes: Record<string, string>): UpdateUserPayload {
  const payload: UpdateUserPayload = {};

  if ('name' in changes) payload.name = changes['name'].trim();
  if ('surname' in changes) payload.surname = changes['surname'].trim();
  if ('username' in changes) payload.username = changes['username'].trim();
  if ('email' in changes) payload.email = changes['email'].trim();
  if ('enabled' in changes) payload.enabled = changes['enabled'].trim().toLowerCase() === 'true';
  if ('role' in changes) payload.role = changes['role'].trim().toLowerCase() === 'admin' ? 'admin' : 'user';
  if ('password' in changes && changes['password'].trim().length > 0) {
    payload.password = changes['password'].trim();
  }

  return payload;
}

export function buildRouteInlineUpdatePayload(changes: Record<string, string>): UpdateRoutePayload {
  const payload: UpdateRoutePayload = {};

  if ('name' in changes) payload.name = changes['name'].trim();
  if ('description' in changes) payload.description = changes['description'].trim();
  if ('city' in changes) payload.city = changes['city'].trim();
  if ('country' in changes) payload.country = changes['country'].trim();

  if ('distance' in changes) {
    const value = Number(changes['distance']);
    if (Number.isFinite(value)) payload.distance = value;
  }

  if ('duration' in changes) {
    const value = Number(changes['duration']);
    if (Number.isFinite(value)) payload.duration = value;
  }

  if ('difficulty' in changes) {
    const difficulty = changes['difficulty'].trim().toLowerCase();
    payload.difficulty = difficulty === 'medium' || difficulty === 'hard' ? difficulty : 'easy';
  }

  if ('tags' in changes) {
    payload.tags = changes['tags']
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if ('userId' in changes) payload.userId = changes['userId'].trim();

  return payload;
}

export function buildPointInlineUpdatePayload(changes: Record<string, string>): UpdatePointPayload {
  const payload: UpdatePointPayload = {};

  if ('name' in changes) payload.name = changes['name'].trim();
  if ('description' in changes) payload.description = changes['description'].trim();

  if ('latitude' in changes) {
    const value = Number(changes['latitude']);
    if (Number.isFinite(value)) payload.latitude = value;
  }

  if ('longitude' in changes) {
    const value = Number(changes['longitude']);
    if (Number.isFinite(value)) payload.longitude = value;
  }

  if ('image' in changes) payload.image = changes['image'].trim();
  if ('routeId' in changes) payload.routeId = changes['routeId'].trim();

  if ('index' in changes) {
    const value = Number(changes['index']);
    if (Number.isFinite(value)) payload.index = value;
  }

  return payload;
}
