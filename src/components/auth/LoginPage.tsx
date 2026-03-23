import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const email = `${username}@dashboard.dev`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username, display_name: displayName || username } },
        })
        if (signUpError) throw signUpError
        if (!data.user) throw new Error('회원가입 실패')
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: displayName || username,
        })
        if (profileError) throw profileError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '오류가 발생했습니다'
      if (msg.includes('already registered')) setError('이미 사용 중인 아이디입니다')
      else if (msg.includes('Invalid login')) setError('아이디 또는 비밀번호가 틀렸습니다')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-5">
        {/* 탭 */}
        <div className="flex bg-card rounded-xl p-1 border border-border">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? 'bg-blue-600 text-white' : 'text-muted'
              }`}
            >
              {m === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="표시 이름"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500 transition-colors"
              style={{ color: 'var(--color-text)' }}
            />
          )}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
            placeholder="아이디"
            required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500 transition-colors"
            style={{ color: 'var(--color-text)' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            minLength={6}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 placeholder:text-muted focus:outline-none focus:border-blue-500 transition-colors"
            style={{ color: 'var(--color-text)' }}
          />

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2 px-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
      </div>
    </div>
  )
}
