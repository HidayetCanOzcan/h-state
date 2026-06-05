import './styles.css';
import { useStore } from './store/basicStore';
import { useState, useEffect } from 'react';
import { Docs } from './Docs';
import { IntelliSenseDemo } from './IntelliSenseDemo';
import DemoRoot from './DemoRoot';

function App() {
  const store = useStore();
  const [copied, setCopied] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);

  // Hash-based routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      // Show docs if hash is #docs or starts with #docs (for section anchors)
      // Also show docs if it's a docs section anchor like #installation
      const docsSections = ['installation', 'quick-start', 'basic-usage', 'nested-objects', 
        'arrays', 'subscriptions', 'time-travel', 'cross-tab', 'transactions', 'methods', 'persistence', 'batch', 'typescript', 'nextjs', 
        'examples', 'best-practices', 'migration', 'faq', 'api'];
      const isDocsSection = docsSections.some(s => hash === `#${s}`);
      setShowDocs(hash === '#docs' || isDocsSection);
      setShowPlayground(hash === '#playground');
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const goToDocs = () => {
    window.location.hash = '#docs';
    window.scrollTo(0, 0);
  };

  const goToPlayground = () => {
    window.location.hash = '#playground';
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    window.location.hash = '';
    window.scrollTo(0, 0);
  };

  if (showDocs) {
    return <Docs onBack={goHome} />;
  }

  if (showPlayground) {
    return (
      <div className="landing">
        <nav className="navbar">
          <div className="container navbar-content">
            <button onClick={goHome} className="navbar-logo" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              ← h-state
            </button>
            <div className="navbar-links">
              <button onClick={goToDocs} className="navbar-link">Docs</button>
            </div>
          </div>
        </nav>
        <DemoRoot />
      </div>
    );
  }

  const copyInstall = () => {
    navigator.clipboard.writeText('npm install h-state');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="landing">
      {/* Floating Orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Navbar */}
      <nav className="navbar">
        <div className="container navbar-content">
          <a href="#" className="navbar-logo">h-state</a>
          <div className="navbar-links">
            <button onClick={goToDocs} className="navbar-link">Docs</button>
            <button onClick={goToPlayground} className="navbar-link">Playground</button>
            <a href="#demo" className="navbar-link">Demo</a>
            <a 
              href="https://github.com/HidayetCanOzcan/h-state" 
              target="_blank" 
              rel="noopener noreferrer"
              className="navbar-link github-link"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-badge">
            <span>v2.8</span> • Lightweight State Management
          </div>
          
          <h1 className="hero-title">
            State Management<br />
            <span className="gradient">Made Simple</span>
          </h1>
          
          <p className="hero-subtitle">
            Write <code>store.count++</code> instead of <code>setState</code>. 
            Direct mutations with automatic reactivity. Zero boilerplate.
          </p>
          
          <div className="hero-buttons">
            <a href="#demo" className="btn btn-primary">
              Try It Live ↓
            </a>
            <button onClick={goToPlayground} className="btn btn-secondary">
              Playground →
            </button>
            <a href="https://github.com/HidayetCanOzcan/h-state" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              GitHub →
            </a>
          </div>

          <div className="hero-code">
            <div className="code-window">
              <div className="code-header">
                <span className="code-dot red"></span>
                <span className="code-dot yellow"></span>
                <span className="code-dot green"></span>
              </div>
              <div className="code-body">
                <div><span className="comment">// That's it. Really.</span></div>
                <div><span className="keyword">const</span> store = <span className="function">useStore</span>();</div>
                <div>&nbsp;</div>
                <div><span className="property">store</span>.<span className="property">count</span>++;</div>
                <div><span className="property">store</span>.<span className="property">user</span>.<span className="property">name</span> = <span className="string">"John"</span>;</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Why h-state?</span>
            <h2 className="section-title">Built for Developer Experience</h2>
            <p className="section-desc">
              Stop writing reducers and actions. Just mutate your state directly.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Direct Mutations</h3>
              <p className="feature-desc">
                Write <code>store.count++</code> instead of <code>dispatch(increment())</code>. 
                Natural JavaScript syntax.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Nested Objects</h3>
              <p className="feature-desc">
                Deep updates just work. <code>store.user.profile.bio = "..."</code> 
                triggers reactivity automatically.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🪶</div>
              <h3 className="feature-title">2KB Gzipped</h3>
              <p className="feature-desc">
                Tiny bundle size. No dependencies. 
                Just React as peer dependency.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💾</div>
              <h3 className="feature-title">Persistence Built-in</h3>
              <p className="feature-desc">
                localStorage persistence with one config option. 
                Debouncing and custom serialization included.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📦</div>
              <h3 className="feature-title">TypeScript First</h3>
              <p className="feature-desc">
                Full type inference. Your IDE knows everything 
                about your store without extra annotations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3 className="feature-title">Batch Updates</h3>
              <p className="feature-desc">
                Multiple mutations in one render with <code>batch()</code>. 
                Optimized for performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IntelliSense Demo */}
      <IntelliSenseDemo />

      {/* Demo Section */}
      <section className="section" id="demo">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Live Demo</span>
            <h2 className="section-title">See It In Action</h2>
            <p className="section-desc">
              Interactive examples showing real h-state usage. Try them!
            </p>
          </div>

          <div className="demo-grid">
            {/* Counter Demo */}
            <div className="demo-card">
              <div className="demo-header">
                <span className="demo-icon">🔢</span>
                <h3 className="demo-title">Counter</h3>
              </div>
              
              <div className="demo-content">
                <div className="counter-display">
                  <button 
                    className="counter-btn minus"
                    onClick={() => store.count--}
                  >
                    −
                  </button>
                  <span className="counter-value">{store.count}</span>
                  <button 
                    className="counter-btn plus"
                    onClick={() => store.count++}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="demo-code">
                <span className="comment">{'// Direct mutation'}</span><br/>
                <span className="keyword">onClick</span>{'={() => '}<span className="property">store</span>{'.count++}'}
              </div>
            </div>

            {/* User Form Demo */}
            <div className="demo-card">
              <div className="demo-header">
                <span className="demo-icon">👤</span>
                <h3 className="demo-title">Nested Objects</h3>
              </div>
              
              <div className="demo-content">
                <div className="form-field">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={store.user.name}
                    onChange={(e) => store.user.name = e.target.value}
                    placeholder="Enter name..."
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    className="form-input"
                    value={store.user.age}
                    onChange={(e) => store.user.age = parseInt(e.target.value) || 0}
                  />
                </div>
                <div className="user-preview">
                  <strong>{store.user.name}</strong>, {store.user.age} years old
                </div>
              </div>

              <div className="demo-code">
                <span className="comment">{'// Deep mutation'}</span><br/>
                <span className="property">store</span>{'.user.name = e.target.value'}
              </div>
            </div>

            {/* Todo Demo */}
            <div className="demo-card">
              <div className="demo-header">
                <span className="demo-icon">📝</span>
                <h3 className="demo-title">Arrays</h3>
              </div>
              
              <div className="demo-content">
                <div className="todo-input-group">
                  <input
                    type="text"
                    className="todo-input"
                    value={store.newTodo}
                    onChange={(e) => store.newTodo = e.target.value}
                    placeholder="Add todo..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && store.newTodo.trim()) {
                        store.addNewTodo();
                      }
                    }}
                  />
                  <button 
                    className="todo-add-btn"
                    onClick={() => {
                      if (store.newTodo.trim()) {
                        store.addNewTodo();
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="todo-list">
                  {store.todos.map((todo, i) => (
                    <div key={i} className="todo-item">
                      <span className="todo-text">{todo}</span>
                      <button 
                        className="todo-delete"
                        onClick={() => store.removeTodo(i)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="demo-code">
                <span className="comment">{'// Array updates'}</span><br/>
                <span className="property">store</span>{'.todos = [...store.todos, newTodo]'}
              </div>
            </div>

            {/* Methods Demo */}
            <div className="demo-card">
              <div className="demo-header">
                <span className="demo-icon">⚙️</span>
                <h3 className="demo-title">Methods</h3>
              </div>
              
              <div className="demo-content">
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={store.decrement}
                  >
                    Decrement
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={store.increment}
                  >
                    Increment
                  </button>
                </div>
                <div className="user-preview">
                  Count: <strong>{store.count}</strong>
                </div>
              </div>

              <div className="demo-code">
                <span className="comment">{'// Define methods in store'}</span><br/>
                <span className="keyword">increment</span>{': (store) => () => store.count++'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="section-label">Comparison</span>
            <h2 className="section-title">Less Code, Same Power</h2>
          </div>

          <div className="comparison-table">
            <div className="comparison-row comparison-header">
              <div className="comparison-cell">Feature</div>
              <div className="comparison-cell">h-state</div>
              <div className="comparison-cell">Others</div>
            </div>
            <div className="comparison-row">
              <div className="comparison-cell feature">Direct Mutations</div>
              <div className="comparison-cell"><span className="check">✓</span></div>
              <div className="comparison-cell"><span className="cross">✗</span></div>
            </div>
            <div className="comparison-row">
              <div className="comparison-cell feature">Nested Reactivity</div>
              <div className="comparison-cell"><span className="check">✓</span></div>
              <div className="comparison-cell"><span className="cross">✗</span></div>
            </div>
            <div className="comparison-row">
              <div className="comparison-cell feature">Zero Boilerplate</div>
              <div className="comparison-cell"><span className="check">✓</span></div>
              <div className="comparison-cell"><span className="cross">✗</span></div>
            </div>
            <div className="comparison-row">
              <div className="comparison-cell feature">Built-in Persistence</div>
              <div className="comparison-cell"><span className="check">✓</span></div>
              <div className="comparison-cell"><span className="cross">✗</span></div>
            </div>
            <div className="comparison-row">
              <div className="comparison-cell feature">TypeScript Support</div>
              <div className="comparison-cell"><span className="check">✓</span></div>
              <div className="comparison-cell"><span className="check">✓</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Install Section */}
      <section className="section">
        <div className="container">
          <div className="install-card">
            <h2 className="section-title">Get Started in Seconds</h2>
            <p className="section-desc">One command. No configuration needed.</p>
            
            <div className="install-command">
              <code>npm install h-state</code>
              <button onClick={copyInstall}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="hero-buttons" style={{ justifyContent: 'center' }}>
              <button 
                onClick={goToDocs}
                className="btn btn-primary"
              >
                Read the Docs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <button onClick={goToDocs} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}>
              Docs
            </button>
            <a href="https://github.com/HidayetCanOzcan/h-state" target="_blank" rel="noopener noreferrer" className="footer-link">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/h-state" target="_blank" rel="noopener noreferrer" className="footer-link">
              npm
            </a>
            <a href="https://github.com/HidayetCanOzcan/h-state/issues" target="_blank" rel="noopener noreferrer" className="footer-link">
              Issues
            </a>
          </div>
          <p className="footer-text">
            Built with ❤️ by <a href="https://github.com/HidayetCanOzcan" target="_blank" rel="noopener noreferrer">Hidayet Can Özcan</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
