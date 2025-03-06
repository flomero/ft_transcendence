import S from 'fluent-json-schema';

const bodySchema = S.object()
  .prop("matchId", S.string().required())


const joinLobbySchema = {
  body: bodySchema,
};

export default joinLobbySchema;
