interface propertiesInterface {
  messageType: { type: 'string'; enum: string[] };
  [key: string]: unknown;
}

interface matchMessagSchemaInterface {
  [key: string]: {
    type: string;
    properties: propertiesInterface;
    required: string[];
    allOf?: Array<Record<string, unknown>>;
  };
}


const matchMessageSchema: matchMessagSchemaInterface = {
  createMatch: {
  type: 'object',
  properties: {
    messageType: { type: 'string', enum: ['createMatch'] },
    gameType: {
      type: 'string',
      enum: ['VanillaModded', 'MultiplayerModded', 'VanillaDouble', 'VanillaMultiplayer']
    }
  },
  required: ['messageType','gameType'],
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
    messageType: { type: 'string', enum: ['joinRandomMatch'] },
    gameType: {
      type: 'string',
      enum: ['VanillaModded', 'MultiplayerModded', 'VanillaDouble', 'VanillaMultiplayer']
    }
  },
  required: ['messageType','gameType'],
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

  joinMatchWithId: {
  type: 'object',
  properties: {
    messageType: { type: 'string', enum: ['joinMatchWithId'] },
    matchId: { type: 'string' }
    },
    required: ['messageType','matchId']
  },

  matchInput: {
  type: 'object',
  properties: {
    messageType: { type: 'string', enum: ['gameInput'] },
    matchId: { type: 'string' },
    input: { type: 'string' },
    timeStamp: { type: 'number' }
  },
  required: ['messageType','matchId','input','timeStamp']
  },
};


export default matchMessageSchema;
