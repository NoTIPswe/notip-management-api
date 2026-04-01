class GatewayLifecycleRequest {
  private _gatewayId: string;
  private _tenantId: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    gatewayId: string;
    tenantId: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._gatewayId = input.gatewayId;
    this._tenantId = input.tenantId;
    this._additionalProperties = input.additionalProperties;
  }

  get gatewayId(): string {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string) {
    this._gatewayId = gatewayId;
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
export default GatewayLifecycleRequest;
