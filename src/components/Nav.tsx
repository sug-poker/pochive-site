import { useState, useEffect } from 'react'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
      <a href="#" className="nav-logo">Pochive</a>
      <ul className="nav-links">
        <li><a href="#features">機能</a></li>
        <li><a href="#pricing">料金</a></li>
        <li><a href="#contact">お問い合わせ</a></li>
      </ul>
    </nav>
  )
}
