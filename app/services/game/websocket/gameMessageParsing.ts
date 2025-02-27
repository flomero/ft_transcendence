import matchMessageSchema from "../../../schemas/game/matchMessageSchema";
import ajv from "../../../plugins/ajv";
import { gameMessageInterface } from "../../../interfaces/game/gameMessageInterface";


function getCompiledSchemaValidator(): Record<string, (data: unknown) => boolean> {
	const compiledSchemaValidator: Record<string, (data: unknown) => boolean> = {};

	for (const schemaKey in matchMessageSchema) {
	  const schemaObject = matchMessageSchema[schemaKey];
	  const schemaMessageType = schemaObject.properties.messageType.enum[0];
	  compiledSchemaValidator[schemaMessageType] = ajv.compile(matchMessageSchema[schemaKey]);
	}
	return compiledSchemaValidator;
  }

  function messageCheck(message: gameMessageInterface, compiledSchemaValidator: Record<string, (data: unknown) => boolean> = {}): void {
	if (message.messageType === undefined)
	  throw new Error("Type messageType is missing");
	else if(compiledSchemaValidator[message.messageType] === undefined)
	  throw new Error("Type messageType is missing");
	else if (compiledSchemaValidator[message.messageType](message) === false)
	  throw new Error("Invalid format: " + compiledSchemaValidator.errors);
  }

  export { messageCheck, getCompiledSchemaValidator };