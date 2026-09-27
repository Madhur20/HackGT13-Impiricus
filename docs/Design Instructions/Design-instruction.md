# UI Redesign Instructions — Match the DocUpdate Visual Style

## Scope

Update the existing product UI so that its **visual language, spacing, layout, typography, navigation, cards, buttons, backgrounds, and section composition** closely match the reference screenshots.

These instructions apply **only to presentation and interface structure**. Do **not** change, rewrite, add, remove, or reinterpret the product's existing content, features, labels, data, or functionality unless necessary to fit the new layout.

---

## 1. Overall Visual Direction

- Shift the interface toward a **clean healthcare/editorial aesthetic** rather than a typical SaaS dashboard appearance.
- Use a **very light cool blue / blue-white page background** instead of plain white or dark backgrounds.
- Keep the interface visually airy with:
  - large empty spaces,
  - generous section padding,
  - restrained use of borders,
  - minimal shadows,
  - limited color accents.
- Avoid dense card grids, excessive badges, gradients, glassmorphism, and heavy dashboard-style panels.
- The visual hierarchy should feel **premium, calm, clinical, and editorial**.

---

## 2. Global Page Background

- Use a pale blue-white background across most public-facing pages.
- Add an optional **very subtle dotted grid/pattern** in selected sections.
- The pattern should:
  - have extremely low contrast,
  - use small evenly spaced dots,
  - never compete with foreground text.
- Keep large content sections flat and uncluttered rather than wrapping every section in a card.

---

## 3. Main Content Width

- Use a centered desktop container with a maximum width around **1400–1500px**.
- Main page content should generally occupy around **80–85% of the viewport width** on large screens.
- Maintain large horizontal gutters.
- Avoid stretching text and cards edge-to-edge.

Suggested behavior:

```css
max-width: 1440px;
margin: 0 auto;
padding-inline: 32px;
```

Increase padding on very large screens where needed.

---

## 4. Header / Navigation Bar

Redesign the top navigation as a **floating white horizontal container**.

### Header container

- Center it horizontally.
- Leave visible page background around it.
- Add:
  - white background,
  - subtle light-gray border,
  - soft shadow,
  - rounded corners around `18–24px`.
- Keep the header height compact but comfortable.
- Do not make it full-bleed across the browser width.

### Internal layout

Use three visual groups:

1. **Left:** brand/logo.
2. **Center:** navigation links.
3. **Right:** primary and secondary actions.

### Navigation styling

- Keep links simple and text-based.
- Use dark navy/near-black text.
- Use medium-to-semibold weight.
- Keep spacing between links generous.
- Dropdown indicators should be small and understated.
- Avoid pill backgrounds behind normal nav items.
- Avoid active tabs that look like dashboard tabs.

### Header actions

- Secondary action:
  - white background,
  - purple border,
  - purple text,
  - pill shape.
- Primary action:
  - solid purple background,
  - white text,
  - pill shape.
- Use consistent button heights and horizontal padding.

---

## 5. Typography System

Use a **two-font visual hierarchy**.

### Display / heading font

- Use an elegant high-contrast serif for major headings.
- Suitable alternatives:
  - Playfair Display,
  - Cormorant Garamond,
  - DM Serif Display,
  - another refined editorial serif.

Use this font for:

- hero headlines,
- major section headings,
- large promotional statements.

### UI / body font

Use a clean sans-serif for:

- body copy,
- buttons,
- navigation,
- form fields,
- metadata,
- descriptions.

Suitable alternatives:

- Inter,
- Manrope,
- Helvetica/Arial fallback,
- another modern neutral sans-serif.

### Heading style

- Large headings should be substantially larger than current SaaS-style headings.
- Use dark navy rather than pure black.
- Favor normal or semi-bold serif weights instead of heavy bold.
- Use tighter line-height on large headings.

Example desktop range:

```css
font-size: clamp(52px, 6vw, 96px);
line-height: 0.95–1.05;
```

Section headings can use roughly `42–64px`.

---

## 6. Color Palette

Use a restrained palette similar to the reference.

### Base colors

- Background: very light blue / icy blue.
- Main text: deep navy.
- Secondary text: muted blue-gray.
- Surfaces: white.
- Borders: very light gray/blue-gray.

### Accent

Use one primary purple/violet accent consistently for:

- primary buttons,
- outlined buttons,
- small links,
- active controls,
- subtle highlights.

Do not introduce many competing accent colors.

Suggested palette direction:

```css
--bg: #EEF9FC;
--surface: #FFFFFF;
--text-primary: #081735;
--text-secondary: #495467;
--accent: #7A4DE8;
--border: #E6E8EE;
```

Exact values may be adjusted to fit the existing brand.

---

## 7. Hero Section

Replace any dense dashboard-like or centered SaaS hero with a **large editorial hero**.

### Layout

- Hero should occupy most of the first viewport.
- Use a large background image or image-backed section.
- Apply a **soft white / pale-blue overlay** over the image so text remains highly legible.
- Position the text block toward the **left side**.
- Keep the content vertically centered or slightly below center.

### Image behavior

- Use a full-width image within the page section.
- `background-size: cover`.
- Keep image treatment soft and slightly muted.
- Do not use highly saturated imagery.
- Avoid hard image borders in the hero.

### Headline

- Very large serif type.
- Deep navy.
- Strong visual dominance.
- Max width should keep line length controlled.

### Supporting area

- Keep supporting UI beneath the heading visually simple.
- Use one strong CTA rather than multiple equal-weight actions.
- Primary hero button should be a wide purple pill.

### Spacing

- Add large top and bottom padding.
- Avoid placing multiple cards directly inside the hero.

---

## 8. Section Structure

Each major page section should feel like a **distinct visual block with breathing room**, not a stack of dashboard modules.

Use:

- `80–140px` vertical spacing between major sections on desktop,
- centered section headings where appropriate,
- alternating left/right text-and-visual compositions for feature sections.

Avoid:

- excessive horizontal dividers,
- bordered boxes around every section,
- compact spacing.

---

## 9. Feature / Tool Overview Sections

For sections that present several product capabilities:

- Use a **three-column layout** on desktop.
- Each item should have:
  - a simple visual/icon area,
  - heading,
  - short body area,
  - minimal outlined action.
- Remove heavy card backgrounds where possible.
- Let each feature sit directly on the page background rather than inside a large raised card.

### Feature items

- Keep each column visually open.
- Do not use thick borders.
- Use generous horizontal spacing.
- Align items consistently.
- Icons/illustrations should be simple and lightly styled.

### Buttons

- Use small outlined pill buttons.
- Purple border and text.
- White or transparent fill.
- Keep them visually secondary.

---

## 10. Two-Column Product Feature Sections

For detailed product sections, use a **split-screen layout**:

- left: interface preview / product mockup,
- right: icon, large serif heading, short supporting area, minimal link/action.

Alternate left/right placement between sections if multiple sections exist.

### Screenshot/mockup treatment

- Present UI screenshots without thick device frames.
- Use minimal border and subtle shadow.
- Preserve plenty of blank space around screenshots.
- Keep screenshots large enough to be immediately understandable.

### Text column

- Vertically center relative to the visual.
- Use a large serif heading.
- Keep supporting content narrower than the screenshot.
- Use a lightweight link with an arrow rather than another large button where appropriate.

---

## 11. Cards and Surfaces

Reduce the use of conventional SaaS cards.

### Where cards are needed

Use:

- white background,
- very subtle gray border,
- no dark outline,
- soft `8–16px` shadow,
- rounded corners around `18–28px`.

### Avoid

- excessive 1px borders on every component,
- cards inside cards,
- strong shadows,
- glass effects,
- neon borders,
- highly rounded bubble-style components everywhere.

---

## 12. Forms and Interactive Controls

Form controls should look minimal and clinical.

### Inputs

- White background.
- Light gray border.
- Medium corner radius.
- Comfortable vertical padding.
- Dark text.
- Muted placeholder text.

### Select/dropdown controls

- Simple white dropdown.
- Thin border.
- Purple or navy focus state.
- Avoid oversized arrows or custom decorative elements.

### Radio buttons / checkboxes

- Small, clean controls.
- Purple selected state.
- Keep labels left-aligned and compact.

### Expanded menus

- White floating panel.
- Soft border and shadow.
- Moderate radius.
- Clear spacing between options.
- Selected row may use a checkmark or subtle accent.

---

## 13. Article / Content Card Layout

Where the product currently shows resource cards, announcements, updates, or similar repeatable content:

- Use a **three-column editorial grid** on desktop.
- Each card should feel more like an article preview than a dashboard widget.

### Image

- Wide landscape image.
- Rounded corners, especially visibly rounded lower or overall corners.
- Use approximately a `16:9` or slightly wider ratio.
- Keep consistent height across cards.

### Text hierarchy

Under each image:

1. small accent-colored metadata,
2. bold title,
3. secondary metadata,
4. short description,
5. subtle external-link/arrow affordance if needed.

### Card surface

- Prefer no visible card background.
- Let the items sit directly on the page background.
- Avoid enclosing the whole article in a bordered white rectangle.

---

## 14. Buttons

Standardize buttons across the interface.

### Primary button

- Solid purple.
- White text.
- Pill radius (`9999px` or equivalent).
- Medium-to-bold label.
- Comfortable horizontal padding.
- Soft hover darkening.

### Secondary button

- White or transparent.
- Purple border.
- Purple text.
- Pill radius.
- No heavy shadow.

### Text action

- Purple text.
- Optional arrow icon.
- No background.
- Use for low-priority actions.

Avoid using square buttons unless required by an existing functional control.

---

## 15. Corner Radius System

Use a consistent radius scale.

Suggested:

```css
--radius-sm: 10px;
--radius-md: 16px;
--radius-lg: 22px;
--radius-xl: 28px;
--radius-pill: 9999px;
```

Recommended use:

- inputs: small/medium,
- content cards: medium/large,
- header: large,
- buttons: pill.

---

## 16. Shadows

Use shadows sparingly.

### Header

Slightly more visible shadow to make the floating nav distinct.

### Cards / previews

Very subtle soft shadow only.

Recommended direction:

```css
box-shadow: 0 8px 30px rgba(20, 32, 60, 0.06);
```

Avoid dark or sharp drop shadows.

---

## 17. Borders

- Use light cool-gray borders.
- Keep border contrast low.
- Default to `1px`.
- Do not use borders to create hierarchy where spacing can do the job.
- Purple borders should mainly be reserved for:
  - selected states,
  - secondary actions,
  - highlighted form controls.

---

## 18. Icons

- Use thin-line icons.
- Keep icon style consistent across the site.
- Prefer navy outlines with occasional pale blue/purple fills.
- Avoid large multicolor icon sets.
- Avoid emojis as UI icons.
- Use icons sparingly and intentionally.

---

## 19. Image Treatment

Across the site:

- Favor healthcare/professional imagery with muted tones.
- Use image overlays when placing text above photography.
- Keep image corners rounded in cards and section visuals.
- Do not use strong drop shadows or thick colored outlines around images.
- Maintain consistent aspect ratios.

---

## 20. Spacing System

Use a predictable spacing scale.

Suggested base units:

```text
4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 120
```

### Desktop

- Page gutters: `32–64px`.
- Section vertical padding: `80–120px`.
- Header inner padding: `16–24px`.
- Card gaps: `28–40px`.
- Heading-to-body gap: `20–28px`.

Increase whitespace rather than adding extra decorative elements.

---

## 21. Alignment

- Most hero and detail section copy should be **left aligned**.
- Major overview section titles may be centered.
- Avoid centering every component.
- Maintain consistent baseline alignment in three-column sections.
- Keep text widths constrained for readability.

---

## 22. Responsive Behavior

### Tablet

- Reduce hero heading size.
- Collapse three-column areas to two columns where practical.
- Reduce page gutters.
- Preserve floating header styling.

### Mobile

- Stack columns vertically.
- Convert navigation to a compact mobile menu.
- Keep one primary CTA prominent.
- Hero background image should remain visible but crop appropriately.
- Maintain at least `20–24px` side padding.
- Large serif headings should scale down without wrapping into many short lines.
- Article and feature grids should become single-column.
- Two-column feature sections should stack image first, text second.

Do not simply shrink desktop layouts; deliberately reflow them.

---

## 23. Interaction States

Use subtle transitions:

```css
transition: all 150ms ease;
```

### Hover

- Buttons: slight darkening or subtle elevation.
- Links: accent-color shift or underline.
- Cards: very slight lift only if clickable.
- Header nav: subtle color change.

### Focus

- Use visible but clean purple focus rings.
- Ensure keyboard accessibility.

Do not use dramatic scaling or animated gradients.

---

## 24. Accessibility

- Preserve high contrast between dark navy text and pale background.
- Ensure button text meets contrast requirements.
- Maintain visible keyboard focus states.
- Keep minimum target sizes around `44px`.
- Do not rely on color alone for selected states.
- Preserve semantic heading hierarchy.

---

## 25. Components to Restyle First

Prioritize the UI migration in this order:

1. Global colors and typography.
2. Main floating navigation.
3. Hero layout.
4. Primary and secondary button styles.
5. Main page spacing and container widths.
6. Multi-column feature sections.
7. Two-column screenshot/text sections.
8. Forms and dropdowns.
9. Resource/article cards.
10. Responsive/mobile styles.
11. Hover, focus, and transition states.

---

## 26. What to Remove From the Current UI

Where present, remove or reduce:

- dark dashboard backgrounds,
- excessive gradients,
- glassmorphism,
- neon accent colors,
- oversized drop shadows,
- small cramped sections,
- heavy card outlines,
- repeated pill containers,
- dense dashboard grids,
- too many simultaneous CTA styles,
- multiple competing fonts,
- overly bold sans-serif page titles,
- excessive center alignment,
- decorative UI elements that do not support hierarchy.

---

## 27. Consistency Requirements

The finished interface should consistently use:

- pale blue page backgrounds,
- white floating surfaces,
- deep navy text,
- one purple accent,
- serif display headings,
- sans-serif UI/body text,
- large whitespace,
- rounded navigation and buttons,
- restrained cards,
- editorial image layouts,
- minimal borders,
- soft shadows.

Every page should feel like part of the same visual system rather than a collection of independently styled screens.

---

## 28. Implementation Constraint

**Do not modify the product's actual content or functionality as part of this redesign.**

The redesign should only change:

- visual hierarchy,
- component styling,
- page structure,
- spacing,
- alignment,
- typography,
- colors,
- responsive behavior,
- imagery treatment,
- interaction presentation.

Existing feature logic, data flow, labels, and product meaning should remain unchanged.
