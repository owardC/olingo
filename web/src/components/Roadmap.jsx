import React from 'react'

export default function Roadmap({ onSelectLevel, activeLevel }) {
  const nodes = [ 'beginner', 'intermediate', 'expert' ]

  return (
    <div>
      <h3>Roadmap</h3>
      <div className="roadmap">
        {nodes.map(n => (
          <div key={n} className="level" onClick={() => onSelectLevel(n)} style={{opacity: activeLevel===n?1:0.7}}>
            {n[0].toUpperCase()+n.slice(1)}
          </div>
        ))}
      </div>
    </div>
  )
}
