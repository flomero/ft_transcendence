import S from "fluent-json-schema";

const params = S.object().prop(
  "lobbyId",
  S.string().minLength(36).maxLength(36).required(),
);

const startLobbySchema = {
  params: params,
};

export default startLobbySchema;
