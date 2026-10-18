import { useState } from 'react'
import { ArrowRight, Check, LockKeyhole, X } from 'lucide-react'

export default function AuthModal({ brand = 'Flowly', onClose }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!email.includes('@') || password.length < 4) {
      setError('Enter a valid email and at least 4 characters for the password.')
      return
    }
    setError('')
    setDone(true)
  }

  return <div className="auth-overlay" role="dialog" aria-modal="true" aria-label={`${brand} sign in`}>
    <button className="auth-backdrop" onClick={onClose} aria-label="Close sign in" />
    <div className="auth-modal">
      <button className="auth-close" onClick={onClose} aria-label="Close"><X size={19}/></button>
      {done ? <div className="auth-success"><span><Check size={28}/></span><h2>Welcome to {brand}.</h2><p>You’re signed in for this UI demo.</p><button onClick={onClose}>Continue <ArrowRight size={16}/></button></div> : <>
        <span className="auth-icon"><LockKeyhole size={21}/></span>
        <h2>{mode === 'signin' ? `Sign in to ${brand}` : `Create your ${brand} account`}</h2>
        <p>Keep your preferences and progress together in one place.</p>
        <form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus/></label><label>Password<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="At least 4 characters"/></label>{error && <span className="auth-error">{error}</span>}<button type="submit">{mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></button></form>
        <button className="auth-switch" onClick={()=>setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button>
        <small>Demo only—credentials are not stored or sent anywhere.</small>
      </>}
    </div>
  </div>
}
