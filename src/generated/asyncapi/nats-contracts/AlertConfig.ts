class AlertConfig {
  private _tenantId: string;
  private _gatewayId?: string;
  private _timeoutMs: number;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    tenantId: string;
    gatewayId?: string;
    timeoutMs: number;
    additionalProperties?: Map<string, any>;
  }) {
    this._tenantId = input.tenantId;
    this._gatewayId = input.gatewayId;
    this._timeoutMs = input.timeoutMs;
    this._additionalProperties = input.additionalProperties;
  }

  get tenantId(): string {
    return this._tenantId;
  }
  set tenantId(tenantId: string) {
    this._tenantId = tenantId;
  }

  get gatewayId(): string | undefined {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string | undefined) {
    this._gatewayId = gatewayId;
  }

  get timeoutMs(): number {
    return this._timeoutMs;
  }
  set timeoutMs(timeoutMs: number) {
    this._timeoutMs = timeoutMs;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default AlertConfig;
