import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Padel Tournament API',
      version: '1.0.0',
      description: 'API for managing padel tournaments, players, and matches',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Player: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            phoneNumber: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            stats: { $ref: '#/components/schemas/PlayerStats' },
          },
        },
        PlayerStats: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            playerId: { type: 'string', format: 'uuid' },
            totalMatches: { type: 'integer' },
            matchesWon: { type: 'integer' },
            matchesLost: { type: 'integer' },
            matchesDrawn: { type: 'integer' },
            setsWon: { type: 'integer' },
            setsLost: { type: 'integer' },
            gamesWon: { type: 'integer' },
            gamesLost: { type: 'integer' },
            tournamentsPlayed: { type: 'integer' },
            tournamentsWon: { type: 'integer' },
            tournamentPoints: { type: 'number' },
            winPercentage: { type: 'number' },
          },
        },
        Tournament: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            name: { type: 'string', nullable: true },
            date: { type: 'string', format: 'date-time' },
            type: { type: 'string', enum: ['ROUND_ROBIN', 'KNOCKOUT', 'GROUP_STAGE_KNOCKOUT'] },
            category: { type: 'string', enum: ['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS'] },
            status: { type: 'string', enum: ['CREATED', 'IN_PROGRESS', 'PHASE_1_COMPLETE', 'PHASE_2_COMPLETE', 'FINISHED'] },
            currentPhase: { type: 'integer' },
            maxPhases: { type: 'integer' },
            allowTies: { type: 'boolean' },
            fieldCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Match: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            tournamentId: { type: 'string', format: 'uuid' },
            phase: { type: 'integer' },
            roundNumber: { type: 'integer' },
            matchNumber: { type: 'integer' },
            fieldNumber: { type: 'integer', nullable: true },
            matchDay: { type: 'integer', nullable: true },
            player1Id: { type: 'string', format: 'uuid' },
            player2Id: { type: 'string', format: 'uuid' },
            player3Id: { type: 'string', format: 'uuid' },
            player4Id: { type: 'string', format: 'uuid' },
            team1Score: { type: 'integer', nullable: true },
            team2Score: { type: 'integer', nullable: true },
            set1Team1: { type: 'integer', nullable: true },
            set1Team2: { type: 'integer', nullable: true },
            winnerTeam: { type: 'integer', nullable: true },
            status: { type: 'string', enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
            groupNumber: { type: 'integer', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string', enum: ['ADMIN', 'PLAYER'] },
                playerId: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
