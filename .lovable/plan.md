## Fix hover cursor across merchant app

Cursor stays as the default arrow when hovering buttons, tabs, chips, dropdown triggers, table row actions, sidebar items, etc. Browsers only apply `cursor: pointer` to `<a href>` by default — every `<button>`, clickable `<div>`, `<label>` toggle and `[role=button]` needs it explicitly.

### Approach — one global rule, no per-component edits

Add a base-layer rule in `src/index.css` so every interactive element in the app (not just merchant) gets the pointer cursor, and disabled elements get the not-allowed cursor.

```css
@layer base {
  button:not(:disabled),
  [role="button"]:not([aria-disabled="true"]),
  summary,
  label[for],
  input[type="checkbox"],
  input[type="radio"],
  input[type="submit"],
  input[type="button"],
  select {
    cursor: pointer;
  }

  button:disabled,
  [role="button"][aria-disabled="true"],
  [disabled] {
    cursor: not-allowed;
  }
}
```

This fixes every merchant page in one shot: sidebar toggles, mode switch, business switcher, tab pills, table sort headers, drawer close buttons, filter chips, action menu items, "View Breakdown", withdraw/edit/delete icon buttons, etc.

### Verification

- Hover the mode toggle, sidebar section headers, `View Breakdown`, filter chips, close/delete icons, and disabled `Submit` buttons — pointer on enabled, not-allowed on disabled.
- Confirm no regression on inputs (text/date/number keep the I-beam because they aren't matched).