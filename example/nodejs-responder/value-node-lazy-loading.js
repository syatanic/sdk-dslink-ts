// const { DSLink, RootNode, ValueNode, Permission} = require("dslink");
const {DSLink, RootNode, ValueNode, Permission} = require("../../js/node");

class LazyLoadValue extends ValueNode {
  constructor(path, provider) {
    super(path,          // pass path to base class
      provider,          // pass provider to base class
      'string',         // value type
    );
    // do not set value here
  }

  onSubscribe(subscriber) {
    if (subscriber) {
      // load the value only when there is a subscriber
      setTimeout(() => {
        // requester wont receive any update until the value is loaded
        let loadedValue = 'ready'; // value loaded from file / database / remote device
        this.setValue(loadedValue);
      }, 10);
    }
  }
}


async function main() {
  let rootNode = new RootNode();
  rootNode.createChild('lazy', LazyLoadValue);
  let link = new DSLink('responder', {rootNode});
  await link.connect();
}

main();
