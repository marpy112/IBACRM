## 🗺️ Mindanao Research Map

An interactive map application for researchers to discover and explore research locations across Mindanao, Philippines.

### Key Features

- **Mapbox GL Integration** - Interactive vector maps
- **Research Location Markers** - 8+ pre-configured research sites
- **Responsive Design** - Mobile and desktop optimization
- **Location Details Panel** - View researcher info and descriptions
- **TypeScript Support** - Full type safety

### Setup Instructions

1. **Get Mapbox Token:**
   - Visit [Mapbox Account](https://account.mapbox.com/auth/signin/)
   - Copy your default public token

2. **Configure Token:**
   - Create `.env.local` in project root
   - Add: `VITE_MAPBOX_TOKEN=pk.your_token_here`

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Start Development:**
   ```bash
   npm run dev
   ```

### Development Commands

- `npm run dev` - Start dev server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
  ├── components/
  │   ├── Header.tsx          # App header
  │   ├── MapContainer.tsx    # Main map component
  │   └── LocationPanel.tsx   # Location sidebar
  ├── data/
  │   └── mindanaoLocations.ts # Research locations
  └── App.tsx                 # Main app
```

### MapBox Coverage

- **Region:** Mindanao, Philippines
- **Center:** 8.5°N, 125.0°E
- **Default Zoom:** 7
- **Coverage:** All major islands and research centers in Mindanao

### Adding New Locations

Edit `src/data/mindanaoLocations.ts`:

```typescript
{
  id: 'unique-id',
  name: 'Location Name',
  latitude: 8.123,
  longitude: 125.456,
  description: 'Research description',
  researchers: ['Dr. Name'],
}
```

### Customization

- **Map Style:** Change in `MapContainer.tsx` (streets, outdoors, light, dark, satellite)
- **Initial View:** Adjust zoom/center in `mapContainer.tsx` viewState
- **Markers:** Customize marker icons and animations in `MapContainer.css`

### Technologies

- React 18 + TypeScript
- Mapbox GL JS
- react-map-gl
- Vite
- ESLint

See [README.md](../README.md) for detailed documentation.

