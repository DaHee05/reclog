'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'

const TEST_EMAIL = 'test@reclog.dev'
const TEST_PASSWORD = 'reclog1234!'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setSignUpSuccess(true)
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.replace('/')
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStart = async () => {
    setError('')
    setLoading(true)

    try {
      // 테스트 계정으로 로그인 시도
      const { error } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      })
      if (error) {
        // 계정이 없으면 회원가입 후 로그인
        const { error: signUpError } = await supabase.auth.signUp({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        })
        if (signUpError) throw signUpError

        // 바로 로그인 시도
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        })
        if (loginError) {
          setError('테스트 계정 생성 완료! 이메일 인증 후 다시 시도해주세요.')
          return
        }
      }
      router.replace('/')
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (signUpSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-lg mx-auto px-5 w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 text-center space-y-4 border border-border shadow-md shadow-stone-200/40">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">이메일을 확인해주세요</h2>
            <p className="text-muted-foreground text-sm">
              <span className="font-medium text-foreground">{email}</span>
              <br />
              으로 인증 링크를 보냈습니다.
              <br />
              이메일의 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setSignUpSuccess(false)
                setIsSignUp(false)
              }}
            >
              로그인으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 min-h-screen flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight italic">LOG</h1>
          <p className="text-muted-foreground text-sm mt-2">
            나의 소중한 순간들을 기록하세요
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 space-y-5 border border-border shadow-md shadow-stone-200/40">
          <h2 className="text-xl font-bold text-foreground text-center">
            {isSignUp ? '회원가입' : '로그인'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted border-0 rounded-xl h-12 pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignUp ? '6자 이상 입력해주세요' : '비밀번호를 입력하세요'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-muted border-0 rounded-xl h-12 pl-11 pr-11"
                  required
                  minLength={isSignUp ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full rounded-full h-12 text-base"
              disabled={loading}
            >
              {loading ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          {/* Quick Start */}
          <Button
            variant="outline"
            className="w-full rounded-full h-12 text-base gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={handleQuickStart}
            disabled={loading}
          >
            <Zap className="h-4 w-4" />
            바로 시작하기
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            테스트 계정으로 바로 체험할 수 있어요
          </p>
        </div>

        {/* Toggle Sign Up / Login */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError('')
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? (
              <>이미 계정이 있나요? <span className="text-primary font-medium">로그인</span></>
            ) : (
              <>계정이 없나요? <span className="text-primary font-medium">회원가입</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
