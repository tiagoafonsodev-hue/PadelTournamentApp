'use client';

import { useState, useEffect } from 'react';
import { Users, BarChart3, Settings, Database, Trophy, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { TournamentCategory, UserRole, type UserWithDetails, type AdminStats } from '@/types';
import { useAdminStats } from '@/hooks/queries/useAdminStats';
import { useUsers } from '@/hooks/queries/useUsers';
import { usePlayers } from '@/hooks/queries/usePlayers';
import { useCreateUser } from '@/hooks/mutations/useCreateUser';
import { useUpdateUser } from '@/hooks/mutations/useUpdateUser';
import { useDeleteUser } from '@/hooks/mutations/useDeleteUser';

// ─── Constants ───────────────────────────────────────────────────────────────

interface TiebreakerSettings {
  primary: string;
  secondary: string;
  tertiary: string;
  pointsPerWin: number;
  pointsPerDraw: number;
  seasonYear: number;
}

type PointConfigurations = Record<TournamentCategory, Record<number, number>>;

type Tab = 'overview' | 'points' | 'rules' | 'users' | 'data';

const TIEBREAKER_OPTIONS = [
  { value: 'setDiff', label: 'Set difference (sets won - sets lost)' },
  { value: 'gameDiff', label: 'Game difference (games won - games lost)' },
  { value: 'setsWon', label: 'Total sets won' },
  { value: 'gamesWon', label: 'Total games won' },
  { value: 'headToHead', label: 'Head-to-head result' },
  { value: 'gamesLost', label: 'Total games lost (fewer is better)' },
];

const CATEGORY_LABELS: Record<TournamentCategory, string> = {
  [TournamentCategory.OPEN_250]: 'Open 250',
  [TournamentCategory.OPEN_500]: 'Open 500',
  [TournamentCategory.OPEN_1000]: 'Open 1000',
  [TournamentCategory.MASTERS]: 'Masters',
};

const POSITION_LABELS: Record<number, string> = {
  1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th',
  7: '7th', 8: '8th', 9: '9th', 10: '10th', 11: '11th', 12: '12th',
};

const POSITIONS_PER_CATEGORY: Record<TournamentCategory, number[]> = {
  [TournamentCategory.OPEN_250]: [1, 2, 3, 4],
  [TournamentCategory.OPEN_500]: [1, 2, 3, 4, 5, 6],
  [TournamentCategory.OPEN_1000]: [1, 2, 3, 4, 5, 6, 7, 8],
  [TournamentCategory.MASTERS]: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  CREATED: { label: 'Scheduled', color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  PHASE_1_COMPLETE: { label: 'Phase 1 Done', color: 'bg-yellow-100 text-yellow-700' },
  PHASE_2_COMPLETE: { label: 'Phase 2 Done', color: 'bg-orange-100 text-orange-700' },
  FINISHED: { label: 'Finished', color: 'bg-green-100 text-green-700' },
};

const CURRENT_YEAR = new Date().getFullYear();
const SEASON_YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading, isError } = useAdminStats();

  if (isLoading) return <div className="py-8 text-center text-gray-500">Loading stats...</div>;
  if (isError || !stats) return <div className="py-8 text-center text-red-500">Failed to load stats.</div>;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Players" value={stats.totalPlayers} color="blue" />
        <StatCard label="In Progress" value={stats.tournaments.inProgress} color="yellow" />
        <StatCard label="Finished" value={stats.tournaments.finished} color="green" />
        <StatCard label="Matches Played" value={stats.totalMatchesPlayed} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tournaments */}
        <div className="bg-white shadow rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Tournaments</h3>
          {stats.recentTournaments.length === 0 ? (
            <p className="text-sm text-gray-400">No tournaments yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentTournaments.map((t) => {
                const s = STATUS_LABELS[t.status] ?? { label: t.status, color: 'bg-gray-100 text-gray-700' };
                const name = t.name || `${CATEGORY_LABELS[t.category] ?? t.category} – ${new Date(t.date).toLocaleDateString('pt-PT')}`;
                return (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-PT')}</p>
                    </div>
                    <span className={`ml-3 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top 3 Players */}
        <div className="bg-white shadow rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Players</h3>
          {stats.topPlayers.length === 0 ? (
            <p className="text-sm text-gray-400">No player data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{medals[i] ?? `#${p.rank}`}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{p.name}</p>
                  </div>
                  <span className="font-semibold text-primary text-sm">{p.points.toFixed(1)} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-lg p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

// ─── Rules Tab ────────────────────────────────────────────────────────────────

function RulesTab() {
  const [tiebreakers, setTiebreakers] = useState<TiebreakerSettings>({
    primary: 'setDiff',
    secondary: 'gameDiff',
    tertiary: 'gamesWon',
    pointsPerWin: 2,
    pointsPerDraw: 1,
    seasonYear: CURRENT_YEAR,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get('/api/settings/tiebreakers').then(({ data }) => {
      setTiebreakers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getAvailableOptions = (level: 'primary' | 'secondary' | 'tertiary') => {
    const selected = [tiebreakers.primary, tiebreakers.secondary, tiebreakers.tertiary];
    return TIEBREAKER_OPTIONS.filter(opt => opt.value === tiebreakers[level] || !selected.includes(opt.value));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/settings/tiebreakers', tiebreakers);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const defaults: TiebreakerSettings = {
      primary: 'setDiff', secondary: 'gameDiff', tertiary: 'gamesWon',
      pointsPerWin: 2, pointsPerDraw: 1, seasonYear: CURRENT_YEAR,
    };
    setTiebreakers(defaults);
    setSaving(true);
    try {
      await apiClient.post('/api/settings/tiebreakers', defaults);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-3xl space-y-8">

      {/* Season Year */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="text-sm font-semibold text-indigo-900 mb-1">Season Year</h3>
        <p className="text-xs text-indigo-700 mb-3">
          Used for group seeding — determines which year's tournament results are used to rank teams when creating a new GROUP_STAGE_KNOCKOUT tournament.
        </p>
        <select
          value={tiebreakers.seasonYear}
          onChange={(e) => setTiebreakers({ ...tiebreakers, seasonYear: parseInt(e.target.value) })}
          className="px-3 py-2 border border-indigo-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          {SEASON_YEAR_OPTIONS.map(y => (
            <option key={y} value={y}>{y}{y === CURRENT_YEAR ? ' (current)' : ''}</option>
          ))}
        </select>
      </div>

      {/* Match Points */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Match Points</h3>
        <p className="text-xs text-gray-500 mb-4">Points awarded per match outcome in round-robin stages.</p>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Points per Win</label>
            <input
              type="number" min="1" max="10"
              value={tiebreakers.pointsPerWin}
              onChange={(e) => setTiebreakers({ ...tiebreakers, pointsPerWin: parseInt(e.target.value) || 2 })}
              className="w-full px-3 py-2 border rounded-md text-center text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Points per Draw</label>
            <input
              type="number" min="0" max="10"
              value={tiebreakers.pointsPerDraw}
              onChange={(e) => setTiebreakers({ ...tiebreakers, pointsPerDraw: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-md text-center text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tiebreaker Rules */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Tiebreaker Rules</h3>
        <p className="text-xs text-gray-500 mb-4">Applied in order when teams have equal match points.</p>
        <div className="space-y-4">
          {(['primary', 'secondary', 'tertiary'] as const).map((level, i) => (
            <div key={level}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {i + 1}. {level.charAt(0).toUpperCase() + level.slice(1)} Tiebreaker
              </label>
              <select
                value={tiebreakers[level]}
                onChange={(e) => setTiebreakers({ ...tiebreakers, [level]: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-primary focus:border-primary"
              >
                {getAvailableOptions(level).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave} disabled={saving}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Rules'}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset to Default
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          Settings saved successfully!
        </div>
      )}
    </div>
  );
}

// ─── Tournament Points Tab ────────────────────────────────────────────────────

function PointsTab() {
  const [pointConfigs, setPointConfigs] = useState<PointConfigurations | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TournamentCategory>(TournamentCategory.OPEN_250);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get('/api/settings/points').then(({ data }) => {
      setPointConfigs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const updatePointValue = (position: number, value: number) => {
    if (!pointConfigs) return;
    setPointConfigs({ ...pointConfigs, [selectedCategory]: { ...pointConfigs[selectedCategory], [position]: value } });
  };

  const handleSave = async () => {
    if (!pointConfigs) return;
    setSaving(true);
    try {
      await apiClient.post('/api/settings/points', { category: selectedCategory, points: pointConfigs[selectedCategory] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl">
      <h2 className="text-lg font-medium text-gray-900 mb-1">Tournament Point Configuration</h2>
      <p className="text-sm text-gray-500 mb-6">
        Ranking points awarded per finishing position. These accumulate on the leaderboard.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.values(TournamentCategory).map((cat) => (
          <button key={cat} onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading...</div>
      ) : pointConfigs ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {POSITIONS_PER_CATEGORY[selectedCategory].map((pos) => (
              <div key={pos} className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1">{POSITION_LABELS[pos]} Place</label>
                <input
                  type="number" min="0"
                  value={pointConfigs[selectedCategory][pos] || 0}
                  onChange={(e) => updatePointValue(pos, parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-md text-center text-sm pr-8"
                />
                <span className="absolute right-2 top-7 text-xs text-gray-400">pts</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Points'}
            </button>
          </div>
          {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">Saved!</div>}
        </div>
      ) : (
        <div className="py-8 text-center text-red-400">Failed to load configuration</div>
      )}
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  playerId: string;
}

function UsersTab() {
  const { data: users, isLoading } = useUsers();
  const { data: playersData } = usePlayers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ name: '', email: '', password: '', role: UserRole.PLAYER, playerId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>(UserRole.PLAYER);
  const [editPlayerId, setEditPlayerId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUserId(JSON.parse(raw)?.id ?? null);
    } catch { /* ignore */ }
  }, []);

  const players = playersData ?? [];

  const handleCreate = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Name, email and password are required.'); return; }
    try {
      await createUser.mutateAsync({ ...form, playerId: form.playerId || undefined });
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: UserRole.PLAYER, playerId: '' });
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err?.response?.data?.error ?? 'Failed to create user');
    }
  };

  const startEdit = (u: UserWithDetails) => {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditPlayerId(u.playerId ?? '');
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateUser.mutateAsync({ id, role: editRole, playerId: editPlayerId || null });
      setEditingId(null);
    } catch { /* show nothing, row stays editable */ }
  };

  const handleDelete = async (u: UserWithDetails) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    await deleteUser.mutateAsync(u.id);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">User Accounts</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage who can access this system and their roles.</p>
        </div>
        <button onClick={() => { setShowCreate(!showCreate); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark">
          <Plus className="w-4 h-4" />
          New User
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm" placeholder="João Silva" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm" placeholder="joao@example.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm" placeholder="Min. 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 border rounded-md text-sm">
                <option value={UserRole.PLAYER}>Player</option>
                <option value={UserRole.ADMIN}>Admin</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Link to Player (optional)</label>
              <select value={form.playerId} onChange={(e) => setForm({ ...form, playerId: e.target.value })}
                className="w-full px-3 py-2 border rounded-md text-sm">
                <option value="">— None —</option>
                {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={createUser.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md disabled:opacity-50">
              {createUser.isPending ? 'Creating...' : 'Create User'}
            </button>
            <button onClick={() => { setShowCreate(false); setError(''); }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="py-8 text-center text-gray-400">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Linked Player</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(users ?? []).map((u) => {
                const isSelf = u.id === currentUserId;
                const isEditing = editingId === u.id;
                return (
                  <tr key={u.id} className={isSelf ? 'bg-blue-50' : ''}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-blue-500">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="px-2 py-1 border rounded text-xs" disabled={isSelf}>
                          <option value={UserRole.PLAYER}>Player</option>
                          <option value={UserRole.ADMIN}>Admin</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {isEditing ? (
                        <select value={editPlayerId} onChange={(e) => setEditPlayerId(e.target.value)}
                          className="px-2 py-1 border rounded text-xs">
                          <option value="">— None —</option>
                          {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      ) : (
                        u.player?.name ?? <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleUpdate(u.id)} title="Save"
                              className="p-1.5 rounded text-green-600 hover:bg-green-50">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingId(null)} title="Cancel"
                              className="p-1.5 rounded text-gray-500 hover:bg-gray-100">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(u)} title="Edit"
                              className="p-1.5 rounded text-gray-500 hover:bg-gray-100">
                              <Pencil className="w-4 h-4" />
                            </button>
                            {!isSelf && (
                              <button onClick={() => handleDelete(u)} title="Delete"
                                className="p-1.5 rounded text-red-500 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Data Tab ─────────────────────────────────────────────────────────────────

function DataTab() {
  const [resetting, setResetting] = useState(false);

  const doReset = async (url: string, confirmMsg: string, successMsg: string) => {
    if (!confirm(confirmMsg)) return;
    setResetting(true);
    try {
      await apiClient.post(url);
      alert(successMsg);
    } catch {
      alert('Operation failed. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">Data Management</h2>
        <p className="text-sm text-gray-500 mt-1">Irreversible operations. Make sure you have a backup before proceeding.</p>
      </div>

      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
        <h3 className="text-sm font-semibold text-yellow-900 mb-1">Reset Leaderboard</h3>
        <p className="text-sm text-yellow-800 mb-4">
          Clears all tournament results and resets tournament points to zero. Match statistics (wins, losses, games) are preserved.
        </p>
        <button disabled={resetting}
          onClick={() => doReset('/api/players/reset-leaderboard', 'Reset the leaderboard? This cannot be undone.', 'Leaderboard reset successfully!')}
          className="px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-200 rounded-md hover:bg-yellow-300 disabled:opacity-50">
          {resetting ? 'Resetting...' : 'Reset Leaderboard'}
        </button>
      </div>

      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <h3 className="text-sm font-semibold text-red-900 mb-1">Reset All Player Stats</h3>
        <p className="text-sm text-red-800 mb-4">
          Resets ALL statistics to zero — matches, wins, losses, sets, games, tournament points, and results.
        </p>
        <button disabled={resetting}
          onClick={() => doReset('/api/players/reset-stats', 'Reset ALL player stats? This clears everything and cannot be undone.', 'Stats reset successfully!')}
          className="px-4 py-2 text-sm font-medium text-red-900 bg-red-200 rounded-md hover:bg-red-300 disabled:opacity-50">
          {resetting ? 'Resetting...' : 'Reset All Stats'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'points', label: 'Points', icon: Trophy },
  { id: 'rules', label: 'Rules', icon: Settings },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'data', label: 'Data', icon: Database },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage the app, users, and tournament configuration.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-1 sm:space-x-6 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 py-3 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'points' && <PointsTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'data' && <DataTab />}
    </div>
  );
}
