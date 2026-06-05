# Modern Icon Kits Research

Purpose: identify famous, modern icon libraries/kits that can replace an emoji-only app design with customizable SVG icons, modern symbols, or open-source emojis.

Target app context: Expo / React Native expense tracker. The current app uses emoji-heavy category/tab affordances, so the best future replacement should be easy to theme with the app's semantic color tokens, work with SVG or React Native SVG, and have enough symbols for categories, actions, settings, finance, food, travel, health, and dashboard UI.

## Selection criteria

Each finalized kit below was checked against these criteria:

1. **Modern, clean aesthetic**: suitable for a polished mobile finance app.
2. **High tweakability**: color, stroke width, fill, shape, or SVG/CSS customization is practical.
3. **Large symbol/emoji variety**: enough breadth to replace emoji-only visual language across the app.

## Quick recommendation

Best starting point for this app:

1. **Lucide** for most UI symbols and category icons.
2. **Phosphor Icons** if the app needs multiple visual weights or a friendlier rounded personality.
3. **OpenMoji** only if the goal is to keep an emoji-like style but make it consistent and SVG-based.
4. **Iconify** as a discovery/asset source when one library does not have the exact symbol needed.

For the Expense Tracker specifically, I would start with **Lucide** or **Phosphor**, then reserve **OpenMoji** for playful category illustrations if the app still wants emoji energy.

---

## 1. Lucide

Source links:

- Website: https://lucide.dev
- GitHub: https://github.com/lucide-icons/lucide
- React Native package: `lucide-react-native`
- Static SVG package: `lucide-static`

Verified facts:

- GitHub description: "Beautiful & consistent icon toolkit made by the community. Open-source project and a fork of Feather Icons."
- `lucide-react-native` npm license: `ISC`.
- `lucide-static` npm license: `ISC`.
- `lucide-static@1.17.0` package inspection showed **1,965 SVG files**.

Criteria check:

- Modern clean aesthetic: **Pass**.
  - Thin-line, Feather-inspired style.
  - Minimal, geometric, and readable at small mobile sizes.
  - Good fit for finance/productivity UI.
- High tweakability: **Pass**.
  - SVG line icons are easy to recolor.
  - Stroke width can be adjusted.
  - React Native package accepts icon props such as `color`, `size`, and `strokeWidth`.
  - Raw SVG can be edited directly if needed.
- Variety: **Pass**.
  - Around 2k SVG assets in the static package.
  - Strong coverage for UI actions, navigation, settings, finance, shopping, food-ish categories, travel, health, charts, and general app symbols.

Pros:

- Excellent match for the app's current modern slate/blue theme.
- Very easy to theme through semantic tokens like `colors.primary`, `colors.textMuted`, and `colors.expense`.
- Has a dedicated React Native package, which reduces integration friction.
- Stroke-based icons look clean in both light and dark mode.
- Large enough catalog without feeling visually inconsistent.

Cons:

- Mostly outline-line style; less expressive if the goal is colorful category illustration.
- Some food/object icons may feel generic compared with full emoji sets.
- If every icon uses the same stroke weight, category icons may need colored badges/backgrounds for personality.

License type:

- **ISC License**.
- Practical meaning: permissive open-source license, generally friendly for commercial apps. Keep copyright/license notices.

React Native integration notes:

```bash
npm install lucide-react-native
```

Example:

```tsx
import { Wallet, Utensils, Settings } from 'lucide-react-native';

<Wallet color={colors.primary} size={22} strokeWidth={2.25} />
<Utensils color={colors.textSecondary} size={20} strokeWidth={2} />
<Settings color={colors.textMuted} size={20} strokeWidth={2} />
```

Best use in this app:

- Tab bar icons.
- Category selector icons.
- Settings rows.
- Dashboard cards.
- Buttons and empty states.

---

## 2. Phosphor Icons

Source links:

- Website: https://phosphoricons.com
- GitHub: https://github.com/phosphor-icons/core
- Core package: `@phosphor-icons/core`
- React package: `@phosphor-icons/react`
- React Native package exists in the Phosphor ecosystem: `phosphor-react-native` / current package availability should be checked before implementation.

Verified facts:

- `@phosphor-icons/react` npm description: "A clean and friendly icon family for React".
- `@phosphor-icons/core` npm license: `MIT`.
- GitHub license for `phosphor-icons/core`: `MIT`.
- `@phosphor-icons/core@2.1.1` package inspection showed **9,072 SVG files**.
  - This high number comes from many icons across multiple weights/styles.

Criteria check:

- Modern clean aesthetic: **Pass**.
  - Rounded, friendly, polished visual style.
  - More personality than Lucide while still professional.
  - Good for apps that want a softer, more approachable design.
- High tweakability: **Pass**.
  - Multiple built-in weights/styles such as thin, light, regular, bold, fill, and duotone.
  - Color can be changed through props/SVG.
  - Weight can be used as a design variable instead of editing raw paths.
  - Duotone/fill options allow category icons to look richer than pure outline icons.
- Variety: **Pass**.
  - Very broad catalog due to multiple weights and many base symbols.
  - Strong coverage for app UI, finance, food, transport, shopping, health, travel, charts, and interface actions.

Pros:

- Best kit here for **visual flexibility** because weights can change the whole feel without changing icon families.
- Duotone and fill styles can help category icons stand out from regular UI controls.
- Friendly and modern without being childish.
- MIT license is straightforward.

Cons:

- More style choices mean future bots must define rules, or the app may become inconsistent.
- React Native package naming/versioning should be confirmed immediately before installing.
- Duotone/fill icons may require stricter dark-mode checks than simple line icons.

License type:

- **MIT License**.
- Practical meaning: permissive open-source license, generally friendly for commercial apps. Keep copyright/license notices.

React Native integration notes:

Before implementation, verify the current React Native package name/version. A common ecosystem option has been:

```bash
npm install phosphor-react-native
```

Example style target:

```tsx
// Pseudocode; confirm package API before implementation.
<Wallet color={colors.primary} size={24} weight="duotone" />
<ShoppingBag color={colors.textSecondary} size={22} weight="regular" />
```

Best use in this app:

- Category icons where a slightly more expressive style is useful.
- Dashboard gauges/cards.
- Settings and action icons.
- Replacing emoji tabs while keeping a softer look.

---

## 3. Iconify

Source links:

- Website: https://iconify.design
- Icon set browser: https://icon-sets.iconify.design
- GitHub icon sets repo: https://github.com/iconify/icon-sets
- React package: `@iconify/react`
- JSON package: `@iconify/json`

Verified facts:

- GitHub description for `iconify/icon-sets`: "200+ open source icon sets. Icons are validated, cleaned up, optimised, ready to render as SVG. Updated automatically several times a week."
- `@iconify/react` npm license: `MIT`.
- `@iconify/json` npm description: "Hundreds of open source icon sets in IconifyJSON format".
- `@iconify/json@2.2.483` package inspection showed:
  - **233 collections**.
  - **315,157 icons** total.
- License note: Iconify tooling is MIT, but individual icon sets keep their own licenses.

Criteria check:

- Modern clean aesthetic: **Pass, with selection discipline**.
  - Iconify is an aggregator, not one single visual style.
  - It includes many modern sets such as Material Symbols, Tabler, Solar, Carbon, Fluent, Heroicons, Phosphor-like sets, and many more.
  - The app must choose one primary collection or a small curated subset to stay visually consistent.
- High tweakability: **Pass**.
  - Icons are normalized into SVG/icon data.
  - Color, size, stroke/fill behavior, CSS, and SVG output can be controlled depending on the selected icon set.
  - Raw path data can be used with `react-native-svg` if needed.
- Variety: **Strong pass**.
  - The largest variety by far.
  - Useful when a single icon family does not include a very specific symbol.

Pros:

- Massive icon coverage.
- Great for research and discovery before choosing a final icon family.
- Can pull from many famous open-source sets.
- Good fallback source for rare category symbols.
- JSON data can be transformed into custom SVG components if the app wants full control.

Cons:

- Visual consistency risk: mixing collections can make the app look messy.
- License complexity: each collection can have a different license.
- React Native integration may be less direct than Lucide; may require `react-native-svg` conversion or a package that supports native rendering.
- Too much choice can slow design decisions.

License type:

- **Iconify tooling/packages: MIT**.
- **Individual icons: varies by source collection**.
  - Examples found in `@iconify/json` metadata include MIT, OFL, CC BY-SA 4.0, and others.
- Practical rule: when using Iconify, document the exact collection and license for every chosen collection.

React Native integration notes:

For Expo/React Native, do not assume the web React component is the best path. Safer options:

- Use Iconify as a source/reference and copy selected SVG paths into `react-native-svg` components.
- Or use a React Native compatible Iconify renderer if verified for the current Expo SDK.
- Keep selected icons from one collection wherever possible.

Best use in this app:

- Researching final icon direction.
- Filling gaps when Lucide or Phosphor does not have the right category icon.
- Building a custom internal `CategoryIcon` component from curated SVGs.

---

## 4. OpenMoji

Source links:

- Website: https://openmoji.org
- GitHub: https://github.com/hfg-gmuend/openmoji
- npm package: `openmoji`

Verified facts:

- GitHub description: "Open source emojis for designers, developers and everyone else!"
- GitHub license: `CC-BY-SA-4.0`.
- npm package license: `CC-BY-SA-4.0`.
- Official data file inspection showed **4,495 emoji entries**.
- `openmoji@17.0.0` package inspection showed **11,458 SVG files**.
  - This includes multiple SVG variants/assets, not necessarily 11,458 unique emoji concepts.

Criteria check:

- Modern clean aesthetic: **Pass if the desired style is playful/open emoji**.
  - Consistent emoji illustration style.
  - More colorful and expressive than line icons.
  - Less minimal than Lucide/Phosphor.
- High tweakability: **Pass, with more manual effort**.
  - SVG assets can be edited directly.
  - Colors and shapes are tweakable through SVG code.
  - However, multi-color emoji SVGs are more complex to theme dynamically than single-color line icons.
- Variety: **Pass**.
  - Thousands of emoji entries covering food, objects, transport, people, symbols, flags, and activities.
  - Strong choice if the app wants to preserve emoji-like category meaning while making assets consistent.

Pros:

- Best replacement if the goal is **consistent open-source emoji**, not plain UI icons.
- Strong category coverage for food, travel, shopping-like objects, health, and everyday items.
- SVG assets make it possible to avoid platform-specific emoji rendering differences.
- Good for playful category badges or illustrations.

Cons:

- CC BY-SA license is less permissive than MIT/ISC.
- Attribution/share-alike obligations need care, especially for commercial apps or redistributed modified assets.
- Multi-color SVGs are harder to theme for light/dark mode.
- May look too playful for a clean finance app if used everywhere.

License type:

- **Creative Commons Attribution-ShareAlike 4.0 International / CC BY-SA 4.0**.
- Practical meaning: attribution is required, and modified/shared versions may need to remain under the same license. Review license obligations before shipping modified assets.

React Native integration notes:

Possible approaches:

- Import selected SVGs through an SVG transformer.
- Convert chosen OpenMoji assets into `react-native-svg` components.
- Use them only for category badges/illustrations while keeping UI actions in Lucide or Phosphor.

Best use in this app:

- Category icons if the user wants to keep an emoji-like feel.
- Empty-state illustrations.
- Occasional playful visual accents.

---

## Final comparison

### Lucide

- Meets criteria: **Yes**.
- Best for: clean mobile UI icons and consistent app-wide replacement for emoji tabs/categories.
- License: **ISC**.
- Biggest advantage: direct React Native package plus simple stroke/color customization.
- Biggest risk: less expressive than emoji for categories.

### Phosphor Icons

- Meets criteria: **Yes**.
- Best for: modern UI with more personality and multiple weights.
- License: **MIT**.
- Biggest advantage: thin/light/regular/bold/fill/duotone flexibility.
- Biggest risk: style inconsistency if weights are mixed without rules.

### Iconify

- Meets criteria: **Yes**.
- Best for: huge symbol discovery and filling gaps.
- License: **MIT for tooling; individual icon licenses vary**.
- Biggest advantage: 300k+ icons across 200+ collections.
- Biggest risk: inconsistent visuals and per-collection license tracking.

### OpenMoji

- Meets criteria: **Yes, for open-source emoji replacement**.
- Best for: replacing platform emoji with consistent SVG emoji assets.
- License: **CC BY-SA 4.0**.
- Biggest advantage: thousands of consistent open emoji SVGs.
- Biggest risk: license obligations and harder dynamic theming.

## Recommended direction for this app

Recommended implementation strategy:

1. Use **Lucide** as the default icon system.
   - It is clean, modern, React Native friendly, and easy to theme.
2. Consider **Phosphor** if the design needs more warmth or duotone category icons.
3. Use **OpenMoji** only for selected category badges if the user wants to preserve the emoji vibe.
4. Use **Iconify** as a research/source library, but avoid mixing many Iconify collections in the final UI.

Suggested app design rule:

```txt
UI/action icons: Lucide or Phosphor line icons
Category icons: same family, optionally inside colored badges
Playful category illustrations: optional OpenMoji only
Rare missing symbols: source from one Iconify collection and document its license
```

## Implementation notes for future Expo work

- The app already has `react-native-svg` installed, so SVG-based icon components are feasible.
- The app already has `@expo/vector-icons`, but a custom SVG icon kit can look more modern and consistent than mixed emoji/text glyphs.
- If adding a new icon package, run:

```bash
npm install <package>
npm run typecheck -- --pretty false
npx expo-doctor
```

- After installing a new icon package, restart Metro cleanly:

```bash
npx expo start -c
```

- Use semantic theme tokens for icon colors:

```tsx
color={colors.textMuted}
color={colors.primary}
color={colors.expense}
```

- Prefer one internal wrapper component, for example:

```tsx
<CategoryIcon categoryId="food" color={colors.primary} size={22} />
```

That keeps future icon-family swaps localized instead of scattering imports across every screen.

## Verification performed

Research verification used:

- GitHub repository metadata for project descriptions, popularity, and license signals.
- Raw GitHub license files for Lucide, Heroicons, Phosphor, and OpenMoji.
- npm package metadata for package descriptions and declared licenses.
- npm package inspection for icon/SVG counts:
  - `lucide-static@1.17.0`: 1,965 SVG files.
  - `@phosphor-icons/core@2.1.1`: 9,072 SVG files.
  - `openmoji@17.0.0`: 11,458 SVG files.
  - `@iconify/json@2.2.483`: 233 collections and 315,157 icons.
- OpenMoji official data file count: 4,495 emoji entries.

## Shortlist conclusion

If the goal is to make the Expense Tracker look more like a polished modern app, pick **Lucide** first.

If the goal is to keep a friendly, expressive personality, pick **Phosphor**.

If the goal is to keep emoji semantics but remove platform emoji inconsistency, pick **OpenMoji** for category-only visuals.

If the goal is maximum symbol coverage, use **Iconify** for research and carefully curated one-off assets.
