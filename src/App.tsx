import './App.css'
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Header } from './components/Header'
import { MapContainer } from './components/MapContainer'
import { LocationPanel } from './components/LocationPanel'
import Login from './components/Login'
import AdminDashboard, { ResearchLocation } from './components/AdminDashboard'
import { fetchLocations } from './services/api'
import { LoadingScreen } from './components/LoadingScreen'
import { MINDANAO_RESEARCH_LOCATIONS } from './data/mindanaoLocations'

function AppContent() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true
    let retryCount = 0
    const MAX_RETRIES = 30

    const checkDatabaseHealth = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api')}/health`, {
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (!response.ok) {
          throw new Error(`Health check failed with status ${response.status}`);
        }

        const health = await response.json();
        if (isMounted) {
          if (health.mongodb !== false) {
            setIsReady(true)
          } else {
            // Database not ready, wait and retry
            if (retryCount < MAX_RETRIES) {
              retryCount++
              setTimeout(checkDatabaseHealth, 2000)
            } else {
              // After max retries, proceed anyway with fallback data
              setIsReady(true)
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          // If health check fails, retry but don't get stuck
          // This could be because the endpoint doesn't exist on older servers
          if (retryCount < MAX_RETRIES) {
            retryCount++
            setTimeout(checkDatabaseHealth, 2000)
          } else {
            // After max retries, proceed with fallback data
            setIsReady(true)
          }
        }
      }
    }

    checkDatabaseHealth()

    return () => {
      isMounted = false
    }
  }, [])

  if (!isReady) {
    return <LoadingScreen />
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  )
}

// Map View Component
function MapView() {
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || ''
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [locations, setLocations] = useState<ResearchLocation[]>(MINDANAO_RESEARCH_LOCATIONS)

  // Fetch locations from backend on mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const fetchedLocations = await fetchLocations()
        setLocations(fetchedLocations)
      } catch (error) {
        console.error('Failed to fetch locations from server:', error)
        setLocations(MINDANAO_RESEARCH_LOCATIONS)
      }
    }

    loadLocations()
  }, [])

  const handleLocationSelect = (location: ResearchLocation) => {
    setSelectedLocationId(location.id)
  }

  if (!mapboxToken) {
    return (
      <div className="setup-container">
        <Header />
        <div className="setup-content">
          <h2>🔑 Mapbox Token Required</h2>
          <p>
            To display the map, you need to set up your Mapbox access token.
          </p>
          <ol>
            <li>Go to <a href="https://account.mapbox.com/auth/signin/" target="_blank" rel="noopener noreferrer">Mapbox.com</a></li>
            <li>Sign up or log in to your account</li>
            <li>Navigate to your API access tokens page</li>
            <li>Copy your default public token</li>
            <li>Create a <code>.env</code> or <code>.env.local</code> file in the project root with:
              <pre>VITE_MAPBOX_TOKEN=your_token_here</pre>
            </li>
            <li>Restart the development server</li>
          </ol>
          <p><strong>Or set it temporarily:</strong></p>
          <pre>VITE_MAPBOX_TOKEN=sk.123... npm run dev</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <Header />
      <div className="map-area">
        <MapContainer 
          accessToken={mapboxToken} 
          locations={locations}
          selectedLocationId={selectedLocationId}
        />
        <LocationPanel
          locations={locations}
          onLocationSelect={handleLocationSelect}
        />
      </div>
    </div>
  )
}

// Admin Page Component
function AdminPage() {
  const [locations, setLocations] = useState<ResearchLocation[]>(MINDANAO_RESEARCH_LOCATIONS)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch locations from backend
    const loadLocations = async () => {
      try {
        const fetchedLocations = await fetchLocations()
        setLocations(fetchedLocations)
      } catch (error) {
        console.error('Failed to fetch locations from server:', error)
        setLocations(MINDANAO_RESEARCH_LOCATIONS)
      }
    }

    loadLocations()

    // Check if admin is already logged in
    const currentAdmin = localStorage.getItem('currentAdmin')
    if (currentAdmin) {
      setAdminEmail(currentAdmin)
      setIsAdmin(true)
    }
  }, [])

  const handleAdminLogin = (email: string) => {
    setAdminEmail(email)
    setIsAdmin(true)
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('currentAdmin')
    setIsAdmin(false)
    setAdminEmail('')
    navigate('/')
  }

  const handleAddLocation = (location: ResearchLocation) => {
    setLocations([...locations, location])
  }

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id))
  }

  // Show login if not authenticated
  if (!isAdmin) {
    return <Login onLoginSuccess={handleAdminLogin} />
  }

  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || ''

  // Show admin dashboard if authenticated
  return (
    <AdminDashboard
      onLogout={handleAdminLogout}
      adminEmail={adminEmail}
      locations={locations}
      onAddLocation={handleAddLocation}
      onDeleteLocation={handleDeleteLocation}
      mapboxAccessToken={mapboxToken}
    />
  )
}

function App() {
  return <AppContent />
}

export default App
