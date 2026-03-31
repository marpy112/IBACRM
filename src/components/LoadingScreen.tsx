import './LoadingScreen.css'

export function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner"></div>
        <h1>Welcome to IBARM</h1>
        <p>Connecting you with research local please wait...</p>
        <div className="dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}
