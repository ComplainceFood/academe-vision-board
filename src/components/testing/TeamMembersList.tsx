import React, { useState } from 'react';
import { useDataFetching } from '@/hooks/useDataFetching';
import { TestTeamMember } from '@/types/testing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Crown, Shield, User } from 'lucide-react';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';

interface TeamMembersListProps {
  projectId: string;
}

export function TeamMembersList({ projectId }: TeamMembersListProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: teamMembers, isLoading, refetch } = useDataFetching<TestTeamMember>({
    table: 'test_team_members' as any,
    filters: [{ column: 'project_id', value: projectId, operator: 'eq' }],
    enabled: !!projectId
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      case 'lead_tester':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'manager':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'lead_tester':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'tester':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'developer':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Team Members Yet</h3>
          <p className="text-muted-foreground mb-4">
            Add team members to collaborate on this testing project.
          </p>
          <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Team Member
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Members</h3>
        <Button onClick={() => setShowAddDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {member.user_id.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getRoleIcon(member.role)}
                    <span className="font-medium text-sm truncate">
                      Member {member.user_id.slice(0, 8)}
                    </span>
                  </div>
                  <Badge className={getRoleColor(member.role)} variant="secondary">
                    {member.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-3 text-xs text-muted-foreground">
                <p>Joined: {new Date(member.created_at).toLocaleDateString()}</p>
                
                {member.permissions && Object.keys(member.permissions).length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium mb-1">Permissions:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(member.permissions).map(([key, value]) => (
                        value && (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key.replace('_', ' ')}
                          </Badge>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AddTeamMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        projectId={projectId}
        onSuccess={refetch}
      />
    </div>
  );
}