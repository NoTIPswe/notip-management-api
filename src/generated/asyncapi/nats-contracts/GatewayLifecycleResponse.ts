import GatewayLifecycleState from './GatewayLifecycleState';
class GatewayLifecycleResponse {
  private _gatewayId: string;
  private _state: GatewayLifecycleState;
  private _additionalProperties?: Map<string, any>;

  constructor(input: {
    gatewayId: string;
    state: GatewayLifecycleState;
    additionalProperties?: Map<string, any>;
  }) {
    this._gatewayId = input.gatewayId;
    this._state = input.state;
    this._additionalProperties = input.additionalProperties;
  }

  get gatewayId(): string {
    return this._gatewayId;
  }
  set gatewayId(gatewayId: string) {
    this._gatewayId = gatewayId;
  }

  get state(): GatewayLifecycleState {
    return this._state;
  }
  set state(state: GatewayLifecycleState) {
    this._state = state;
  }

  get additionalProperties(): Map<string, any> | undefined {
    return this._additionalProperties;
  }
  set additionalProperties(additionalProperties: Map<string, any> | undefined) {
    this._additionalProperties = additionalProperties;
  }
}
export default GatewayLifecycleResponse;
