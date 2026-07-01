# Remove "Entrar" Nav Link Design

**Date:** 2026-06-30
**Topic:** Remove the now-irrelevant "Entrar" login button from the site nav.

## 1. Goal & context

Knockout predictions now use the on-page name dropdown (no access code). The
`/entrar` route's name+code flow is no longer how participants enter, and
nobody remembers codes. Keep the route itself (existing users' cookies and
bookmarks still work; the `/predicciones/grupos` and `/predicciones/partidos`
gates still `redirect("/entrar")` harmlessly) — just stop advertising it
in the navbar so new visitors aren't sent to a useless login page.

## 2. Scope

Only **`app/components/NavLinks.tsx`**. Remove the `Entrar` entry from the
`navItems` array. No other files touched. The `/entrar` route directory stays.

## 3. Change

In the `navItems` array, delete:

```ts
  { href: "/entrar", label: "Entrar", icon: "👋", match: "startsWith" },
```

The generic `Link` renderer iterates `navItems` and emits one pill per item;
removing this entry means one fewer pill ("Entrar") in the navbar. The
`/predicciones` dropdown is special-cased separately and is unaffected.

## 4. Risks

- None material. The route is not deleted, so existing redirects/cookies still
  work. No participant-facing flow depends on the "Entrar" pill being visible.

## 5. Testing

- `npx tsc --noEmit` must pass.
- `npm run build` must succeed.
- Manual: navbar no longer shows an "Entrar" pill; all other pills render.