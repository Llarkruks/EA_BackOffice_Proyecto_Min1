
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- The .ts files of a component do NOT have the word ".component" in the file name 
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
- The .ts files of a service do NOT have the word ".service" in the file name 

## General
- All the variables, properties and code comments all in english.

## Data Manager - AI Operating Rules

When implementing or extending item types in Data Manager, follow this workflow strictly.

### Single Source of Truth

- The only place to decide per-item UI behavior is `src/app/core/models/items/index.ts`.
- Do NOT distribute item-type decisions across page/components when not necessary.
- Do NOT recreate separate configs for item type list, columns, or buttons in other files.

### Add New Item Type (AI Checklist)

1. Create a new model file in `src/app/core/models/items/`.
  - Define `XItem`, `CreateXPayload`, `UpdateXPayload`.
2. Update `src/app/core/models/items/index.ts`:
  - Export the new model/payload types.
  - Register the item key in `ItemModelByType`.
  - Register payload maps in `CreatePayloadByType` and `UpdatePayloadByType`.
  - Add UI definition in `ITEM_UI_CONFIG`:
    - `label`
    - `addButtonLabel`
    - `previewColumns`
    - `actions` (`edit`, `delete`, `toggleEnabled`)
    - `search` (`enabled`, `key`, `placeholder`)
3. Keep service/page/components generic.
  - Prefer consuming centralized config, not hardcoded `if/else` per type.

### Guardrails

- If a behavior can be solved by `ITEM_UI_CONFIG`, implement it there first.
- If extra logic is required in page/components, keep it minimal and generic.
- Avoid introducing new duplicated enums/types for item keys.
- After changes, validate with `npm run build`.
