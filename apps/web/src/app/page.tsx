// ZapTI Web — Landing Page / Redirect
import { redirect } from 'next/navigation';

// Redirect to dashboard - middleware will handle auth
export default function HomePage() {
  redirect('/dashboard');
}