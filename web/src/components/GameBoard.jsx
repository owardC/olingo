import React from 'react'
import '../styles/gameboard.css'

export default function GameBoard({ lessons, completedIds, onOpenLesson, language }) {
  if (lessons.length === 0) {
    return <div className="gameboard-empty">Loading your learning journey...</div>
  }

  return (
    <div className="gameboard-container">
      <div className="gameboard-header">
        <h2>🎮 Your Learning Quest</h2>
        <p className="progress">Lessons {completedIds.size} / {lessons.length} Complete</p>
      </div>

      <div className="gameboard-grid">
        {lessons.map((lesson, index) => {
          const isCompleted = completedIds.has(lesson.id)
          const difficulty = Math.ceil((index + 1) / 30)
          const stars = '⭐'.repeat(Math.min(difficulty, 3))
          const firstPhrase = lesson.phrases?.[0] || {}
          const phraseText = firstPhrase.v || firstPhrase.s || ''

          return (
            <div
              key={lesson.id}
              className={`lesson-tile ${isCompleted ? 'completed' : 'pending'}`}
              onClick={() => onOpenLesson(lesson)}
            >
              <div className="tile-number">{index + 1}</div>
              <div className="tile-title">{lesson.title}</div>
              <div className="tile-difficulty">{stars}</div>
              <div className="tile-preview">{phraseText.substring(0, 20)}</div>
              {isCompleted && <div className="tile-checkmark">✓</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
