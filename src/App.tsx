/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ShoppingCart, LogIn, LogOut, LayoutDashboard, Coffee, Clock } from 'lucide-react';
import OrderingSystem from './components/OrderingSystem';
import AdminDashboard from './components/AdminDashboard';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, isAdmin, login, logout, profile, loading } = useAuth();
  const [view, setView] = useState<'customer' | 'admin'>('customer');

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-bg-base">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Coffee className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base font-sans flex flex-col">
      {/* Header - Professional Polish Style */}
      <header className="h-16 bg-primary text-white flex items-center justify-between px-6 border-b-4 border-accent shadow-md sticky top-0 z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer select-none" 
          onClick={() => setView('customer')}
        >
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-primary text-lg font-black">
            茶
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-black tracking-widest">PRESOTEA</span>
            <span className="text-xs font-bold opacity-90 tracking-[0.2em] -mt-1 uppercase">鮮茶道點單系統</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isAdmin && (
            <button 
              onClick={() => setView(view === 'customer' ? 'admin' : 'customer')}
              className="bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider"
            >
              {view === 'customer' ? '後台管理系統' : '回前台點餐'}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-4 border-l border-white/20 pl-6 h-8">
              <div className="text-right">
                <p className="text-[10px] opacity-70 uppercase font-bold">Operator</p>
                <p className="text-sm font-bold">{profile?.displayName || user.displayName}</p>
              </div>
              <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button onClick={login} className="bg-white text-primary px-5 py-1.5 rounded-full font-bold text-sm hover:shadow-lg transition-all active:scale-95">
              帳號登入
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'admin' && isAdmin ? (
            <motion.div
              key="admin"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="max-w-7xl mx-auto p-6">
                <AdminDashboard />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="customer"
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <OrderingSystem />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Footer (Compact) */}
      <footer className="bg-white border-t border-line py-3 px-6 text-center text-[10px] text-text-muted uppercase tracking-[0.2em]">
        © 2026 Presotea Internal Ordering System. All rights reserved.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
