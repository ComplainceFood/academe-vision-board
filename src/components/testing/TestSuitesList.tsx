import React, { useState } from 'react';
import { TestSuite } from '@/types/testing';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, TestTube, Calendar, FileText } from 'lucide-react';

interface TestSuitesListProps {
  projectId: string;
  suites?: TestSuite[];
  isLoading: boolean;
  onSelectSuite?: (suiteId: string) => void;
}

export function TestSuitesList({ projectId, suites, isLoading, onSelectSuite }: TestSuitesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'functional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'regression':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'smoke':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'integration':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'performance':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'security':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  if (!suites || suites.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <TestTube className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Test Suites Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first test suite to organize and manage test cases.
          </p>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create First Test Suite
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {suites.map((suite) => (
        <Card 
          key={suite.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onSelectSuite?.(suite.id)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{suite.name}</CardTitle>
              <Badge className={getTypeColor(suite.type)}>
                {suite.type}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {suite.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(suite.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>0 Tests</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}