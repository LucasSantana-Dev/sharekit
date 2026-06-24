# Apple HIG (Human Interface Guidelines)

The reference for **platform-native iOS/macOS feel** and the foundational accessibility floor for any UI. Not a component catalogue — a principles + behavior + token document.

## Aesthetic identity

- **Tone**: native, deferential to content, materials-based, restrained chrome.
- **Use as anchor when**: building for iOS/macOS, web apps that should feel platform-native, or any product where Apple users are the primary audience.
- **Use as floor when**: building anything — HIG's accessibility, motion, and density rules apply across the board.

## Concrete tokens (iOS 17+ / macOS 14+ / 2026 baseline)

### Color (semantic system)

Apple uses semantic, not literal, colors. They adapt to dark mode + accessibility settings automatically:

```
- systemBackground        → primary surface
- secondarySystemBackground → grouped table sections, cards
- tertiarySystemBackground  → nested elements
- label                   → primary text
- secondaryLabel          → ~60% opacity text
- tertiaryLabel           → ~30% opacity text (use sparingly)
- separator               → 1px hairlines
- tint / accentColor      → user-settable (defaults blue) — use for interactive emphasis
```

When building web equivalents, mirror this semantic naming. Don't use raw colors; use intent.

### Typography (SF Pro)

- **System font**: SF Pro (Sans Display + Sans Text + Mono) — already on every Apple device
- **Web fallback**: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue"
- **Dynamic Type**: respect user's font size preference. On web, use `rem` units and avoid fixed `px` for body text.

iOS type scale (use these to feel native):

| Style | Size | Weight | Line height |
|---|---|---|---|
| Large Title | 34 | 700 | 1.2 |
| Title 1 | 28 | 700 | 1.2 |
| Title 2 | 22 | 700 | 1.25 |
| Title 3 | 20 | 600 | 1.25 |
| Headline | 17 | 600 | 1.3 |
| Body | 17 | 400 | 1.4 |
| Callout | 16 | 400 | 1.4 |
| Subhead | 15 | 400 | 1.4 |
| Footnote | 13 | 400 | 1.4 |
| Caption 1 | 12 | 400 | 1.4 |
| Caption 2 | 11 | 400 | 1.4 |

### Spacing

- Edge margin (iPhone): 16px portrait, 20px landscape
- Edge margin (iPad/Mac): 20-24px
- Section gap: 24-32px
- Item gap: 12-16px

### Touch / click targets

- **Minimum 44×44 pt** for any tap target on iOS
- **28×28 pt** acceptable for hover-precise targets on macOS (mouse)
- Add invisible padding to hit-test area if visual is smaller

### Radius

- 8-10px for cards
- 14-16px for sheets / large surfaces
- 22px for the "modal sheet" feel
- 999px for pills

### Motion

- **Default ease**: `cubic-bezier(0.4, 0, 0.2, 1)` — the system curve
- **Sheet present**: 0.4s ease-out
- **Hover/focus state**: 0.15-0.2s
- **No bounce** in modern HIG (post-iOS 16). Spring used only for direct manipulation.
- **Reduced motion**: always respect `prefers-reduced-motion`. Replace fades with instant transitions.

## Required behaviors

### Materials (translucency)

iOS/macOS use translucent materials in chrome (nav bars, sidebars, popovers). When emulating on web:

```css
.material-thick {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(20px);
}
```

Only on chrome / sticky elements, never on cards or content. Glass-on-glass is not Apple — it's the slop version of Apple.

### Safe areas

```css
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

### Hit slop

Visual target ≠ tap target. Use absolute-positioned overlays or generous padding to extend tap areas beyond visual bounds when the visual is < 44px.

## Anti-patterns in Apple's world

- ❌ Custom button shapes that fight the platform (highly rounded pills on macOS, sharp squares on iOS)
- ❌ Bottom navigation with > 5 items on iOS
- ❌ Modal dialogs that block the entire app — use sheets instead
- ❌ Disabled buttons without explanation (HIG requires explaining why)
- ❌ Non-semantic colors (using raw blue/red instead of `tintColor` / `systemRed`)
- ❌ Custom fonts in chrome (use system font for nav, tabs, system controls)

## Accessibility floor (applies everywhere, not just Apple)

- Contrast: 4.5:1 minimum for body text; 3:1 for large (18px+ or 14px+ bold)
- Touch target: 44×44 pt minimum
- Focus visible: 2px+ ring on all interactive elements
- Reduced motion: respected
- VoiceOver / screen reader: every interactive element labeled
- Keyboard: full navigation possible without mouse

## When to anchor here

✅ iOS/macOS app
✅ Web app primarily consumed on Apple devices
✅ Native-feel SwiftUI / SwiftUI-on-web
✅ Surfaces where accessibility is the priority

❌ Brutalist / experimental editorial (HIG is intentionally invisible)
❌ Heavy-data dashboards (HIG isn't dense enough — supplement with Carbon)
