import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { SystemHealthRunner } from '@/components/testing/SystemHealthRunner';
import { SecurityScanner } from '@/components/testing/SecurityScanner';
import { SeedTestCases } from '@/components/testing/SeedTestCases';
import { ShieldCheck, Activity, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'health', label: 'System Health', icon: Activity },
  { id: 'security', label: 'Security Scan', icon: ShieldCheck },
  { id: 'seed', label: 'Seed Test Cases', icon: FlaskConical },
];

export default function TestingPage() {
  const [activeTab, setActiveTab] = useState('health');

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-primary p-5 sm:p-8 text-primary-foreground">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-secondary/20 rounded-full blur-3xl animate-pulse" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20 shadow-xl">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Testing Platform</h1>
              <p className="text-primary-foreground/80 text-lg mt-1">
                System health monitoring and security vulnerability scanning
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-white shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'health' && <SystemHealthRunner />}
        {activeTab === 'security' && <SecurityScanner />}
        {activeTab === 'seed' && <SeedTestCases />}
      </div>
    </MainLayout>
  );
}
