import { useState, useEffect, useCallback, useRef } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'

export interface GCalEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  colorId?: string
  htmlLink?: string
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void
  callback: (resp: TokenResponse) => void
}

interface TokenResponse {
  access_token?: string
  error?: string
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = reject
    document.head.appendChild(s)
  })
}

/** PWA standalone 모드인지 감지 */
function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as any).standalone === true
}

/** URL hash에서 OAuth implicit flow 토큰 파싱 */
function parseTokenFromHash(): { access_token: string; expires_in: number } | null {
  const hash = window.location.hash.substring(1)
  if (!hash) return null
  const params = new URLSearchParams(hash)
  const token = params.get('access_token')
  const expiresIn = params.get('expires_in')
  if (token) {
    // hash 정리
    history.replaceState(null, '', window.location.pathname + window.location.search)
    return { access_token: token, expires_in: Number(expiresIn) || 3600 }
  }
  return null
}

export function useGoogleCalendar() {
  const [events, setEvents] = useState<GCalEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [ready, setReady] = useState(false)
  const tokenClientRef = useRef<TokenClient | null>(null)
  const pendingActionRef = useRef<(() => void) | null>(null)

  // Load GAPI + GIS scripts
  useEffect(() => {
    if (!CLIENT_ID) return

    async function init() {
      try {
        // URL hash에서 토큰 복원 (OAuth implicit flow redirect 후)
        const hashToken = parseTokenFromHash()
        if (hashToken) {
          // GAPI 로드 후 토큰 설정
          await loadScript('https://apis.google.com/js/api.js')
          await new Promise<void>((resolve) => {
            ;(window as any).gapi.load('client', async () => {
              await (window as any).gapi.client.init({})
              await (window as any).gapi.client.load(DISCOVERY_DOC)
              resolve()
            })
          })
          const tokenObj = {
            access_token: hashToken.access_token,
            token_type: 'Bearer',
            expires_in: hashToken.expires_in,
          }
          ;(window as any).gapi.client.setToken(tokenObj)
          localStorage.setItem('gcal_token', JSON.stringify(tokenObj))
          setIsSignedIn(true)
          setReady(true)
          return
        }

        await Promise.all([
          loadScript('https://apis.google.com/js/api.js'),
          loadScript('https://accounts.google.com/gsi/client'),
        ])

        // Init GAPI
        await new Promise<void>((resolve) => {
          ;(window as any).gapi.load('client', async () => {
            await (window as any).gapi.client.init({})
            await (window as any).gapi.client.load(DISCOVERY_DOC)
            resolve()
          })
        })

        // 브라우저 모드에서만 GIS token client 초기화
        if (!isStandalone()) {
          tokenClientRef.current = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (resp: TokenResponse) => {
              if (resp.error) return
              const token = (window as any).gapi.client.getToken()
              if (token) localStorage.setItem('gcal_token', JSON.stringify(token))
              setIsSignedIn(true)
              if (pendingActionRef.current) {
                pendingActionRef.current()
                pendingActionRef.current = null
              }
            },
          })
        }

        // 저장된 토큰 복원
        const saved = localStorage.getItem('gcal_token')
        if (saved) {
          try {
            const token = JSON.parse(saved)
            ;(window as any).gapi.client.setToken(token)
            setIsSignedIn(true)
          } catch { localStorage.removeItem('gcal_token') }
        }
      } catch (e) {
        console.error('Google Calendar init error:', e)
      }

      // 항상 ready 설정 — 실패해도 redirect 방식으로 signIn 가능
      setReady(true)
    }

    init()
  }, [])

  const signIn = useCallback(() => {
    // PWA standalone 모드: OAuth implicit flow redirect
    if (isStandalone() || !tokenClientRef.current) {
      const redirectUri = window.location.origin + window.location.pathname
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
        + `?client_id=${encodeURIComponent(CLIENT_ID)}`
        + `&redirect_uri=${encodeURIComponent(redirectUri)}`
        + `&response_type=token`
        + `&scope=${encodeURIComponent(SCOPES)}`
        + `&prompt=consent`
      window.location.href = authUrl
      return
    }
    // 일반 브라우저: 기존 팝업 방식
    const token = (window as any).gapi.client.getToken()
    if (!token) {
      tokenClientRef.current.requestAccessToken({ prompt: 'consent' })
    } else {
      tokenClientRef.current.requestAccessToken({ prompt: '' })
    }
  }, [])

  const signOut = useCallback(() => {
    const token = (window as any).gapi.client.getToken()
    if (token) {
      ;(window as any).google.accounts.oauth2.revoke(token.access_token)
      ;(window as any).gapi.client.setToken(null)
    }
    setIsSignedIn(false)
    setEvents([])
    localStorage.removeItem('gcal_token')
  }, [])

  const ensureAuth = useCallback((action: () => void) => {
    const token = (window as any).gapi.client.getToken()
    if (token) {
      action()
    } else {
      pendingActionRef.current = action
      signIn()
    }
  }, [signIn])

  const fetchEvents = useCallback(async (timeMin?: string, timeMax?: string) => {
    setLoading(true)
    try {
      const now = new Date()
      const min = timeMin || now.toISOString()
      const max = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

      const resp = await (window as any).gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: min,
        timeMax: max,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      })
      setEvents(resp.result.items || [])
    } catch (e) {
      console.error('Google Calendar fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const createEvent = useCallback(async (summary: string, startDateTime: string, endDateTime?: string) => {
    const end = endDateTime || new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString()
    try {
      const resp = await (window as any).gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: {
          summary,
          start: { dateTime: startDateTime, timeZone: 'Asia/Seoul' },
          end: { dateTime: end, timeZone: 'Asia/Seoul' },
        },
      })
      setEvents(prev => [...prev, resp.result].sort((a, b) => {
        const aTime = a.start.dateTime || a.start.date || ''
        const bTime = b.start.dateTime || b.start.date || ''
        return aTime.localeCompare(bTime)
      }))
      return resp.result
    } catch (e) {
      console.error('Google Calendar create error:', e)
      return null
    }
  }, [])

  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await (window as any).gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      })
      setEvents(prev => prev.filter(e => e.id !== eventId))
    } catch (e) {
      console.error('Google Calendar delete error:', e)
    }
  }, [])

  const updateEvent = useCallback(async (eventId: string, updates: { summary?: string; start?: string; end?: string }) => {
    try {
      const resource: any = {}
      if (updates.summary) resource.summary = updates.summary
      if (updates.start) resource.start = { dateTime: updates.start, timeZone: 'Asia/Seoul' }
      if (updates.end) resource.end = { dateTime: updates.end, timeZone: 'Asia/Seoul' }

      const resp = await (window as any).gapi.client.calendar.events.patch({
        calendarId: 'primary',
        eventId,
        resource,
      })
      setEvents(prev => prev.map(e => e.id === eventId ? resp.result : e))
      return resp.result
    } catch (e) {
      console.error('Google Calendar update error:', e)
      return null
    }
  }, [])

  return {
    events,
    loading,
    isSignedIn,
    ready,
    signIn,
    signOut,
    ensureAuth,
    fetchEvents,
    createEvent,
    deleteEvent,
    updateEvent,
  }
}
