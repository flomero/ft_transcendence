import S from 'fluent-json-schema';

const bodySchema = S.object()
  .prop("matchId", S.string().required())


const startLobbySchema = {
  body: bodySchema,
};

export default startLobbySchema;
