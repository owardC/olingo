import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function Flashcards({ token, language }) {
  const [cards, setCards] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [completed, setCompleted] = useState(0)

  useEffect(() => { if (token) fetchDueCards() }, [token, language])

  async function fetchDueCards() {
    try {
      const res = await fetch(`${API}/api/flashcards-due`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      setCards(data.flashcards || [])
      setCurrent(0)
      setFlipped(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function reviewCard(quality) {
    if (!cards[current]) return
    try {
      const res = await fetch(`${API}/api/flashcard-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ flashcard_id: cards[current].id, quality })
      })
      const data = await res.json()
      if (res.ok) {
        setCompleted(c => c + 1)
        if (current < cards.length - 1) {
          setCurrent(c => c + 1)
          setFlipped(false)
        } else {
          alert(`Great! Reviewed ${completed + 1} cards. +${data.xp_awarded * (completed + 1)} XP earned!`)
          setCards([])
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (cards.length === 0) {
    return <div className="flashcards-container"><p>✨ No cards to review today! Great job staying on top of your learning!</p></div>
  }

  const card = cards[current]

  return (
    <div className="flashcards-container">
      <div className="flashcard-progress">Reviewed: {completed} / {cards.length}</div>
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="flashcard-inner">
          <div className="flashcard-front">{card.front}</div>
          <div className="flashcard-back">{card.back}</div>
        </div>
      </div>
      <p className="flashcard-hint">Click to flip</p>
      {flipped && (
        <div className="quality-buttons">
          <button onClick={() => reviewCard(0)} className="quality-btn q0">❌ Again</button>
          <button onClick={() => reviewCard(2)} className="quality-btn q2">😕 Hard</button>
          <button onClick={() => reviewCard(3)} className="quality-btn q3">👍 Good</button>
          <button onClick={() => reviewCard(5)} className="quality-btn q5">🚀 Perfect</button>
        </div>
      )}
    </div>
  )
}
