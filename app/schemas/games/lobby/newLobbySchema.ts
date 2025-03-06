import S from 'fluent-json-schema';

const bodySchema = S.object()
  .prop("gameName", S.string().required())
  .prop("gameModeName", S.string().required())
  .prop("modifierNames", S.array().items(S.string()).required())
  .prop("powerUpNames", S.array().items(S.string()).required());


const newLobbySchema = {
  body: bodySchema,
};

export default newLobbySchema;
