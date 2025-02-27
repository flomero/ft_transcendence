import Ajv from 'ajv';

const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true
});

export default ajv;