import { Response } from 'express';
import * as XLSX from 'xlsx';
import { AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

interface PlayerRow {
  name?: string;
  Name?: string;
  email?: string;
  Email?: string;
  phoneNumber?: string;
  PhoneNumber?: string;
  phone?: string;
  Phone?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  players: Array<{ id: string; name: string }>;
}

/**
 * Admin only: Import players from Excel/CSV file
 * Protected by adminMiddleware in routes
 */
export const importPlayers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: PlayerRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'File is empty or has no valid data' });
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
      players: [],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and header is row 1

      // Get name (try different column name variations)
      const name = row.name || row.Name;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        result.failed++;
        result.errors.push(`Row ${rowNumber}: Name is required`);
        continue;
      }

      // Get email (optional)
      const email = row.email || row.Email || '';
      if (email && typeof email === 'string' && email.trim().length > 0) {
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          result.failed++;
          result.errors.push(`Row ${rowNumber}: Invalid email format "${email}"`);
          continue;
        }
      }

      // Get phone number (optional)
      const phoneNumber = row.phoneNumber || row.PhoneNumber || row.phone || row.Phone || '';

      try {
        // Create player
        const player = await prisma.player.create({
          data: {
            name: name.trim(),
            email: email && typeof email === 'string' ? email.trim() || null : null,
            phoneNumber: phoneNumber && typeof phoneNumber === 'string' ? phoneNumber.trim() || null : null,
          },
        });

        // Create initial stats
        await prisma.playerStats.create({
          data: { playerId: player.id },
        });

        result.success++;
        result.players.push({ id: player.id, name: player.name });
      } catch (error: any) {
        result.failed++;
        if (error.code === 'P2002') {
          result.errors.push(`Row ${rowNumber}: Player "${name}" already exists or email is duplicated`);
        } else {
          result.errors.push(`Row ${rowNumber}: Failed to create player "${name}"`);
        }
      }
    }

    res.json({
      message: `Import completed: ${result.success} players created, ${result.failed} failed`,
      ...result,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    if (error.message?.includes('File is empty')) {
      return res.status(400).json({ error: 'File is empty or corrupted' });
    }
    res.status(500).json({ error: 'Failed to process file' });
  }
};

/**
 * Get Excel template for player import
 */
export const getPlayerTemplate = async (req: AuthRequest, res: Response) => {
  try {
    // Create workbook with sample data
    const workbook = XLSX.utils.book_new();

    const templateData = [
      { Name: 'John Doe', Email: 'john@example.com', PhoneNumber: '+1234567890' },
      { Name: 'Jane Smith', Email: 'jane@example.com', PhoneNumber: '+0987654321' },
      { Name: 'Player Without Contact', Email: '', PhoneNumber: '' },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Name
      { wch: 30 }, // Email
      { wch: 20 }, // PhoneNumber
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=players_template.xlsx');
    res.send(buffer);
  } catch (error) {
    console.error('Template generation error:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
};
