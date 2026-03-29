import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { SystemHealthRunner } from '@/components/testing/SystemHealthRunner';
import { ShieldCheck } from 'lucide-react';

export default function TestingPage() {
  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">System Health Monitor</h1>
              <p className="text-primary-foreground/80 text-lg mt-1">
                Automated checks across all platform modules — run on demand or on a schedule
              </p>
            </div>
          </div>
        </div>

        <SystemHealthRunner />
      </div>
    </MainLayout>
  );
}
