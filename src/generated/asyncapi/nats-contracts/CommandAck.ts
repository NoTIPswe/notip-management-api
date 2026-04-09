import AnonymousSchema_8 from './AnonymousSchema_8';
class CommandAck {
  private _commandId: string;
  private _reservedStatus: AnonymousSchema_8;
  private _message?: string;
  private _timestamp: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    commandId: string;
    reservedStatus: AnonymousSchema_8;
    message?: string;
    timestamp: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._commandId = input.commandId;
    this._reservedStatus = input.reservedStatus;
    this._message = input.message;
    this._timestamp = input.timestamp;
    this._additionalProperties = input.additionalProperties;
  }

  get commandId(): string {
    return this._commandId;
  }
  set commandId(commandId: string) {
    this._commandId = commandId;
  }

  get reservedStatus(): AnonymousSchema_8 {
    return this._reservedStatus;
  }
  set reservedStatus(reservedStatus: AnonymousSchema_8) {
    this._reservedStatus = reservedStatus;
  }

  get message(): string | undefined {
    return this._message;
  }
  set message(message: string | undefined) {
    this._message = message;
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
export default CommandAck;
