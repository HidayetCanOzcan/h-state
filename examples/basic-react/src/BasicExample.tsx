import './styles.css';
import { useStore } from './store/basicStore';
// import { PerformanceTest } from './components/PerformanceTest';

function BasicExample() {
  const store = useStore();

  return (
    <div className="main-container">
      <div className="content-wrapper">
        {/* Title */}
        <div className="title-container">
          <h1 className="main-title">H-State Demo</h1>
          <p className="subtitle">A lightweight and intuitive state management for React</p>
        </div>

        {/* Counter Example */}
        <div className="example-container">
          <section className="example-section">
            <h2 className="section-title">🔢 Counter Example</h2>
            <p className="section-description">
              Simple counter showing H-State&apos;s basic state management
            </p>
            <div className="counter-container">
              <button onClick={store.decrement} className="btn-decrement">
                -
              </button>
              <span className="counter-value">Count: {store.count}</span>
              <button onClick={store.increment} className="btn-increment">
                +
              </button>
            </div>
          </section>

          <div className="code-block">
            <pre>
              {`// Counter store example
const store = createStore({
  count: 0,
  increment: (state) => ({
    count: state.count + 1
  }),
  decrement: (state) => ({
    count: state.count - 1
  })
}); // Using H-State`}
            </pre>
          </div>
        </div>

        {/* User Example */}
        <div className="example-container">
          <section className="example-section">
            <h2 className="section-title">👤 User Example</h2>
            <p className="section-description">
              Demonstrates H-State&apos;s reactive state management
            </p>
            <div className="form-group">
              <label className="form-label">Name: </label>
              <input
                type="text"
                value={store.user.name}
                onChange={(e) => {
                  store.user.name = e.target.value;
                }}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age: </label>
              <input
                type="number"
                value={store.user.age}
                onChange={(e) => {
                  store.user.age = parseInt(e.target.value);
                }}
                className="form-input"
              />
            </div>
            <div className="user-info">
              User Info: {store.user.name} {store.user.age}
            </div>
          </section>

          <div className="code-block">
            <pre>
              {`// User store example with H-State
const store = createStore({
  user: { 
    name: '', 
    age: 0 
  },
  // Direct property updates are automatically tracked
  // No setters needed - H-State handles reactivity
  updateUser: (store) => {
    store.user.name = 'New Name';  // Direct updates work!
    store.user.age = 25;           // Changes trigger re-renders
  }
});`}
            </pre>
          </div>
        </div>

        {/* Todo Example */}
        <div className="example-container">
          <section className="example-section">
            <h2 className="section-title">📝 Todo Example</h2>
            <p className="section-description">Shows H-State&apos;s array state management</p>
            <div className="todo-form">
              <input
                type="text"
                value={store.newTodo}
                onChange={(e) => (store.newTodo = e.target.value)}
                placeholder="Add a new todo..."
                className="todo-input"
              />
              <button
                onClick={() => {
                  if (store.newTodo.trim()) {
                    store.addNewTodo();
                  }
                }}
                className="add-button"
              >
                Add
              </button>
            </div>
            <div className="todo-list">
              {store.todos.map((todo, index) => (
                <div key={index} className="todo-item">
                  <span>{todo}</span>
                  <button onClick={() => store.removeTodo(index)} className="todo-delete-btn">
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="code-block">
            <pre>
              {`// Todo store example with H-State
const store = createStore({
  todos: [] as string[],
  addTodo: (state, todo: string) => ({
    todos: [...state.todos, todo]
  }),
  removeTodo: (state, index: number) => ({
    todos: state.todos.filter((_, i) => i !== index)
  })
});`}
            </pre>
          </div>
        </div>

        {/* Performance Test */}
        {/* <PerformanceTest /> */}
      </div>
    </div>
  );
}

export default BasicExample;
