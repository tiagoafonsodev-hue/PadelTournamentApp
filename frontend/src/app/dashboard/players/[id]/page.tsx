'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, TrendingUp, History, User, Mail, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Player } from '@/types';
import { Button, Spinner, Card, Badge } from '@/components/ui';

async function fetchPlayer(id: string): Promise<Player> {
  const { data } = await apiClient.get<Player>(`/api/players/${id}`);
  return data;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const { data: player, isLoading, error } = useQuery({
    queryKey: ['players', playerId],
    queryFn: () => fetchPlayer(playerId),
    enabled: !!playerId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Player not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const stats = player.stats;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/players')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Players
        </Button>

        {/* Player Header */}
        <Card padding="lg" className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
                <div className="flex flex-col gap-1 mt-2 text-sm text-gray-600">
                  {player.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {player.email}
                    </span>
                  )}
                  {player.phoneNumber && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {player.phoneNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {stats && (
              <Badge variant="info" className="text-lg px-3 py-1">
                {stats.tournamentPoints} pts
              </Badge>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
              <p className="text-sm text-gray-600">Matches</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.matchesWon}</p>
              <p className="text-sm text-gray-600">Won</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.tournamentsPlayed}</p>
              <p className="text-sm text-gray-600">Tournaments</p>
            </Card>
            <Card padding="md" className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.tournamentsWon}</p>
              <p className="text-sm text-gray-600">Wins</p>
            </Card>
          </div>
        )}

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={`/dashboard/players/${playerId}/history`}>
            <Card padding="md" className="hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <History className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Tournament History</h3>
                  <p className="text-sm text-gray-600">View all tournament results</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href={`/dashboard/players/${playerId}/stats`}>
            <Card padding="md" className="hover:border-primary transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Statistics & Trends</h3>
                  <p className="text-sm text-gray-600">View performance charts</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
