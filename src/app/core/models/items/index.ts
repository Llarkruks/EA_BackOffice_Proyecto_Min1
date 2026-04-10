import { CreatePointPayload, PointItem, UpdatePointPayload } from './Point';
import { CreateRoutePayload, RouteItem, UpdateRoutePayload } from './Route';
import { CreateUserPayload, UpdateUserPayload, UserItem } from './User';

export type {
  PointItem,
  CreatePointPayload,
  UpdatePointPayload,
  RouteItem,
  CreateRoutePayload,
  UpdateRoutePayload,
  UserItem,
  CreateUserPayload,
  UpdateUserPayload
};
export type { RouteDifficulty } from './Route';

export interface ItemModelBase {
  _id: string;
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface ItemModelByType {
  users: UserItem;
  routes: RouteItem;
  points: PointItem;
}

export type ItemType = keyof ItemModelByType;
export type ItemModel = ItemModelByType[ItemType];

export interface ItemTypeOption {
  value: ItemType;
  label: string;
}

export interface ItemPreviewColumn {
  key: string;
  label: string;
}

export interface ItemActionConfig {
  edit: boolean;
  delete: boolean;
  toggleEnabled: boolean;
}

export interface ItemSearchConfig {
  enabled: boolean;
  key: string;
  placeholder: string;
}

export interface ItemUiConfig {
  label: string;
  addButtonLabel: string;
  previewColumns: ItemPreviewColumn[];
  actions: ItemActionConfig;
  search: ItemSearchConfig;
}

export interface CreatePayloadByType {
  users: CreateUserPayload;
  routes: CreateRoutePayload;
  points: CreatePointPayload;
}

export interface UpdatePayloadByType {
  users: UpdateUserPayload;
  routes: UpdateRoutePayload;
  points: UpdatePointPayload;
}

export const ITEM_UI_CONFIG: Record<ItemType, ItemUiConfig> = {
  users: {
    label: 'Users',
    addButtonLabel: 'Add user',
    previewColumns: [
      { key: 'name', label: 'Name' },
      { key: 'username', label: 'Username' },
      { key: 'email', label: 'Email' },
      { key: 'enabled', label: 'Status' }
    ],
    actions: {
      edit: true,
      delete: true,
      toggleEnabled: true
    },
    search: {
      enabled: true,
      key: 'name',
      placeholder: 'Search users by name...'
    }
  },
  routes: {
    label: 'Routes',
    addButtonLabel: 'Add route',
    previewColumns: [
      { key: 'name', label: 'Name' },
      { key: '_id', label: 'ID' }
    ],
    actions: {
      edit: true,
      delete: true,
      toggleEnabled: false
    },
    search: {
      enabled: true,
      key: 'city',
      placeholder: 'Search routes by city...'
    }
  },
  points: {
    label: 'Points',
    addButtonLabel: 'Add point',
    previewColumns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'index', label: 'Index' },
      { key: '_id', label: 'ID' }
    ],
    actions: {
      edit: true,
      delete: true,
      toggleEnabled: false
    },
    search: {
      enabled: false,
      key: '',
      placeholder: 'Search...'
    }
  }
};

export const ITEM_TYPE_OPTIONS: ItemTypeOption[] = Object.entries(ITEM_UI_CONFIG).map(([value, config]) => ({
  value: value as ItemType,
  label: config.label
}));

export function normalizeItemByType<TType extends ItemType>(
  type: TType,
  value: Record<string, unknown>
): ItemModelByType[TType] {
  if (type === 'users') {
    return normalizeUser(value) as ItemModelByType[TType];
  }

  if (type === 'routes') {
    return normalizeRoute(value) as ItemModelByType[TType];
  }

  return normalizePoint(value) as ItemModelByType[TType];
}

export function normalizeManyByType<TType extends ItemType>(
  type: TType,
  values: Record<string, unknown>[]
): ItemModelByType[TType][] {
  return values.map((value) => normalizeItemByType(type, value));
}

function normalizeUser(value: Record<string, unknown>): UserItem {
  const id = getItemId(value);

  return {
    ...value,
    _id: id,
    id,
    name: getStringValue([value['name']], id),
    surname: getStringValue([value['surname']], ''),
    username: getStringValue([value['username']], ''),
    email: getStringValue([value['email']], ''),
    enabled: getBooleanValue(value['enabled'], true),
    role: getStringValue([value['role']], 'user') as UserItem['role']
  };
}

function normalizeRoute(value: Record<string, unknown>): RouteItem {
  const id = getItemId(value);

  return {
    ...value,
    _id: id,
    id,
    name: getStringValue([value['name']], id),
    description: getStringValue([value['description']], ''),
    city: getStringValue([value['city']], ''),
    country: getStringValue([value['country']], ''),
    distance: getNumberValue([value['distance']], 0),
    duration: getNumberValue([value['duration']], 0),
    difficulty: getStringValue([value['difficulty']], 'easy') as RouteItem['difficulty'],
    tags: getStringArray(value['tags']),
    userId: getStringValue([value['userId'], value['user']], '')
  };
}

function normalizePoint(value: Record<string, unknown>): PointItem {
  const id = getItemId(value);

  return {
    ...value,
    _id: id,
    id,
    name: getStringValue([value['name']], id),
    description: getStringValue([value['description']], ''),
    latitude: getNumberValue([value['latitude']], 0),
    longitude: getNumberValue([value['longitude']], 0),
    image: getStringValue([value['image']], ''),
    routeId: getStringValue([value['routeId'], value['route']], ''),
    index: getNumberValue([value['index']], 0)
  };
}

function getItemId(value: Record<string, unknown>): string {
  return getStringValue([value['_id'], value['id']], '');
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => getStringValue([item], ''))
    .filter((item) => item.trim().length > 0);
}

function getStringValue(values: unknown[], fallback: string): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function getNumberValue(values: unknown[], fallback: number): number {
  for (const value of values) {
    const numberValue = typeof value === 'number' ? value : Number(value);

    if (Number.isFinite(numberValue)) {
      return numberValue;
    }
  }

  return fallback;
}

function getBooleanValue(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return fallback;
}
