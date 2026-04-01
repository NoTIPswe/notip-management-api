class ProvisioningCompleteRequest {
  private _gatewayId: string;
  private _keyMaterial: string;
  private _keyVersion: number;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    gatewayId: string;
    keyMaterial: string;
    keyVersion: number;
    additionalProperties?: Map<string, any>;
  }) {
    this._gatewayId = input.gatewayId;
    this._keyMaterial = input.keyMaterial;
    this._keyVersion = input.keyVersion;
    this._additionalProperties = input.additionalProperties;
  }

  get gatewayId(): string {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string) {
    this._gatewayId = gatewayId;
  }

  get keyMaterial(): string {
    return this._keyMaterial;
  }
  set keyMaterial(keyMaterial: string) {
    this._keyMaterial = keyMaterial;
  }

  get keyVersion(): number {
    return this._keyVersion;
  }
  set keyVersion(keyVersion: number) {
    this._keyVersion = keyVersion;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default ProvisioningCompleteRequest;
