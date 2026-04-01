class ProvisioningCompleteResponse {
  private _success: boolean;
  private _error?: string;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    success: boolean;
    error?: string;
    additionalProperties?: Map<string, any>;
  }) {
    this._success = input.success;
    this._error = input.error;
    this._additionalProperties = input.additionalProperties;
  }

  get success(): boolean {
    return this._success;
  }
  set success(success: boolean) {
    this._success = success;
  }

  get error(): string | undefined {
    return this._error;
  }
  set error(error: string | undefined) {
    this._error = error;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default ProvisioningCompleteResponse;
