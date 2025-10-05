import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { Toaster } from '@/components/ui/sonner';
export function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <Footer />
      <Toaster richColors position="top-right" />
    </div>
  );
}