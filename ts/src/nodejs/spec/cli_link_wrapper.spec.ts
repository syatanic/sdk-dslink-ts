import {MockBroker} from '../../../test/utils/mock-broker';
import {Logger, logger} from '../../utils/logger';
import {TestRootNode} from '../../../test/utils/responder-nodes';
import {HttpClientLink} from '../client-link';
import {Requester} from '../../requester/requester';
import {Path} from '../../common/node';
import {ValueUpdate} from '../../common/value';
import {shouldHappen} from '../../../test/utils/async-test';
import {sleep} from '../../utils/async';
import {assert} from 'chai';
import {DSLink} from '../cli-link-wrapper';

describe('cli link wrapper', function() {
  let broker = new MockBroker();
  logger.setLevel(Logger.WARN);
  // logger.setLevel(Logger.TRACE);

  after(() => {
    broker.destroy();
  });

  it('parse cli args', async function() {
    let port = await broker.onListen;
    let link = new DSLink(
      '',
      {isRequester: true},
      ['-b', `http://127.0.0.1:${port}/conn`, '-l', 'error', '-n', 'requester'] // overwrite command line options
    );
    assert.equal(logger._level, Logger.ERROR);

    await link.connect();

    link.close();
  });
});
