# CatalogIt Frontend Setup Guide

This guide walks you through setting up the React frontend for CatalogIt.

## Prerequisites

- Node.js 18+
- npm 9+

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── PublicLists.jsx
│   │   └── ListDetails.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Step 1: Initialize the Project

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

## Step 2: Install Dependencies

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Routing and API
npm install react-router-dom axios
```

## Step 3: Configure Tailwind

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#0d47a1',
        'teal-accent': '#00897b',
      },
    },
  },
  plugins: [],
}
```

Update `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

body {
  font-family: 'Inter', sans-serif;
  background-color: #f4f7f9;
}
```

## Step 4: Set Up Routing

Update `src/App.jsx`:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PublicLists from './components/PublicLists';
import ListDetails from './components/ListDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="explore" element={<PublicLists />} />
          <Route path="lists/:id" element={<ListDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## Step 5: Add Components

Copy the component files from `frontend_files/`:
- `Layout.jsx` → `src/components/Layout.jsx`
- `PublicLists.jsx` → `src/components/PublicLists.jsx`
- `ListDetails.jsx` → `src/components/ListDetails.jsx`

## Step 6: Add API Service

Copy `api.js` from `frontend_files/` to `src/services/api.js`

## Step 7: Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Testing

Install testing dependencies:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

Add to `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

Create `src/test/setup.js`:

```javascript
import '@testing-library/jest-dom';
```

Run tests:

```bash
npm test
```
