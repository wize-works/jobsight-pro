# 🧰 JobSight Brand Kit

## ✅ Logo Usage

| Type        | Guidance |
|-------------|----------|
| **Primary** | Orange hard hat icon + “JobSight” in white or navy on a neutral/dark background. |
| **Icon Only** | Use the hard hat icon when space is limited (e.g., favicon, app icon). |
| **Spacing** | Minimum padding of 0.5x logo height on all sides. |
| **Don’ts** | Don’t stretch, rotate, or place on clashing backgrounds. Never add shadows or gradients. |

---

## 🎨 Color Palette

Light Theme (default):
Role | Color | Notes
primary | #FF6A00 | Construction Orange
primary-content | #FFFFFF | White text over orange buttons
secondary | #3E5779 | Navy Slate (navbar, sections)
secondary-content | #FFFFFF | White text on navy
accent | #FFD700 | Complimentary Yellow (highlights)
accent-content | #1B2431 | Navy text on yellow
neutral | #C2C8D0 | Neutral Gray (muted UI elements)
neutral-content | #1B2431 | Navy text on gray background
base-100 | #F9FAFB | Off White (main background)
base-200 | #E5E7EB | Slightly darker off-white (panels)
base-300 | #D1D5DB | Even darker for card borders
base-content | #1B2431 | Navy Slate text
info | #007BFF | Info Blue
info-content | #FFFFFF | White text on info
success | #28A745 | Success Green (confirms, success)
success-content | #FFFFFF | White text on success
warning | #FFD700 | Yellow (warnings, caution)
warning-content | #1B2431 | Navy text on yellow
error | #E54848 | Warning Red (errors, critical)
error-content | #FFFFFF | White text on error background

Dark Theme:
DaisyUI Role | Color | Notes
primary | #FF6A00 | Same bright orange (consistency)
primary-content | #1B2431 | Navy content on bright buttons
secondary | #F9FAFB | Off-white secondary color
secondary-content | #1B2431 | Navy text
accent | #FFD700 | Yellow accent still pops in dark
accent-content | #1B2431 | Navy text on yellow
neutral | #1B2431 | Navy Slate as neutral now
neutral-content | #F9FAFB | Light text on dark background
base-100 | #1B2431 | Deep navy for background
base-200 | #161C27 | Darker navy for panels
base-300 | #0F141B | Almost black for cards/borders
base-content | #F9FAFB | Light text on dark base
info | #007BFF | Info Blue stays (good contrast)
info-content | #FFFFFF | White text
success | #28A745 | Success green (good on dark)
success-content | #FFFFFF | White text
warning | #FFD700 | Yellow warning color
warning-content | #1B2431 | Navy text on yellow background
error | #E54848 | Error red
error-content | #FFFFFF | White text
---

## 🔤 Typography

**Primary Font:**  
→ [`Outfit`](https://fonts.google.com/specimen/Outfit) – geometric, modern sans-serif  
- Weight Range: 400 (Regular) to 700 (Bold)  
- Use for: headlines, labels, mobile UIs  
- Example:
```css
font-family: 'Outfit', sans-serif;
```

**Fallback Font Stack:**
```css
'Outfit', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
```

---

## 🧱 Iconography

- Use **line-based, rounded corner icons**
- FontAwesome
- Icon size: `24px` standard, `16px` for toolbars

---

## 📐 Grid & Layout

- Base spacing: `4px` system (`.gap-4`, `.p-4`, etc.)
- Rounded corners: `rounded-2xl` for cards, `rounded-lg` for buttons
- Max width for containers: `max-w-7xl` (`1280px`)  
- Use `grid` or `flex` layouts consistently

---

## 🔒 Accessibility

- Minimum contrast ratio: 4.5:1 (AA)
- Use `sr-only` and focus states for keyboard navigation
- Form fields: always include labels or ARIA tags

---

## 📦 Assets Provided
- ✅ Logo SVG + PNGs (favicon, app icon, social card)
- ✅ Color swatches as SCSS/JSON
- ✅ Font embed link (`<link>` for Google Fonts)