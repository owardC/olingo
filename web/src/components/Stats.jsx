import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Stats({ token }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (token) fetchStats()
  }, [token])

  async function fetchStats() {
    try {
      const res = await fetch(`${API}/api/user/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setStats(data)
    } catch (err) {
      console.error(err)
    }
  }

  if (!stats) return <div className="stats">Loading...</div>

  return (
    <div className="stats">
      <div className="stat-item">
        <span className="stat-label">⭐ Level</span>
        <span className="stat-value">{stats.level}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">✨ XP</span>
        <span className="stat-value">{stats.xp}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">🔥 Streak</span>
        <span className="stat-value">{stats.streak}</span>
      </div>
    </div>
  )
}
