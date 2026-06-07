import React, { useState } from 'react'
import '../styles/gameboard.css'

export default function GameBoard({ lessons, completedIds, onOpenLesson, language }) {
  const [showTribute, setShowTribute] = useState(false)

  if (lessons.length === 0) {
    return <div className="path-loading"><div className="loading-spinner"></div><p>Loading your adventure...</p></div>
  }

  const totalComplete = completedIds.size
  const progressPct = Math.round((totalComplete / lessons.length) * 100)

  // Group into sections of 10
  const sections = []
  for (let i = 0; i < lessons.length; i += 10) {
    sections.push(lessons.slice(i, i + 10))
  }

  const sectionNames = language === 'vietnamese' 
    ? ['🌱 First Steps', '🏠 Daily Life', '🎨 Explore', '💬 Conversations', '🌍 Culture', '🎓 Social', '💼 Professional', '🔬 Advanced', '🎭 Mastery']
    : ['🌱 Primeros Pasos', '🏠 Vida Diaria', '🎨 Explora', '💬 Conversaciones', '🌍 Cultura', '🎓 Social', '💼 Profesional', '🔬 Avanzado', '🎭 Maestría']

  return (
    <div className="path-container">
      {/* Progress bar */}
      <div className="path-progress-bar">
        <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
        <span className="progress-text">{totalComplete}/{lessons.length} lessons completed</span>
      </div>

      {/* Tribute button */}
      <button className="tribute-btn" onClick={() => setShowTribute(true)}>
        💕 Made with Love
      </button>

      {/* Learning path */}
      <div className="learning-path">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="path-section">
            <div className="section-header">
              <h3>{sectionNames[sIdx] || `📖 Section ${sIdx + 1}`}</h3>
            </div>
            <div className="path-nodes">
              {section.map((lesson, lIdx) => {
                const globalIdx = sIdx * 10 + lIdx
                const isCompleted = completedIds.has(lesson.id)
                const prevCompleted = globalIdx === 0 || completedIds.has(lessons[globalIdx - 1]?.id)
                const isLocked = !isCompleted && !prevCompleted && globalIdx > 0
                const isEasterEgg = lesson.id.startsWith('vi-') && (lesson.title.includes('❤️') || lesson.title.includes('💕'))

                return (
                  <div
                    key={lesson.id}
                    className={`path-node ${isCompleted ? 'completed' : isLocked ? 'locked' : 'available'} ${isEasterEgg ? 'easter-egg' : ''}`}
                    onClick={() => !isLocked && onOpenLesson(lesson)}
                    title={isLocked ? 'Complete previous lesson first' : lesson.title}
                  >
                    <div className="node-circle">
                      {isCompleted ? (
                        <svg viewBox="0 0 24 24" className="check-icon"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/></svg>
                      ) : isLocked ? (
                        <svg viewBox="0 0 24 24" className="lock-icon"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" fill="currentColor"/></svg>
                      ) : (
                        <span className="node-number">{globalIdx + 1}</span>
                      )}
                    </div>
                    <div className="node-title">{lesson.title.replace(/^[^\s]+\s/, '')}</div>
                    {isEasterEgg && <span className="easter-sparkle">✨</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tribute Modal */}
      {showTribute && (
        <div className="tribute-overlay" onMouseDown={e => e.target === e.currentTarget && setShowTribute(false)}>
          <div className="tribute-modal">
            <button className="tribute-close" onClick={() => setShowTribute(false)}>×</button>
            <div className="tribute-heart">💕</div>
            <h2>For Judy Ha</h2>
            <p className="tribute-text">
              This app was built with love and inspired by the most amazing woman — <strong>Judy Ha</strong>.
            </p>
            <p className="tribute-text">
              Her encouragement, patience, and beautiful spirit motivated every line of code.
              Learning Vietnamese became my passion because of her.
            </p>
            <div className="tribute-signature">
              <p>Em ơi, anh yêu em nhiều lắm 💕</p>
              <p className="tribute-from">— Oward Cadenas</p>
            </div>
            <div className="tribute-footer">
              <p>🇻🇳 Keep an eye out for secret love notes hidden in the Vietnamese lessons! 🇻🇳</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
