import React, { useEffect, useState } from 'react'
import GameBoard from './components/GameBoard'
import LessonPlayer from './components/LessonPlayer'
import Auth from './components/Auth'
import Stats from './components/Stats'
import Flashcards from './components/Flashcards'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function App() {
  const [user_id, setUserId] = useState(null)
  const [token, setToken] = useState(null)
  const [email, setEmail] = useState(null)
  const [lang, setLang] = useState('vietnamese')
  const [lessons, setLessons] = useState([])
  const [completedLessons, setCompletedLessons] = useState(new Set())
  const [showFlashcards, setShowFlashcards] = useState(false)
  const [activeLesson, setActiveLesson] = useState(null)

  useEffect(() => {
    const stored_token = localStorage.getItem('token')
    const stored_user_id = localStorage.getItem('user_id')
    const stored_email = localStorage.getItem('email')
    if (stored_token && stored_user_id) {
      setToken(stored_token)
      setUserId(stored_user_id)
      setEmail(stored_email)
    }
  }, [])

  useEffect(() => { 
    if (user_id) {
      fetchLessons()
      fetchCompletedLessons()
    }
  }, [lang, user_id])

  async function fetchLessons() {
    try {
      const res = await fetch(`${API}/api/lessons?lang=${lang}`)
      const data = await res.json()
      setLessons(data.lessons || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchCompletedLessons() {
    try {
      const res = await fetch(`${API}/api/progress/${lang}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      const ids = new Set((data.progress || []).map(p => p.lesson_id))
      setCompletedLessons(ids)
    } catch (err) {
      console.error(err)
    }
  }

  function handleLogin(uid, tok, em) {
    setUserId(uid)
    setToken(tok)
    setEmail(em)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('email')
    setUserId(null)
    setToken(null)
    setEmail(null)
  }

  async function markLessonComplete(lesson) {
    if (!token) return alert('Please log in')
    try {
      const res = await fetch(`${API}/api/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lesson_id: lesson.id, language: lang, level: lesson.level })
      })
      const data = await res.json()
      if (res.ok) {
        setCompletedLessons(prev => new Set([...prev, lesson.id]))
        setActiveLesson(null)
      } else {
        alert(data.error || 'Failed to save progress')
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!user_id) return <Auth onLogin={handleLogin} />

  return (
    <div className="app">
      <div className="header">
        <h1>🎓 Olingo</h1>
        <div className="header-right">
          <Stats token={token} />
          <div className="user-info">
            <span>{email}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </div>

      <div className="controls">
        <label>
          Language:
          <select value={lang} onChange={e => setLang(e.target.value)}>
            <option value="vietnamese">🇻🇳 Vietnamese</option>
            <option value="venezuelan_spanish">🇻🇪 Venezuelan Spanish</option>
          </select>
        </label>

        <button onClick={() => setShowFlashcards(!showFlashcards)} className="toggle-mode">
          {showFlashcards ? '📚 Learning Path' : '🎴 Flashcards'}
        </button>
      </div>

      {showFlashcards ? (
        <Flashcards token={token} language={lang} />
      ) : (
        <GameBoard 
          lessons={lessons}
          completedIds={completedLessons}
          onOpenLesson={setActiveLesson}
          language={lang}
        />
      )}

      {activeLesson && (
        <LessonPlayer
          lesson={activeLesson}
          language={lang}
          onComplete={markLessonComplete}
          onClose={() => setActiveLesson(null)}
        />
      )}
    </div>
  )
}
