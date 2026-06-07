import React, { useState, useEffect, useRef } from 'react'
import '../styles/lessonplayer.css'

// Exercise types: 'type' = type the translation, 'drag' = arrange words
function generateExercises(phrases, language) {
  const exercises = []
  phrases.forEach((phrase, index) => {
    const foreign = phrase.v || phrase.s || ''
    const english = phrase.e || ''
    const foreignWords = foreign.split(' ')
    
    // Use drag-and-drop only for phrases with 2+ words
    if (index % 2 === 0 || foreignWords.length < 2) {
      // Type the translation: show foreign → type English
      exercises.push({
        type: 'type',
        prompt: foreign,
        answer: english.toLowerCase().trim(),
        hint: english,
        words: foreignWords,
        language
      })
    } else {
      // Drag and drop: show English → arrange foreign words
      const shuffled = [...foreignWords].sort(() => Math.random() - 0.5)
      // Ensure shuffled is actually different from correct order
      if (shuffled.join(' ') === foreignWords.join(' ') && foreignWords.length > 1) {
        const temp = shuffled[0]
        shuffled[0] = shuffled[shuffled.length - 1]
        shuffled[shuffled.length - 1] = temp
      }
      exercises.push({
        type: 'drag',
        prompt: english,
        answer: foreign,
        shuffledWords: shuffled,
        correctWords: foreignWords,
        hint: foreign,
        language
      })
    }
  })
  return exercises
}

function HintWord({ word, hint }) {
  const [showHint, setShowHint] = useState(false)
  return (
    <span
      className="hint-word"
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => setShowHint(false)}
      onTouchStart={() => setShowHint(true)}
      onTouchEnd={() => setShowHint(false)}
    >
      {word}
      {showHint && <span className="hint-tooltip">{hint}</span>}
    </span>
  )
}

function TypeExercise({ exercise, onAnswer }) {
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setInput('')
    setFeedback(null)
    inputRef.current?.focus()
  }, [exercise])

  const checkAnswer = () => {
    const userAnswer = input.toLowerCase().trim()
    const correct = exercise.answer.toLowerCase().trim()
    // Allow minor typos (80% match)
    const similarity = getSimilarity(userAnswer, correct)
    if (similarity >= 0.8) {
      setFeedback('correct')
      setTimeout(() => onAnswer(true), 800)
    } else {
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 1500)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') checkAnswer()
  }

  return (
    <div className="exercise type-exercise">
      <div className="exercise-instruction">Translate this phrase:</div>
      <div className="exercise-prompt">
        {exercise.words.map((word, i) => (
          <HintWord key={i} word={word} hint={exercise.hint} />
        ))}
      </div>
      <input
        ref={inputRef}
        type="text"
        className={`type-input ${feedback || ''}`}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type the English translation..."
        autoComplete="off"
      />
      <button className="check-btn" onClick={checkAnswer}>Check Answer</button>
      {feedback === 'correct' && <div className="feedback correct">✅ Correct!</div>}
      {feedback === 'wrong' && <div className="feedback wrong">❌ Try again! Hint: {exercise.answer}</div>}
    </div>
  )
}

function DragExercise({ exercise, onAnswer }) {
  const [available, setAvailable] = useState([])
  const [placed, setPlaced] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)

  useEffect(() => {
    setAvailable([...exercise.shuffledWords])
    setPlaced([])
    setFeedback(null)
  }, [exercise])

  const handleDragStart = (index, source) => {
    setDraggedIndex({ index, source })
  }

  const handleDropToPlaced = () => {
    if (draggedIndex === null) return
    if (draggedIndex.source === 'available') {
      const word = available[draggedIndex.index]
      setPlaced([...placed, word])
      setAvailable(available.filter((_, i) => i !== draggedIndex.index))
    }
    setDraggedIndex(null)
  }

  const handleDropToAvailable = () => {
    if (draggedIndex === null) return
    if (draggedIndex.source === 'placed') {
      const word = placed[draggedIndex.index]
      setAvailable([...available, word])
      setPlaced(placed.filter((_, i) => i !== draggedIndex.index))
    }
    setDraggedIndex(null)
  }

  // Touch/click fallback for mobile
  const handleWordClick = (index, source) => {
    if (source === 'available') {
      const word = available[index]
      setPlaced([...placed, word])
      setAvailable(available.filter((_, i) => i !== index))
    } else {
      const word = placed[index]
      setAvailable([...available, word])
      setPlaced(placed.filter((_, i) => i !== index))
    }
  }

  const checkAnswer = () => {
    const userAnswer = placed.join(' ')
    const correctAnswer = exercise.correctWords.join(' ')
    if (userAnswer === correctAnswer) {
      setFeedback('correct')
      setTimeout(() => onAnswer(true), 800)
    } else {
      setFeedback('wrong')
      setTimeout(() => setFeedback(null), 1500)
    }
  }

  return (
    <div className="exercise drag-exercise">
      <div className="exercise-instruction">Arrange the words to translate:</div>
      <div className="exercise-prompt">
        <HintWord word={exercise.prompt} hint={exercise.hint} />
      </div>

      <div
        className="drop-zone placed-zone"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropToPlaced}
      >
        {placed.length === 0 && <span className="placeholder">Tap or drag words here...</span>}
        {placed.map((word, i) => (
          <span
            key={`placed-${i}`}
            className="drag-word placed"
            draggable
            onDragStart={() => handleDragStart(i, 'placed')}
            onClick={() => handleWordClick(i, 'placed')}
          >
            {word}
          </span>
        ))}
      </div>

      <div
        className="drop-zone available-zone"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropToAvailable}
      >
        {available.map((word, i) => (
          <span
            key={`avail-${i}`}
            className="drag-word available"
            draggable
            onDragStart={() => handleDragStart(i, 'available')}
            onClick={() => handleWordClick(i, 'available')}
          >
            {word}
          </span>
        ))}
      </div>

      <button className="check-btn" onClick={checkAnswer} disabled={placed.length === 0}>
        Check Answer
      </button>
      {feedback === 'correct' && <div className="feedback correct">✅ Correct!</div>}
      {feedback === 'wrong' && <div className="feedback wrong">❌ Not quite! Correct: {exercise.answer}</div>}
    </div>
  )
}

// Simple string similarity (Levenshtein-based)
function getSimilarity(a, b) {
  if (a === b) return 1
  if (!a || !b) return 0
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const dist = levenshtein(a, b)
  return 1 - dist / maxLen
}

function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export default function LessonPlayer({ lesson, language, onComplete, onClose }) {
  const [exercises, setExercises] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [easterEgg, setEasterEgg] = useState(null)

  // Easter egg love notes for Judy
  const loveNotes = [
    { msg: "Judy Ha, you make learning Vietnamese feel like falling in love all over again 💕", from: "— Oward" },
    { msg: "Every word I learn brings me closer to your heart, em ơi 🌸", from: "— Your Oward" },
    { msg: "Anh yêu em, Judy. You are the reason this app exists 💖", from: "— O" },
    { msg: "Judy Ha + Oward Cadenas = forever. Thank you for inspiring me 🇻🇳❤️", from: "— Always yours" },
    { msg: "You taught me that love speaks every language. Em là tất cả của anh 💕", from: "— Oward C." },
  ]

  useEffect(() => {
    if (lesson?.phrases) {
      setExercises(generateExercises(lesson.phrases, language))
      setCurrentIndex(0)
      setScore(0)
      setFinished(false)
      setEasterEgg(null)
    }
  }, [lesson?.id, language])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleAnswer = (correct) => {
    if (correct) setScore(s => s + 1)
    if (currentIndex + 1 < exercises.length) {
      setCurrentIndex(i => i + 1)
    } else {
      setFinished(true)
      // Easter egg: ~20% chance on Vietnamese lessons
      if (language === 'vietnamese' && Math.random() < 0.2) {
        setEasterEgg(loveNotes[Math.floor(Math.random() * loveNotes.length)])
      }
    }
  }

  const handleFinish = () => {
    onComplete(lesson)
  }

  if (!lesson || exercises.length === 0) return null

  const progress = ((currentIndex + (finished ? 1 : 0)) / exercises.length) * 100
  const currentExercise = exercises[currentIndex]

  return (
    <div className="lesson-player-overlay" onMouseDown={handleOverlayClick}>
      <div className="lesson-player" onMouseDown={e => e.stopPropagation()}>
        <div className="player-header">
          <button className="close-btn" onClick={onClose}>✕</button>
          <h2>{lesson.title}</h2>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-text">{currentIndex + 1} / {exercises.length}</div>
        </div>

        <div className="player-body">
          {finished ? (
            <div className="lesson-complete">
              <div className="complete-icon">🎉</div>
              <h3>Lesson Complete!</h3>
              <p className="score-text">Score: {score}/{exercises.length} correct</p>
              {easterEgg && (
                <div className="easter-egg-note">
                  <p className="ee-msg">{easterEgg.msg}</p>
                  <p className="ee-from">{easterEgg.from}</p>
                </div>
              )}
              <button className="finish-btn" onClick={handleFinish}>
                Collect +10 XP ✨
              </button>
            </div>
          ) : (
            <>
              {currentExercise.type === 'type' && (
                <TypeExercise exercise={currentExercise} onAnswer={handleAnswer} />
              )}
              {currentExercise.type === 'drag' && (
                <DragExercise exercise={currentExercise} onAnswer={handleAnswer} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
