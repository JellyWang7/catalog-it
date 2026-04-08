# UI/UX Mockups

This folder contains HTML prototypes and design mockups for the CatalogIt frontend.

## Files

### Core Application Pages
- **home.html** - Homepage design with hero section and feature highlights
- **list-details.html** - Detailed view of a user's list with items management
- **public-explore.html** - Public lists exploration page (browse community catalogs)
- **public-list-details.html** - Individual public list details (read-only view)

### Additional Pages
- **features.html** - Platform features and capabilities showcase
- **knowledge-base.html** - Help center and knowledge base
- **social-media-mockup.html** - Social media integration mockup

## Design System

All mockups use:
- **Framework:** Tailwind CSS
- **Typography:** Inter font family
- **Color Scheme:**
  - Primary: Deep Blue (#0d47a1)
  - Accent: Green (#4caf50)
  - Teal: (#00897b)
  - Background: Light Gray (#f4f7f9)

## Usage

When building React components:

1. **Layout Structure:**
   - Reference these designs for component hierarchy
   - Identify reusable patterns (navigation, cards, forms)

2. **Styling:**
   - Extract Tailwind classes directly
   - Maintain responsive design breakpoints
   - Preserve color scheme and typography

3. **Components to Extract:**
   - Navigation sidebar
   - List cards
   - Item tables
   - Filter/search interfaces
   - Modal dialogs

## Viewing Mockups

To view these mockups:
```bash
# Open any HTML file in your browser
open ui-mockups/home.html

# Or use a local server
python3 -m http.server 8000
# Then visit: http://localhost:8000/ui-mockups/
```

## Notes

- These are **static designs** - no backend integration
- Focus on visual design and user flow
- Interactive elements are HTML-only (no JavaScript logic)
- Use as reference during React component development
