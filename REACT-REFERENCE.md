# React Documentation Reference

Generated from Context7 Library: `/reactjs/react.dev`

## Table of Contents
- [Core Concepts](#core-concepts)
- [Hooks](#hooks)
- [State Management](#state-management)
- [Props and Components](#props-and-components)
- [Custom Hooks](#custom-hooks)
- [Best Practices](#best-practices)

## Core Concepts

### useState Hook
The fundamental hook for managing state in functional components.

```javascript
import { useState } from 'react';

function Component() {
  const [state, setState] = useState(initialValue);
  // state: current value
  // setState: function to update state
}
```

**Key Points:**
- Must be called at the top level of components or custom hooks
- Cannot be called inside conditions, loops, or nested functions
- Returns an array with current state and setter function
- Calling setter triggers re-render

### Component State Management

```javascript
// Multiple state variables
function Form() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  
  return (
    <>
      <input value={name} onChange={e => setName(e.target.value)} />
      <button onClick={() => setAge(age + 1)}>Increment age</button>
    </>
  );
}
```

## Hooks

### Built-in React Hooks

#### useState
```javascript
const [state, setState] = useState(initialState);
```
- **Purpose**: Add state to functional components
- **Parameters**: Initial state (value or function)
- **Returns**: `[currentState, setterFunction]`

#### useEffect
```javascript
useEffect(() => {
  // Side effect logic
  return () => {
    // Cleanup function (optional)
  };
}, [dependencies]);
```
- **Purpose**: Handle side effects
- **Parameters**: Setup function, dependency array
- **Behavior**: Re-runs when dependencies change

#### useContext
```javascript
const value = useContext(MyContext);
```
- **Purpose**: Subscribe to React context
- **Returns**: Current context value

#### useReducer
```javascript
const [state, dispatch] = useReducer(reducer, initialState);
```
- **Purpose**: Complex state management
- **Alternative to**: Multiple useState calls

#### useActionState (React 19)
```javascript
import { useActionState } from 'react';

function Component() {
  const [state, formAction] = useActionState(action, initialState);
  
  return (
    <form action={formAction}>
      {/* form content */}
    </form>
  );
}
```
- **Purpose**: Manage state based on form actions
- **Returns**: `[state, formAction]`

#### useFormStatus (React DOM)
```javascript
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
}
```
- **Purpose**: Access parent form submission status
- **Returns**: Object with `pending`, `data`, `method`, `action`

## State Management

### Lifting State Up
When multiple components need to share state, move it to their common parent.

```javascript
// Parent manages shared state
function Parent() {
  const [count, setCount] = useState(0);
  
  return (
    <>
      <Child count={count} onIncrement={() => setCount(count + 1)} />
      <Child count={count} onIncrement={() => setCount(count + 1)} />
    </>
  );
}

// Child receives state via props
function Child({ count, onIncrement }) {
  return <button onClick={onIncrement}>Count: {count}</button>;
}
```

### State Reset with Key Prop
Force component remount and state reset by changing the `key` prop.

```javascript
function App() {
  const [version, setVersion] = useState(0);
  
  return (
    <>
      <button onClick={() => setVersion(v => v + 1)}>Reset</button>
      <Form key={version} />
    </>
  );
}
```

### Context for Deep Prop Passing
Avoid prop drilling with React Context.

```javascript
// Create context
const ThemeContext = createContext();

// Provide context
function App() {
  return (
    <ThemeContext.Provider value="dark">
      <DeepChild />
    </ThemeContext.Provider>
  );
}

// Consume context
function DeepChild() {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
}
```

## Props and Components

### Immutability Rules
**Never mutate props or state directly!**

```javascript
// ❌ Bad: Direct mutation
function Bad({ item }) {
  item.url = newUrl; // Never mutate props
  return <Link url={item.url} />;
}

// ✅ Good: Create new value
function Good({ item }) {
  const url = new URL(item.url); // Create copy
  return <Link url={url} />;
}

// ❌ Bad: Direct state mutation
count = count + 1; 

// ✅ Good: Use setter function
setCount(count + 1);
```

### Controlled vs Uncontrolled Components

**Controlled Component** - Parent manages state:
```javascript
function Parent() {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={setValue} />;
}
```

**Uncontrolled Component** - Component manages own state:
```javascript
function Input() {
  const [value, setValue] = useState('');
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}
```

## Custom Hooks

### Creating Custom Hooks
Extract reusable stateful logic into custom hooks.

```javascript
// Custom hook for form input
function useFormInput(initialValue) {
  const [value, setValue] = useState(initialValue);
  
  const handleChange = (e) => setValue(e.target.value);
  
  return {
    value,
    onChange: handleChange
  };
}

// Using the custom hook
function Form() {
  const firstName = useFormInput('');
  const lastName = useFormInput('');
  
  return (
    <>
      <input {...firstName} />
      <input {...lastName} />
    </>
  );
}
```

### Custom Hook for External Store
```javascript
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    function handleOnline() { setIsOnline(true); }
    function handleOffline() { setIsOnline(false); }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}
```

## Best Practices

### Rules of Hooks
1. **Only call at top level** - Not inside loops, conditions, or nested functions
2. **Only call from React functions** - Components or custom hooks
3. **Prefix custom hooks with "use"** - Convention for identifying hooks

### Component Purity
Components should be pure functions:
- Same inputs → Same outputs
- No side effects during render
- Don't mutate props, state, or external variables

### Performance Optimization

#### Memoization
```javascript
import { useMemo, useCallback } from 'react';

function Component({ data }) {
  // Memoize expensive calculation
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );
  
  // Memoize callback function
  const handleClick = useCallback(
    () => doSomething(data),
    [data]
  );
}
```

#### State Updates
```javascript
// Batch state updates (automatic in React 18+)
function handleClick() {
  setCount(c => c + 1);
  setFlag(f => !f);
  // Single re-render for both updates
}

// Functional updates for dependent state
setCount(prevCount => prevCount + 1);
```

### Form Handling

#### Controlled Forms
```javascript
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Process formData
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
      {/* Other inputs */}
    </form>
  );
}
```

### Error Boundaries
```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, info) {
    console.error('Error caught:', error, info);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

## Common Patterns

### Conditional Rendering
```javascript
// Using ternary operator
{isLoggedIn ? <Dashboard /> : <Login />}

// Using logical AND
{showWarning && <Warning />}

// Early return
if (!data) return <Loading />;
return <Content data={data} />;
```

### Lists and Keys
```javascript
function TodoList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.text}</li>
      ))}
    </ul>
  );
}
```

### Event Handling
```javascript
function Button() {
  const handleClick = (e) => {
    e.preventDefault();
    console.log('Clicked!');
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

## React 19 Features

### Server Components
Components that render on the server, reducing bundle size.

### Actions
Form actions and server actions for handling mutations.

```javascript
async function updateName(formData) {
  'use server';
  const name = formData.get('name');
  await updateDatabase(name);
}

<form action={updateName}>
  <input name="name" />
  <button type="submit">Update</button>
</form>
```

### Suspense for Data Fetching
```javascript
<Suspense fallback={<Loading />}>
  <DataComponent />
</Suspense>
```

## Additional Resources

- Official React Documentation: https://react.dev
- React GitHub: https://github.com/facebook/react
- React RFC Repository: https://github.com/reactjs/rfcs

---

*This reference was generated from the official React documentation using Context7.*