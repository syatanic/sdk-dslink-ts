import {Listener, Stream} from "../utils/async";
import {Node} from "../common/node";
import {Permission} from "../common/permission";
import {InvokeResponse} from "./response/invoke";
import {Responder} from "./responder";
import {Response} from "./response";
import {ValueUpdate, ValueUpdateCallback} from "../common/value";

export class LocalNode extends Node {
  /// Node Provider
  provider: NodeProvider;

  /// Node Path
  readonly path: string;

  _state: NodeState;

  constructor(path: string, provider: NodeProvider, profileName: string = 'node') {
    super(profileName);
    this.path = path;
    this.provider = provider;
    this.initialize();
  }

  initialize() {

  }

  addChild(name: string, node: LocalNode) {
    if (node.provider !== this.provider) {
      // TODO log warning
      return;
    }
    if (this.children.has(name)) {
      this.children.get(name).destroy();
    }
    this.children.set(name, node);
    if (this._state) {
      node._connectState();
    }
  }

  _connectState() {
    this.provider.createState(this.path).setNode(this);
    for (let [name, child] of this.children) {
      (child as LocalNode)._connectState();
    }
  }

  getInvokePermission(): number {
    return Permission.parse(this.configs.get('$invokable'));
  }

  getSetPermission() {
    return Permission.parse(this.configs.get('$writable'));
  }


  /// Called by the link internals to invoke this node.
  invoke(
    params: {[key: string]: any},
    responder: Responder,
    response: InvokeResponse,
    parentNode: LocalNode, maxPermission: number = Permission.CONFIG) {
    response.close();
  }


  setConfig(name: string, value: any) {
    if (!name.startsWith("$")) {
      name = `\$${name}`;
    }

    this.configs.set(name, value);
    this.provider.save();
  }

  /// Called by the link internals to set an attribute on this node.
  setAttribute(
    name: string, value: any, responder: Responder, response: Response) {
    if (!name.startsWith("@")) {
      name = `@${name}`;
    }

    this.attributes.set(name, value);
    this.provider.save();
    if (response != null) {
      response.close();
    }
  }

/// Called by the link internals to remove an attribute from this node.
  removeAttribute(
    name: string, responder: Responder, response: Response) {
    if (!name.startsWith("@")) {
      name = `@${name}`;
    }

    this.attributes.delete(name);
    this.provider.save();
    if (response != null) {
      response.close();
    }
  }

  _value: any = null;
  _valueReady = true;

  /// Called by the link internals to set a value of a node.
  setValue(value: any, responder: Responder, response: Response,
           maxPermission: number = Permission.CONFIG) {
    this._value = value;
    response.close();
  }

  save(): {[key: string]: any} {
    return null;
  }

  destroy() {
    if (this._state) {
      this._state.setNode(null);
      for (let [name, child] of this.children) {
        child.destroy();
      }
      this._state = null;
    }
  }
}

interface ProviderOptions {
  saveFunction?: (data: any) => void;
  saveIntervalMs?: number;
}

export class NodeProvider {
  _states: Map<string, NodeState> = new Map<string, NodeState>();

  getNode(path: string): LocalNode {
    if (this._states.has(path)) {
      return this._states.get(path)._node;
    }
    return null;
  }

  createState(path: string): NodeState {
    if (this._states.has(path)) {
      return this._states.get(path);
    }
    let state = new NodeState(path, this);
    this._states.set(path, state);
    return state;
  }

  _root: LocalNode;
  _saveFunction: (data: any) => void;

  constructor(options?: ProviderOptions) {
    if (options) {
      let {saveFunction, saveIntervalMs} = options;
      this._saveFunction = saveFunction;
      if (saveIntervalMs) {
        this._saveIntervalMs = saveIntervalMs;
      }
    }
  }

  setRoot(node: LocalNode) {
    if (!this._root) {
      this._root = node;
      node._connectState();
    }
  }

  _saveTimer: any = null;
  _saveIntervalMs = 5000;

  save() {
    // save root node with a timer
    if (this._saveFunction && !this._saveTimer) {
      this._saveTimer = setTimeout(this.onSaveTimer, this._saveIntervalMs);
    }
  }

  onSaveTimer = () => {
    this._saveTimer = null;
    if (this._saveFunction) {
      let data = this._root.save();
      if (data) {
        this._saveFunction(data);
      }
    }
  }
}

interface Subscriber {
  addValue: ValueUpdateCallback;
}

export class NodeState {

  _node: LocalNode;
  _subscriber: Subscriber;
  readonly provider: NodeProvider;
  readonly path: string;

  constructor(path: string, provider: NodeProvider) {
    this.path = path;
    this.provider = provider;
  }

  onList = (listener: Listener<string>) => {
    if (this._node) {
      // TODO
    }
  };

  listStream = new Stream<string>(
    null,
    () => this.checkDestroy(), // onAllCancel
    this.onList // onListen
  );

  initListUpdate() {
    for (let listener of this.listStream._listeners) {
      listener(null); // use null to update all
    }
  }

  _lastValueUpdate: ValueUpdate;

  /// Gets the last value update of this node.
  get lastValueUpdate(): ValueUpdate {
    if (!this._lastValueUpdate && this._node && this._node._valueReady) {
      this._lastValueUpdate = new ValueUpdate(this._node._value);
    }
    return this._lastValueUpdate;
  }

  setNode(node: LocalNode) {
    this._node = node;
    if (node) {
      node._state = this;
      if (this._subscriber && node._valueReady) {
        this._subscriber.addValue(this.lastValueUpdate);
      }
      for (let listener of this.listStream._listeners) {
        listener(null); // use null to update all
      }
    } else {
      this._lastValueUpdate = null;
      this.checkDestroy();
    }
  }

  setSubscriber(s: Subscriber) {
    this._subscriber = s;
    if (!s) {
      this.checkDestroy();
    }
  }

  checkDestroy() {
    if (!(this._node || this.listStream.hasListener() || this._subscriber)) {
      this.destroy();
    }
  }

  destroy() {
    this.provider._states.delete(this.path);
  }
}