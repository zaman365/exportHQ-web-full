# 12 · Governance

## Ownership

| Area | Owner |
| --- | --- |
| Brand strategy, verbal identity, logo | Brand owner |
| Tokens, components, accessibility baseline | Design system maintainers |
| Surface implementation (`apps/*`) | The team shipping the surface |
| Tenant theming policy | Brand owner + platform security |

Anyone may propose a change. Only the owner of an area merges one.

## Versioning

The system is versioned with the repository. A change is one of:

| Type | Meaning | Requires |
| --- | --- | --- |
| **Patch** | A value corrected within an existing role (contrast fix, spacing nudge) | Review + contrast check |
| **Minor** | A new token, component or documented pattern | Review + docs update + checklist |
| **Major** | A role changes meaning, a token is removed, or the identity changes | Brand owner sign-off + migration note + deprecation period |

Token removals never happen in place. Alias for one release, mark deprecated with
a target release in a code comment, then remove.

## Proposing a change

1. **State the role.** Not "we need a lighter grey" but "we need a surface that
   sits between `--paper-1` and `--paper-2` because X".
2. **Check for an existing answer.** Most requests are already solved by a token
   or a component with a different name.
3. **Write the documentation first.** If the rule cannot be written clearly, the
   design is not finished.
4. **Implement against the token contract.** No raw values.
5. **Run the checklist.**
6. **Record it in the change log below.**

## Review checklist

Reject a change that fails any of these.

**Tokens**
- [ ] No raw hex, rgb, or px colour value in a component rule
- [ ] No Tier 1 primitive referenced directly by a component
- [ ] No new value that duplicates an existing role
- [ ] Spacing resolves to the 4px ladder
- [ ] Radius comes from the radius ladder

**Brand**
- [ ] `--signal` used only for action or change, under ~10% of the viewport
- [ ] Support hues used only in their documented role
- [ ] Type from the three approved families, weights from the four approved steps
- [ ] Mono only for machine-generated or aligned data
- [ ] Sentence case; no typed capitals
- [ ] Copy passes the "would I say this on a call" test

**Accessibility**
- [ ] Contrast verified for every new pair
- [ ] Keyboard reachable with visible focus
- [ ] Status carried by text as well as colour
- [ ] Reduced motion respected
- [ ] 320px and 200% zoom clean
- [ ] No text below the density floor for the surface

**Product-specific**
- [ ] ExportPanel change does not contradict the website's language
- [ ] Tenant theming touches only the four permitted tokens and the documented slots
- [ ] Demo or preview data is labelled as such

## Definition of done

A brand change is done when:

1. It is documented in the correct file in this directory.
2. It exists as a token where it is a value.
3. It is applied consistently across `apps/web`, `apps/app` and `apps/ops` — not
   just the surface that prompted it.
4. The checklist passes.
5. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass.

## Drift detection

Run these before any release. Each should return nothing.

```bash
# Raw hex outside the token files
grep -rn --include=globals.css -E '#[0-9a-fA-F]{3,8}' apps/*/app/globals.css

# Retired green / lime accents anywhere
grep -rniE '#(17694f|dce98a|e8f0a1|112a24|13372d|a64336|9b6512)' apps packages

# Typed capitals in JSX copy (candidates for text-transform)
grep -rnE '>[A-Z ]{6,}<' apps/*/app --include=*.tsx
```

Drift is normal and is not a failure — an undetected drift is. The four
near-identical ambers that this system consolidated existed because nobody was
running a check like this.

## Change log

| Date | Version | Change |
| --- | --- | --- |
| 2026-08-25 | 1.0.0 | Initial system. Twenty-brand benchmark; three-tier tokens; unified `packages/ui` foundation across web, ExportPanel and ops; ExportPanel rebranded off its green/lime palette onto the Signal system; tenant white-label layer defined and implemented; `--mint-ink` contrast correction; density floors raised. |
