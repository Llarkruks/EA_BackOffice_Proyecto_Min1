# BackofficeApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Data Manager Architecture

This project includes a configurable Data Manager table for different item types (`users`, `routes`, `points`, etc.) with a **single source of truth** in:

- `src/app/core/models/items/index.ts`

All per-item decisions must be defined there:

- Item type key (`users`, `routes`, `points`, ...)
- Sidebar label
- Add button label
- Preview columns (`previewColumns`)
- Enabled actions (`edit`, `delete`, `toggleEnabled`)
- Search behavior (`enabled`, `key`, `placeholder`)

## Add a New Item Type (Recommended Flow)

If you want a new type to appear in the sidebar and work in table list/actions, do this:

1. Create the model file in `src/app/core/models/items/` (for example `Vehicle.ts`), including:
	 - `VehicleItem`
	 - `CreateVehiclePayload`
	 - `UpdateVehiclePayload`
2. Export those types in `src/app/core/models/items/index.ts`.
3. Register the type in these maps in `index.ts`:
	 - `ItemModelByType`
	 - `CreatePayloadByType`
	 - `UpdatePayloadByType`
4. Add its UI config in `ITEM_UI_CONFIG` (same file), including columns and actions.

With this, the Data Manager will automatically use the new type in:

- Sidebar options (`ITEM_TYPE_OPTIONS` is derived from `ITEM_UI_CONFIG`)
- Table columns
- Action buttons visibility
- Search configuration

## Item UI Configuration Example

```ts
vehicles: {
	label: 'Vehicles',
	addButtonLabel: 'Add vehicle',
	previewColumns: [
		{ key: 'name', label: 'Name' },
		{ key: 'plate', label: 'Plate' },
		{ key: '_id', label: 'ID' }
	],
	actions: {
		edit: true,
		delete: true,
		toggleEnabled: false
	},
	search: {
		enabled: true,
		key: 'name',
		placeholder: 'Search vehicles by name...'
	}
}
```

## Backend Contract

The frontend `DataService` assumes generic endpoints by type:

- `GET /{type}`
- `POST /{type}`
- `PUT /{type}/{id}`
- `DELETE /{type}/{id}`

As long as your backend follows this contract, the generic Data Manager flow works.

# EA_BackOffice_Proyecto
