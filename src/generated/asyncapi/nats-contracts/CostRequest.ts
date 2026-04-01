class CostRequest {
  private _tenantId: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    tenantId: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._tenantId = input.tenantId;
    this._additionalProperties = input.additionalProperties;
  }

  get tenantId(): string {
    return this._tenantId;
  }
  set tenantId(tenantId: string) {
    this._tenantId = tenantId;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default CostRequest;
