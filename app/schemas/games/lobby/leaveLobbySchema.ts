import S from 'fluent-json-schema';

const bodySchema = S.object()
  .prop("matchId", S.string().required())


const leaveLobbySchema = {
  body: bodySchema,
};

export default leaveLobbySchema;
