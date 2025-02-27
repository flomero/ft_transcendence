interface Schema {
  [key: string]: {
    type: string;

    properties: Record<string, unknown>;

    required: string[];

    allOf?: Array<Record<string, unknown>>;
  };
}

const gameWebsocketMessageSchema = {
  createMatch: {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['createMatch'] },
    gameType: {
      type: 'string',
      enum: ['VanillaModded', 'MultiplayerModded', 'VanillaDouble', 'VanillaMultiplayer']
    }
  },
  required: ['type','gameType'],
  allOf: [
    {
      if: {
        properties: {
          gameType: {
            enum: ['VanillaModded', 'MultiplayerModded']
          }
        }
      },
      then: {
        properties: {
          modifiers: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['blackwhole', 'speedUpBall']
            }
          }
        },
        required: ['modifiers']
      }
    }
  ]
  },

  joinRandomMatch: {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['joinRandomMatch'] },
    gameType: {
      type: 'string',
      enum: ['VanillaModded', 'MultiplayerModded', 'VanillaDouble', 'VanillaMultiplayer']
    }
  },
  required: ['type','gameType'],
  },
  allOf: [
    {
      if: {
        properties: {
          gameType: {
            enum: ['VanillaModded', 'MultiplayerModded']
          }
        }
      },
      then: {
        properties: {
          modifiers: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['blackwhole', 'speedUpBall']
            }
          }
        },
        required: ['modifiers']
      }
    }
  ]
};

export default gameWebsocketMessageSchema;
