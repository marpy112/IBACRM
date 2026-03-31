# 🗺️ Mindanao Research Map

An interactive map application built with React, TypeScript, and Mapbox GL to help researchers discover and explore research locations across Mindanao, Philippines.


## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Mapbox GL access token (free tier available)

### Installation

```bash
npm install
```

### Setup Mapbox Token

1. Go to [Mapbox Account](https://account.mapbox.com/auth/signin/)
2. Sign up or log in
3. Navigate to [Tokens page](https://account.mapbox.com/tokens/)
4. Copy your **default public token**
5. Create `.env` or `.env.local` in the project root:
   ```
   VITE_MAPBOX_TOKEN=pk.your_token_here
   ```

### Development

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser. The map will automatically center on Mindanao.

### Building

Create an optimized production build:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
  ├── components/
  │   ├── Header.tsx              # App header
  │   ├── MapContainer.tsx        # Main Mapbox map component
  │   ├── LocationPanel.tsx       # Research locations sidebar
  │   └── *.css                   # Component styles
  ├── data/
  │   └── mindanaoLocations.ts    # Research location data
  ├── App.tsx                     # Main application component
  ├── main.tsx                    # Entry point
  └── index.css                   # Global styles
```

## Technologies

- **React 18** - UI library with Hooks
- **TypeScript** - Type-safe JavaScript
- **Mapbox GL** - Vector maps library
- **react-map-gl** - React wrapper for Mapbox GL
- **Vite** - Lightning-fast build tool
- **ESLint** - Code quality

## Adding Research Locations

Edit `src/data/mindanaoLocations.ts` to add new research locations:

```typescript
{
  id: 'unique-id',
  name: 'Location Name',
  latitude: 8.123,
  longitude: 125.456,
  description: 'Research description...',
  researchers: ['Dr. Name 1', 'Dr. Name 2'],
}
```

## Customization

### Change Map Style

In `MapContainer.tsx`, modify the `mapStyle` prop:
```typescript
mapStyle="mapbox://styles/mapbox/light-v11"  // Or other available styles
```

Available styles:
- `mapbox://styles/mapbox/streets-v12`
- `mapbox://styles/mapbox/outdoors-v12`
- `mapbox://styles/mapbox/light-v11`
- `mapbox://styles/mapbox/dark-v11`
- `mapbox://styles/mapbox/satellite-v9`

### Adjust Initial Zoom/Center

In `MapContainer.tsx`, update the `viewState`:
```typescript
const [viewState] = React.useState({
  longitude: 125.0,
  latitude: 8.5,
  zoom: 7,
});
```

## Environment Variables

```env
# .env or .env.local
VITE_MAPBOX_TOKEN=pk.your_token_here  # Required: Your Mapbox public token
```

## Hostinger Frontend Deployment

If you are uploading the React app to Hostinger static hosting:

```bash
npm run build:frontend
```

Then upload the contents of `dist/` to your `public_html/` folder. Keep the generated `.htaccess` file so React Router routes continue to work after page refreshes.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check code quality

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Resources

- [Mapbox GL Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [react-map-gl Documentation](https://visgl.github.io/react-map-gl/)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org)

---

**Built for researchers exploring Mindanao's diverse research opportunities.**

