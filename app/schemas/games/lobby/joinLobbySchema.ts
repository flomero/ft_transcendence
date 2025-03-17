import S from "fluent-json-schema";

const params = S.object().prop(
  "lobbyId",
  S.string().maxLength(36).minLength(36).required(),
);

const joinLobbySchema = {
  params: params,
};

export default joinLobbySchema;
