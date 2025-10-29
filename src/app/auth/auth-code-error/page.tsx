// src/app/auth/auth-code-error/page.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">eMarketer.pro</h1>
          <h2 className="mt-6 text-2xl font-bold text-red-600">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was a problem signing you in. Please try again.
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <Link href="/auth/signin">
            <Button className="w-full">
              Try Again
            </Button>
          </Link>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
