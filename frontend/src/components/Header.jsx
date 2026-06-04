import './Header.css'

function Header() {
  return (
    <header className="app-header" id="app-header">
      <div className="header-inner">
        <div className="header-logo">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div className="logo-text">
            <h1>Finansal Risk AI</h1>
            <span className="logo-badge">Explainable AI</span>
          </div>
        </div>
        <p className="header-desc">
          Karar ağaçları ile açıklanabilir yapay zeka destekli risk puanlaması
        </p>
      </div>
      <div className="header-glow"></div>
    </header>
  )
}

export default Header
