import GatewayStatus from './GatewayStatus';
class GatewayStatusUpdateRequest {
  private _gatewayId: string;
  private _reservedStatus: GatewayStatus;
  private _lastSeenAt: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    gatewayId: string;
    reservedStatus: GatewayStatus;
    lastSeenAt: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._gatewayId = input.gatewayId;
    this._reservedStatus = input.reservedStatus;
    this._lastSeenAt = input.lastSeenAt;
    this._additionalProperties = input.additionalProperties;
  }

  get gatewayId(): string {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string) {
    this._gatewayId = gatewayId;
  }

  get reservedStatus(): GatewayStatus {
    return this._reservedStatus;
  }
  set reservedStatus(reservedStatus: GatewayStatus) {
    this._reservedStatus = reservedStatus;
  }

  get lastSeenAt(): string {
    return this._lastSeenAt;
  }
  set lastSeenAt(lastSeenAt: string) {
    this._lastSeenAt = lastSeenAt;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default GatewayStatusUpdateRequest;
