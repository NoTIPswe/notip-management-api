import AnonymousSchema_33 from './AnonymousSchema_33';
class AnonymousSchema_32 {
  private _error: AnonymousSchema_33;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    error: AnonymousSchema_33;
    additionalProperties?: Map<string, any>;
  }) {
    this._error = input.error;
    this._additionalProperties = input.additionalProperties;
  }

  get error(): AnonymousSchema_33 {
    return this._error;
  }
  set error(error: AnonymousSchema_33) {
    this._error = error;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default AnonymousSchema_32;
