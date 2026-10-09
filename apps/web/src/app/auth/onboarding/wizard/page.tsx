'use client'

import { useState } from 'react'

export default function OnboardingWizard() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            ZapTI Onboarding
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Configure your WhatsApp automation platform
          </p>
        </div>

        <div className="space-y-4">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Step 1: Tenant Setup</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Configure your tenant settings
              </p>
              <button
                onClick={() => setStep(2)}
                className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Step 2: WhatsApp Connection</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Connect your WhatsApp Business account
              </p>
              <button
                onClick={() => setStep(3)}
                className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Step 3: Complete</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Your setup is complete!
              </p>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="mt-4 w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Step {step} of 3
          </span>
        </div>
      </div>
    </div>
  )
}