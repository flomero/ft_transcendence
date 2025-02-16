import S from 'fluent-json-schema';

const bodySchema = S.object()
  .prop('x-friendId', S.string())

const friendRequestSchema = {
  body: bodySchema
};

export default friendRequestSchema;