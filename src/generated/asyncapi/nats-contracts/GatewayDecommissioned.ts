class GatewayDecommissioned {
  private _gatewayId: string;
  private _timestamp: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    gatewayId: string;
    timestamp: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._gatewayId = input.gatewayId;
    this._timestamp = input.timestamp;
    this._additionalProperties = input.additionalProperties;
  }

  get gatewayId(): string {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string) {
    this._gatewayId = gatewayId;
  }

  get timestamp(): string {
    return this._timestamp;
  }
  set timestamp(timestamp: string) {
    this._timestamp = timestamp;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default GatewayDecommissioned;
