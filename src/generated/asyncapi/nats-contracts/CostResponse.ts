class CostResponse {
  private _dataSizeAtRest: number;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    dataSizeAtRest: number;
    additionalProperties?: Map<string, any>;
  }) {
    this._dataSizeAtRest = input.dataSizeAtRest;
    this._additionalProperties = input.additionalProperties;
  }

  get dataSizeAtRest(): number {
    return this._dataSizeAtRest;
  }
  set dataSizeAtRest(dataSizeAtRest: number) {
    this._dataSizeAtRest = dataSizeAtRest;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default CostResponse;
