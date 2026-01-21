'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/types';
import { Modal, Button, Input } from '@/components/ui';

interface PlayerFormData {
  name: string;
  email: string;
  phoneNumber: string;
}

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlayerFormData) => void;
  player?: Player | null;
  isLoading?: boolean;
}

export function PlayerFormModal({
  isOpen,
  onClose,
  onSubmit,
  player,
  isLoading = false,
}: PlayerFormModalProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    email: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        email: player.email || '',
        phoneNumber: player.phoneNumber || '',
      });
    } else {
      setFormData({ name: '', email: '', phoneNumber: '' });
    }
  }, [player, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', phoneNumber: '' });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={player ? 'Edit Player' : 'Add Player'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter player name"
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email (optional)"
        />
        <Input
          label="Phone Number"
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          placeholder="Enter phone number (optional)"
        />
        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {player ? 'Save Changes' : 'Add Player'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
