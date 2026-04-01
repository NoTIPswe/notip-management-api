class GatewayOfflineAlert {
  private _gatewayId: string;
  private _lastSeen: string;
  private _timeoutMs: number;
  private _timestamp: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    gatewayId: string;
    lastSeen: string;
    timeoutMs: number;
    timestamp: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._gatewayId = input.gatewayId;
    this._lastSeen = input.lastSeen;
    this._timeoutMs = input.timeoutMs;
    this._timestamp = input.timestamp;
    this._additionalProperties = input.additionalProperties;
  }

  get gatewayId(): string {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string) {
    this._gatewayId = gatewayId;
  }

  get lastSeen(): string {
    return this._lastSeen;
  }
  set lastSeen(lastSeen: string) {
    this._lastSeen = lastSeen;
  }

  get timeoutMs(): number {
    return this._timeoutMs;
  }
  set timeoutMs(timeoutMs: number) {
    this._timeoutMs = timeoutMs;
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
export default GatewayOfflineAlert;
