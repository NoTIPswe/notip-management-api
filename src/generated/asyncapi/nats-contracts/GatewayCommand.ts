import AnonymousSchema_3 from './AnonymousSchema_3';
class GatewayCommand {
  private _commandId: string;
  private _reservedType: AnonymousSchema_3;
  private _issuedAt: string;
  private _payload?: Map<string, any>;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    commandId: string;
    reservedType: AnonymousSchema_3;
    issuedAt: string;
    payload?: Map<string, any>;
    additionalProperties?: Map<string, any>;
  }) {
    this._commandId = input.commandId;
    this._reservedType = input.reservedType;
    this._issuedAt = input.issuedAt;
    this._payload = input.payload;
    this._additionalProperties = input.additionalProperties;
  }

  get commandId(): string {
    return this._commandId;
  }
  set commandId(commandId: string) {
    this._commandId = commandId;
  }

  get reservedType(): AnonymousSchema_3 {
    return this._reservedType;
  }
  set reservedType(reservedType: AnonymousSchema_3) {
    this._reservedType = reservedType;
  }

  get issuedAt(): string {
    return this._issuedAt;
  }
  set issuedAt(issuedAt: string) {
    this._issuedAt = issuedAt;
  }

  get payload(): Map<string, any> | undefined {
    return this._payload;
  }
  set payload(payload: Map<string, any> | undefined) {
    this._payload = payload;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default GatewayCommand;
