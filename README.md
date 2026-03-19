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

This project includes a configurable Data Manager table designed for different item types (`users`, `routes`, `points`, etc.).

### Core structure

- Item type definitions live in `src/app/core/models/item-type.ts`.
- Preview column configuration per item type lives in `src/app/core/models/item-table-config.ts`.
- Data loading/pagination/delete/update logic is in `src/app/features/data-manager/pages/data-manager-page/data-manager-page.ts`.
- Table rendering and selection UI are in `src/app/features/data-manager/components/data-table/`.
- Action buttons are componentized in:
	- `src/app/features/data-manager/components/item-action-buttons/toggle-enabled-action-button.ts`
	- `src/app/features/data-manager/components/item-action-buttons/delete-item-action-button.ts`
	- `src/app/features/data-manager/components/item-action-buttons/item-action-buttons.ts` (wrapper/compose)

### How table selection works

- Selected rows are tracked by `_id` in page state (`selectedIds` signal in `data-manager-page.ts`).
- Selection persists when switching pages.
- Selection is reset when changing the item type.

## Add a New Item Type

Follow these steps:

1. Add the new item type to `ItemType` in `src/app/core/models/item-type.ts`.
2. Add it to `typeOptions` in `src/app/features/data-manager/pages/data-manager-page/data-manager-page.ts`.
3. Add its preview config to `ITEM_TABLE_CONFIG` in `src/app/core/models/item-table-config.ts`.
4. Ensure your backend endpoint follows `/{type}` for list and `/{type}/{id}` for delete/update.

## Define Preview Properties

Preview properties are controlled by `ITEM_TABLE_CONFIG`:

```ts
users: {
	previewColumns: [
		{ key: 'name', label: 'Name' },
		{ key: 'username', label: 'Username' },
		{ key: 'email', label: 'Email' },
		{ key: 'enabled', label: 'Status' }
	]
}
```

Rules:

- The table displays up to 4 preview columns.
- Preview text is truncated by a configurable max length (`previewTextMaxLength`, default `30`).
- Missing preview columns are rendered as empty cells.

## Create Generic Action Buttons

Action buttons are standalone components, so they can be reused in any list/table.

### 1) Create a new button component

Create a button component in `src/app/features/data-manager/components/item-action-buttons/`, following the existing pattern:

- Inputs:
	- Item id or item object
	- Optional selection mode flag
- Output:
	- Event emitted to parent (`output<string>()` or custom payload)

### 2) Compose it in the actions wrapper

Import and render it in `item-action-buttons.ts` next to the existing buttons.

### 3) Bubble event to table/page

- Re-emit from `item-action-buttons.ts`.
- Handle it in `data-table.ts`.
- Call the API in `data-manager-page.ts` (through `DataService`).

## Assign Buttons to Any Item Type

The simplest way is to render buttons conditionally in `item-action-buttons.ts` based on item data.

Example:

```ts
showRouteOnlyAction(): boolean {
	return typeof this.item()['distance'] === 'number';
}
```

Then wrap the button in a template condition.

If you want stricter type-based control, pass the current item type from page -> table -> action-buttons and gate each button by that value.

## Current Built-in Buttons

- Delete button: red, trash icon, removes item by id.
- Toggle enabled button:
	- Checked checkbox icon when enabled (`☑`)
	- Empty checkbox icon when disabled (`☐`)
	- Sends update request to flip `enabled`.

# EA_BackOffice_Proyecto
