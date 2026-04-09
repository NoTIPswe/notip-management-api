class FactoryValidateRequest {
  private _factoryId: string;
  private _factoryKey: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    factoryId: string;
    factoryKey: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._factoryId = input.factoryId;
    this._factoryKey = input.factoryKey;
    this._additionalProperties = input.additionalProperties;
  }

  get factoryId(): string {
    return this._factoryId;
  }
  set factoryId(factoryId: string) {
    this._factoryId = factoryId;
  }

  get factoryKey(): string {
    return this._factoryKey;
  }
  set factoryKey(factoryKey: string) {
    this._factoryKey = factoryKey;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default FactoryValidateRequest;
