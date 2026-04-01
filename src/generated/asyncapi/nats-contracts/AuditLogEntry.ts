class AuditLogEntry {
  private _userId: string;
  private _action: string;
  private _resource: string;
  private _details?: Map<string, any>;
  private _timestamp: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    userId: string;
    action: string;
    resource: string;
    details?: Map<string, any>;
    timestamp: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._userId = input.userId;
    this._action = input.action;
    this._resource = input.resource;
    this._details = input.details;
    this._timestamp = input.timestamp;
    this._additionalProperties = input.additionalProperties;
  }

  get userId(): string {
    return this._userId;
  }
  set userId(userId: string) {
    this._userId = userId;
  }

  get action(): string {
    return this._action;
  }
  set action(action: string) {
    this._action = action;
  }

  get resource(): string {
    return this._resource;
  }
  set resource(resource: string) {
    this._resource = resource;
  }

  get details(): Map<string, any> | undefined {
    return this._details;
  }
  set details(details: Map<string, any> | undefined) {
    this._details = details;
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
export default AuditLogEntry;
