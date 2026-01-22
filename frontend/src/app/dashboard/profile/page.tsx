'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Trophy, BarChart3 } from 'lucide-react';
import { Player, UserRole } from '@/types';
import { useToast } from '@/providers';
import { Button, Spinner, Card } from '@/components/ui';
import apiClient from '@/lib/api-client';

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const loadPlayer = useCallback(async (id: string) => {
    try {
      const response = await apiClient.get(`/players/${id}`);
      setPlayer(response.data);
      setEmail(response.data.email || '');
      setPhoneNumber(response.data.phoneNumber || '');
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || null);
    setPlayerId(user.playerId || null);

    // Redirect admins to players page
    if (user.role === UserRole.ADMIN) {
      router.push('/dashboard/players');
      return;
    }

    // Load player data if playerId exists
    if (user.playerId) {
      loadPlayer(user.playerId);
    } else {
      setIsLoading(false);
    }
  }, [router, loadPlayer]);

  const handleSave = async () => {
    if (!playerId) return;

    setIsSaving(true);
    try {
      const response = await apiClient.put(`/players/${playerId}`, {
        email,
        phoneNumber,
      });
      setPlayer(response.data);
      showToast('Profile updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!playerId) {
    return (
      <div className="px-4 sm:px-0">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Player Profile</h3>
          <p className="mt-1 text-sm text-gray-500">
            Your account is not linked to a player profile yet.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Please contact an administrator to link your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and update your player information
        </p>
      </div>

      {player && (
        <>
          {/* Player Info Card */}
          <Card className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{player.name}</h2>
                <p className="text-sm text-gray-500">Player since {new Date(player.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Contact Information</h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Stats Card */}
          {player.stats && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Matches</p>
                  <p className="text-2xl font-bold text-gray-900">{player.stats.totalMatches}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Win Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{player.stats.winPercentage.toFixed(1)}%</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Record (W-L)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <span className="text-green-600">{player.stats.matchesWon}</span>
                    {' - '}
                    <span className="text-red-600">{player.stats.matchesLost}</span>
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Tournament Points</p>
                  <p className="text-2xl font-bold text-primary">{player.stats.tournamentPoints}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Tournaments Played</p>
                  <p className="text-2xl font-bold text-gray-900">{player.stats.tournamentsPlayed}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Tournaments Won</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    <Trophy className="h-5 w-5 inline mr-1" />
                    {player.stats.tournamentsWon}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                  <p className="text-sm text-gray-500">Games (Won - Lost)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    <span className="text-green-600">{player.stats.gamesWon}</span>
                    {' - '}
                    <span className="text-red-600">{player.stats.gamesLost}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      ({player.stats.gamesWon - player.stats.gamesLost > 0 ? '+' : ''}{player.stats.gamesWon - player.stats.gamesLost})
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
