import S from "fluent-json-schema";

const params = S.object()
  .prop("lobbyId", S.string().minLength(36).maxLength(36).required())
  .prop("state", S.string().enum(["true", "false"]).required());

const lockLobbySchema = {
  params: params,
};

export default lockLobbySchema;
