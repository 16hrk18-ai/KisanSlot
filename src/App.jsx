import { Routes, Route, useLocation } from 'react-router-dom'
import TopBar from './components/TopBar.jsx'
import { RequireUser, RequireFarmer, RequireCentre } from './components/Guards.jsx'
import Landing from './pages/Landing.jsx'
import Notifications from './pages/Notifications.jsx'
import FarmerRegister from './pages/farmer/FarmerRegister.jsx'
import FarmerHome from './pages/farmer/FarmerHome.jsx'
import CentreSchedule from './pages/farmer/CentreSchedule.jsx'
import FarmerBookings from './pages/farmer/FarmerBookings.jsx'
import CentreRegister from './pages/centre/CentreRegister.jsx'
import CentreRequests from './pages/centre/CentreRequests.jsx'
import CentreSchedules from './pages/centre/CentreSchedules.jsx'
import CentreQueue from './pages/centre/CentreQueue.jsx'
import CentreDisplay from './pages/centre/CentreDisplay.jsx'

export default function App() {
  const location = useLocation()
  const hideChrome = location.pathname === '/centre/display'

  return (
    <div className="app-shell">
      {!hideChrome && <TopBar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/notifications" element={<RequireUser><Notifications /></RequireUser>} />

        <Route path="/farmer/register" element={<RequireUser><FarmerRegister /></RequireUser>} />
        <Route path="/farmer" element={<RequireFarmer><FarmerHome /></RequireFarmer>} />
        <Route path="/farmer/centre/:centreId" element={<RequireFarmer><CentreSchedule /></RequireFarmer>} />
        <Route path="/farmer/bookings" element={<RequireFarmer><FarmerBookings /></RequireFarmer>} />

        <Route path="/centre/register" element={<RequireUser><CentreRegister /></RequireUser>} />
        <Route path="/centre" element={<RequireCentre><CentreRequests /></RequireCentre>} />
        <Route path="/centre/queue" element={<RequireCentre><CentreQueue /></RequireCentre>} />
        <Route path="/centre/schedules" element={<RequireCentre><CentreSchedules /></RequireCentre>} />
        <Route path="/centre/display" element={<RequireCentre><CentreDisplay /></RequireCentre>} />
      </Routes>
    </div>
  )
}
