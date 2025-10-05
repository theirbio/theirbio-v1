import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';
import { motion } from 'framer-motion';
export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-16">
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <Frown className="w-24 h-24 text-primary" strokeWidth={1.5} />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, ease: "easeOut" }}
        className="text-5xl font-bold font-display text-foreground"
      >
        404 - Page Not Found
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, ease: "easeOut" }}
        className="text-lg text-muted-foreground max-w-md"
      >
        Oops! The page you're looking for doesn't seem to exist. It might have been moved or deleted.
      </motion.p>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, ease: "easeOut" }}
      >
        <Button asChild size="lg" className="transition-transform active:scale-95 hover:scale-105">
          <Link to="/">Go Back Home</Link>
        </Button>
      </motion.div>
    </div>
  );
}