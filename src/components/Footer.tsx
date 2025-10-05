import React from 'react';
export function Footer() {
  return (
    <footer className="w-full border-t border-border">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} theirBio. All rights reserved.</p>
      </div>
    </footer>
  );
}