// part of dslink.common;

export class PassiveChannel  implements ConnectionChannel {
  final onReceiveController: StreamController<List> =
      new StreamController<List>();
  Stream<List> get onReceive => onReceiveController.stream;

  _processors: Function[] = [];

  final conn: Connection;

  PassiveChannel(this.conn, [this.connected = false]) {}

  handler: ConnectionHandler;
  sendWhenReady(handler: ConnectionHandler) {
    this.handler = handler;
    conn.requireSend();
  }

  ProcessorResult getSendingData(currentTime: int, waitingAckId: int){
    if (handler != null) {
      let rslt: ProcessorResult = handler.getSendingData(currentTime, waitingAckId);
      //handler = null;
      return rslt;
    }
    return null;
  }
  
  _isReady: boolean = false;
  get isReady(): boolean { return this._isReady;}
  set isReady(val: boolean) {
    _isReady = val;
  }

  connected: boolean = true;

  final onDisconnectController: Completer<ConnectionChannel> =
      new Completer<ConnectionChannel>();
  Future<ConnectionChannel> get onDisconnected => onDisconnectController.future;

  final onConnectController: Completer<ConnectionChannel> =
      new Completer<ConnectionChannel>();
  Future<ConnectionChannel> get onConnected => onConnectController.future;

  updateConnect() {
    if (connected) return;
    connected = true;
    onConnectController.complete(this);
  }
}