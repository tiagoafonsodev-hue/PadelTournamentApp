'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/api-client';
import { TournamentCategory } from '@/types';

interface TiebreakerSettings {
  primary: string;
  secondary: string;
  tertiary: string;
}

type PointConfigurations = Record<TournamentCategory, Record<number, number>>;

const TIEBREAKER_OPTIONS = [
  { value: 'points', label: 'Points (2 per win)' },
  { value: 'wins', label: 'Number of wins' },
  { value: 'goalDiff', label: 'Goal difference (games won - games lost)' },
  { value: 'gamesWon', label: 'Total games won' },
  { value: 'gamesLost', label: 'Total games lost (fewer is better)' },
  { value: 'headToHead', label: 'Head-to-head result' },
];

const CATEGORY_LABELS: Record<TournamentCategory, string> = {
  [TournamentCategory.OPEN_250]: 'Open 250',
  [TournamentCategory.OPEN_500]: 'Open 500',
  [TournamentCategory.OPEN_1000]: 'Open 1000',
  [TournamentCategory.MASTERS]: 'Masters',
};

const POSITION_LABELS: Record<number, string> = {
  1: '1st Place',
  2: '2nd Place',
  3: '3rd Place',
  4: '4th Place',
  5: '5th Place',
  6: '6th Place',
  7: '7th Place',
  8: '8th Place',
  9: '9th Place',
  10: '10th Place',
  11: '11th Place',
  12: '12th Place',
};

// Number of positions per category (based on team count)
const POSITIONS_PER_CATEGORY: Record<TournamentCategory, number[]> = {
  [TournamentCategory.OPEN_250]: [1, 2, 3, 4],           // 8 players = 4 teams
  [TournamentCategory.OPEN_500]: [1, 2, 3, 4, 5, 6],     // 12 players = 6 teams
  [TournamentCategory.OPEN_1000]: [1, 2, 3, 4, 5, 6, 7, 8], // 16 players = 8 teams
  [TournamentCategory.MASTERS]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 24 players = 12 teams
};

export default function SettingsPage() {
  const [tiebreakers, setTiebreakers] = useState<TiebreakerSettings>({
    primary: 'points',
    secondary: 'goalDiff',
    tertiary: 'gamesWon',
  });
  const [pointConfigs, setPointConfigs] = useState<PointConfigurations | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory>(TournamentCategory.OPEN_250);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'tiebreakers' | 'points' | 'data'>('points');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    // Load tiebreaker settings from localStorage
    const savedTiebreakers = localStorage.getItem('tiebreakerSettings');
    if (savedTiebreakers) {
      setTiebreakers(JSON.parse(savedTiebreakers));
    }

    // Load point configurations from API
    loadPointConfigurations();
  }, []);

  const loadPointConfigurations = async () => {
    try {
      const response = await apiClient.get('/api/settings/points');
      setPointConfigs(response.data);
    } catch (error) {
      console.error('Failed to load point configurations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTiebreakers = () => {
    localStorage.setItem('tiebreakerSettings', JSON.stringify(tiebreakers));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSavePoints = async () => {
    if (!pointConfigs) return;

    setSaving(true);
    try {
      await apiClient.post('/api/settings/points', {
        category: selectedCategory,
        points: pointConfigs[selectedCategory],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save point configuration', error);
    } finally {
      setSaving(false);
    }
  };

  const updatePointValue = (position: number, value: number) => {
    if (!pointConfigs) return;

    setPointConfigs({
      ...pointConfigs,
      [selectedCategory]: {
        ...pointConfigs[selectedCategory],
        [position]: value,
      },
    });
  };

  const handleResetTiebreakers = () => {
    const defaultTiebreakers = {
      primary: 'points',
      secondary: 'goalDiff',
      tertiary: 'gamesWon',
    };
    setTiebreakers(defaultTiebreakers);
    localStorage.setItem('tiebreakerSettings', JSON.stringify(defaultTiebreakers));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const getAvailableOptions = (level: 'primary' | 'secondary' | 'tertiary') => {
    const selected = [tiebreakers.primary, tiebreakers.secondary, tiebreakers.tertiary];
    return TIEBREAKER_OPTIONS.filter(
      (opt) => opt.value === tiebreakers[level] || !selected.includes(opt.value)
    );
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure tournament points and ranking rules
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('points')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'points'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tournament Points
          </button>
          <button
            onClick={() => setActiveTab('tiebreakers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tiebreakers'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tiebreaker Rules
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'data'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Data Management
          </button>
        </nav>
      </div>

      {/* Tournament Points Tab */}
      {activeTab === 'points' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-6xl">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Tournament Point Configuration
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure how many ranking points are awarded for each finishing position in tournaments.
            These points determine player rankings on the leaderboard.
          </p>

          {/* Category Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(TournamentCategory).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Points Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : pointConfigs ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {POSITIONS_PER_CATEGORY[selectedCategory].map((position) => (
                  <div key={position} className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {POSITION_LABELS[position]}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pointConfigs[selectedCategory][position] || 0}
                      onChange={(e) => updatePointValue(position, parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary text-center"
                    />
                    <span className="absolute right-2 top-7 text-xs text-gray-400">pts</span>
                  </div>
                ))}
              </div>

              {/* Quick multiplier info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{CATEGORY_LABELS[selectedCategory]}</span> tournaments award
                  <span className="font-medium text-primary"> {pointConfigs[selectedCategory][1]} points</span> for 1st place.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePoints}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Points Configuration'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Failed to load configuration</div>
          )}

          {saved && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">Settings saved successfully!</p>
            </div>
          )}

          {/* Info section */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">How Tournament Points Work</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>When a tournament finishes, players receive points based on their final position</li>
              <li>Higher category tournaments (Grand Slam) award more points than lower ones (Open 250)</li>
              <li>The leaderboard ranks players by total tournament points accumulated</li>
              <li>Both players in a winning team receive the same points</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tiebreaker Rules Tab */}
      {activeTab === 'tiebreakers' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-4xl">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Tiebreaker Rules for Round Robin Tournaments
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            When teams have the same number of points, these rules determine the ranking order.
          </p>

          <div className="space-y-6">
            {/* Primary Tiebreaker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1st Tiebreaker (Primary)
              </label>
              <select
                value={tiebreakers.primary}
                onChange={(e) => setTiebreakers({ ...tiebreakers, primary: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                {getAvailableOptions('primary').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Tiebreaker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                2nd Tiebreaker (Secondary)
              </label>
              <select
                value={tiebreakers.secondary}
                onChange={(e) => setTiebreakers({ ...tiebreakers, secondary: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                {getAvailableOptions('secondary').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tertiary Tiebreaker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                3rd Tiebreaker (Tertiary)
              </label>
              <select
                value={tiebreakers.tertiary}
                onChange={(e) => setTiebreakers({ ...tiebreakers, tertiary: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary"
              >
                {getAvailableOptions('tertiary').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex gap-3">
            <button
              onClick={handleSaveTiebreakers}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
            >
              Save Settings
            </button>
            <button
              onClick={handleResetTiebreakers}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Reset to Default
            </button>
          </div>

          {saved && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">Settings saved successfully!</p>
            </div>
          )}

          {/* Info section */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">How Tiebreakers Work</h3>
            <p className="text-sm text-blue-800 mb-2">
              When two or more teams have the same ranking after the primary criterion,
              the system will use the secondary criterion to break the tie. If still tied,
              it will use the tertiary criterion.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> These settings apply to Round Robin and Group Stage
              tournaments. Knockout tournaments use match results to determine final positions.
            </p>
          </div>
        </div>
      )}

      {/* Data Management Tab */}
      {activeTab === 'data' && (
        <div className="bg-white shadow rounded-lg p-6 max-w-4xl">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Data Management
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Reset leaderboard rankings and player statistics. These actions cannot be undone.
          </p>

          <div className="space-y-6">
            {/* Reset Leaderboard */}
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Reset Leaderboard</h3>
              <p className="text-sm text-yellow-800 mb-4">
                This will clear all tournament results and reset tournament points to zero for all players.
                Player match statistics (wins, losses, games) will be preserved.
              </p>
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to reset the leaderboard? This cannot be undone.')) return;
                  setResetting(true);
                  try {
                    await apiClient.post('/api/players/reset-leaderboard');
                    alert('Leaderboard reset successfully!');
                  } catch (error) {
                    alert('Failed to reset leaderboard');
                  } finally {
                    setResetting(false);
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-200 rounded-md hover:bg-yellow-300 disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset Leaderboard'}
              </button>
            </div>

            {/* Reset Player Stats */}
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h3 className="text-sm font-medium text-red-900 mb-2">Reset All Player Stats</h3>
              <p className="text-sm text-red-800 mb-4">
                This will reset ALL player statistics to zero, including matches played, wins, losses,
                sets, games, and tournament points. All tournament results will also be deleted.
              </p>
              <button
                onClick={async () => {
                  if (!confirm('Are you sure you want to reset ALL player stats? This will clear everything and cannot be undone.')) return;
                  setResetting(true);
                  try {
                    await apiClient.post('/api/players/reset-stats');
                    alert('Player stats reset successfully!');
                  } catch (error) {
                    alert('Failed to reset player stats');
                  } finally {
                    setResetting(false);
                  }
                }}
                disabled={resetting}
                className="px-4 py-2 text-sm font-medium text-red-900 bg-red-200 rounded-md hover:bg-red-300 disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Reset All Player Stats'}
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Warning</h3>
            <p className="text-sm text-gray-700">
              These operations are irreversible. Make sure you have a backup of your data before proceeding.
              Tournament data (matches, scores) is not affected by these resets.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
