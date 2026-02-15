# Brand Identity

## Brand Colors

### Primary Palette

**Brand Blue** `#015AD9`
- RGB: rgb(1, 90, 217)
- Usage: Primary CTAs, links, interactive elements
- Tailwind: `bg-[#015AD9]` or custom color class

**Brand Lime Green** `#CDFE00`
- RGB: rgb(205, 254, 0)
- Usage: Success states, highlights, positive metrics
- Tailwind: Often approximated with `bg-lime-300`

**Brand Pink** `#E51399`
- RGB: rgb(229, 19, 153)
- Usage: Accent color, special features, highlights

**Brand Light Blue** `#7BC9EE`
- RGB: rgb(123, 201, 238)
- Usage: Secondary highlights, info states

**Brand Dark Blue** `#022641`
- RGB: rgb(2, 38, 65)
- Usage: Dark headers, emphasis text, high contrast

### Semantic Colors

**Success**
- Light: `bg-green-100` / `text-green-700`
- Standard: `bg-green-500`
- Usage: Success messages, positive states

**Warning**
- Light: `bg-orange-100` / `text-orange-900`
- Standard: `bg-orange-500`
- Usage: Warnings, concept states, pending actions

**Error**
- Light: `bg-red-100` / `text-red-700`
- Standard: `bg-red-500`
- Usage: Error messages, validation errors, destructive actions

**Info**
- Light: `bg-blue-100` / `text-blue-700`
- Standard: `bg-blue-500`
- Usage: Informational messages, tips

### Neutral Colors

**Grays** (Tailwind gray scale)
- `gray-50`: Subtle backgrounds, hover states
- `gray-100`: Borders, dividers, disabled states
- `gray-200`: Standard borders, card outlines
- `gray-500`: Secondary text, descriptions
- `gray-700`: Labels, emphasis secondary
- `gray-900`: Primary text, headings

### Color Usage Guidelines

**Do:**
- Use Brand Blue for primary actions (Save, Submit, Continue)
- Use Lime Green for success metrics and positive outcomes
- Use semantic colors consistently (green = success, red = error)
- Maintain sufficient contrast (WCAG AA: 4.5:1 for text)

**Don't:**
- Mix brand colors in the same component without purpose
- Use low-contrast color combinations
- Use pure black (#000) - use gray-900 instead
- Use pure white for text - use gray-900 on white backgrounds

## Logo

[Logo specifications and usage guidelines would go here]

## Voice & Tone

**Brand Voice:**
- Professional but approachable
- Clear and concise
- Helpful and supportive
- Dutch primary language

**Tone Guidelines:**
- Buttons: Action-oriented (e.g., "Opslaan", "Annuleren")
- Errors: Clear and helpful (e.g., "Dit veld is verplicht")
- Success: Positive reinforcement (e.g., "Succesvol opgeslagen!")
- Empty states: Encouraging (e.g., "Begin met het toevoegen van vacatures")

## Iconography

**Icon Library:** Lucide React

**Icon Sizes:**
- Small: `w-4 h-4` (16px) - Inline with text, buttons
- Medium: `w-5 h-5` (20px) - Navigation, cards
- Large: `w-6 h-6` (24px) - Headers, emphasis
- XL: `w-8 h-8` (32px) - Empty states, features

**Icon Color:**
- Primary: `text-gray-700` (default icons)
- Secondary: `text-gray-500` (subtle icons)
- Accent: `text-blue-500` (interactive icons)
- Success: `text-green-600`
- Warning: `text-orange-600`
- Error: `text-red-600`

## Imagery

[Image guidelines would go here - aspect ratios, treatment, etc.]

## Accessibility

**Color Contrast:**
- All text must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Use tools like WebAIM Contrast Checker
- Never rely on color alone to convey information

**Color Blindness:**
- Test designs with color blindness simulators
- Use patterns or icons in addition to color
- Ensure status indicators work without color
