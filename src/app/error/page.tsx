'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowLeft, Mail, Key, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('type') || 'general'

  const getErrorContent = () => {
    switch (errorType) {
      case 'invalid_credentials':
        return {
          title: 'Invalid Credentials',
          description: 'The email or password you entered is incorrect.',
          icon: <Key className="h-6 w-6 text-red-600" />,
          suggestions: [
            'Double-check your email and password',
            'Make sure your account email is confirmed',
            'Try resetting your password if needed'
          ]
        }
      case 'email_not_confirmed':
        return {
          title: 'Email Not Confirmed',
          description: 'Please check your email and click the confirmation link.',
          icon: <Mail className="h-6 w-6 text-yellow-600" />,
          suggestions: [
            'Check your email inbox and spam folder',
            'Click the confirmation link in the email',
            'Try creating a new account if the link expired'
          ]
        }
      case 'validation_error':
        return {
          title: 'Form Validation Error',
          description: 'Some required fields are missing or invalid.',
          icon: <UserCheck className="h-6 w-6 text-orange-600" />,
          suggestions: [
            'Fill in all required fields',
            'Make sure passwords match',
            'Accept the terms and conditions'
          ]
        }
      default:
        return {
          title: 'Authentication Error',
          description: 'There was a problem with your login attempt.',
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          suggestions: [
            'Incorrect email or password',
            'Account not verified',
            'Account temporarily locked'
          ]
        }
    }
  }

  const errorContent = getErrorContent()

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          {errorContent.icon}
        </div>
        <CardTitle className="mt-4">{errorContent.title}</CardTitle>
        <CardDescription>
          {errorContent.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground text-center">
          <p>This could be due to:</p>
          <ul className="mt-2 list-disc list-inside text-left space-y-1">
            {errorContent.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col space-y-2">
          <Button asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/signup">
              Create New Account
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  )
} 