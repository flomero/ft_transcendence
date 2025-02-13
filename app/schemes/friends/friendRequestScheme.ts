import FastifySchema from 'fluent-json-schema';
const bodySchema = FastifySchema.object()
  .prop('X-friendId', FastifySchema.string().required())

const friendRequestSchema: FastifySchema = {
	body: bodySchema
}