import { useState, useEffect } from 'react';

const suggestions = [
  { name: 'count', type: 'number', icon: '𝟙' },
  { name: 'user', type: '{ name: string; age: number }', icon: '{}' },
  { name: 'todos', type: 'Todo[]', icon: '[]' },
  { name: 'isLoading', type: 'boolean', icon: '◐' },
  { name: 'theme', type: '"light" | "dark"', icon: '◑' },
  { name: 'increment', type: '() => void', icon: 'ƒ' },
  { name: 'setUser', type: '(name: string) => void', icon: 'ƒ' },
];

export function IntelliSenseDemo() {
  const [text, setText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'dropdown' | 'selecting' | 'complete' | 'pause'>('typing');
  
  const fullText = 'store.';
  const completedText = 'store.user.name';

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < fullText.length) {
        timeout = setTimeout(() => {
          setText(fullText.slice(0, text.length + 1));
        }, 150);
      } else {
        timeout = setTimeout(() => {
          setShowDropdown(true);
          setPhase('dropdown');
        }, 300);
      }
    } else if (phase === 'dropdown') {
      timeout = setTimeout(() => {
        setPhase('selecting');
      }, 800);
    } else if (phase === 'selecting') {
      if (selectedIndex < 1) {
        timeout = setTimeout(() => {
          setSelectedIndex(prev => prev + 1);
        }, 400);
      } else {
        timeout = setTimeout(() => {
          setShowDropdown(false);
          setText(completedText);
          setPhase('complete');
        }, 600);
      }
    } else if (phase === 'complete') {
      timeout = setTimeout(() => {
        setPhase('pause');
      }, 2000);
    } else if (phase === 'pause') {
      timeout = setTimeout(() => {
        setText('');
        setShowDropdown(false);
        setSelectedIndex(0);
        setPhase('typing');
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [text, phase, selectedIndex]);

  return (
    <section className="section intellisense-section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">TypeScript First</span>
          <h2 className="section-title">Full IntelliSense Support</h2>
          <p className="section-desc">
            Your IDE knows everything about your store. 
            No type annotations needed - it just works.
          </p>
        </div>

        <div className="intellisense-demo">
          <div className="ide-window">
            <div className="ide-header">
              <div className="ide-dots">
                <span className="code-dot red"></span>
                <span className="code-dot yellow"></span>
                <span className="code-dot green"></span>
              </div>
              <span className="ide-filename">App.tsx — h-state</span>
              <div className="ide-tabs">
                <span className="ide-tab active">App.tsx</span>
                <span className="ide-tab">store.ts</span>
              </div>
            </div>
            
            <div className="ide-content">
              <div className="ide-sidebar">
                <div className="line-numbers">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
              </div>
              
              <div className="ide-code">
                <div className="code-line dim">
                  <span className="keyword">import</span> {'{ useStore }'} <span className="keyword">from</span> <span className="string">'./store'</span>;
                </div>
                <div className="code-line dim">&nbsp;</div>
                <div className="code-line dim">
                  <span className="keyword">function</span> <span className="function">App</span>() {'{'}
                </div>
                <div className="code-line dim">
                  &nbsp;&nbsp;<span className="keyword">const</span> store = <span className="function">useStore</span>();
                </div>
                <div className="code-line dim">&nbsp;</div>
                <div className="code-line active-line">
                  &nbsp;&nbsp;<span className="keyword">return</span> {'<div>{'}<span className="typing-text">{text}</span><span className="cursor">|</span>
                  
                  {showDropdown && (
                    <div className="intellisense-dropdown">
                      {suggestions.map((s, i) => (
                        <div 
                          key={s.name} 
                          className={`suggestion ${i === selectedIndex ? 'selected' : ''}`}
                        >
                          <span className="suggestion-icon">{s.icon}</span>
                          <span className="suggestion-name">{s.name}</span>
                          <span className="suggestion-type">{s.type}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="code-line dim">&nbsp;</div>
                <div className="code-line dim">{'}'}</div>
              </div>
            </div>
            
            <div className="ide-statusbar">
              <span>TypeScript</span>
              <span>UTF-8</span>
              <span className="ts-check">✓ No errors</span>
            </div>
          </div>

          <div className="intellisense-features">
            <div className="intellisense-feature">
              <div className="feature-check">✓</div>
              <div>
                <strong>Auto-complete properties</strong>
                <p>All state properties appear in suggestions</p>
              </div>
            </div>
            <div className="intellisense-feature">
              <div className="feature-check">✓</div>
              <div>
                <strong>Type-safe mutations</strong>
                <p>TypeScript catches errors before runtime</p>
              </div>
            </div>
            <div className="intellisense-feature">
              <div className="feature-check">✓</div>
              <div>
                <strong>Method signatures</strong>
                <p>See parameter types and return values</p>
              </div>
            </div>
            <div className="intellisense-feature">
              <div className="feature-check">✓</div>
              <div>
                <strong>Nested object support</strong>
                <p>Deep types are fully inferred</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
