import { MockJetStreamClient } from './mock-jetstream.client';
import { JetStreamMessage } from './jetstream.client';

describe('MockJetStreamClient', () => {
  it('returns a canned request payload', async () => {
    const client = new MockJetStreamClient();

    const result = await client.request('subject', Buffer.from('data'));

    expect(JSON.parse(result.toString())).toEqual({
      dataSizeAtRest: 1024 * 1024 * 1024,
    });
  });

  it('delivers emitted payloads to the subscribed handler', async () => {
    const client = new MockJetStreamClient();
    const ack = jest.fn();
    const handler = jest
      .fn()
      .mockImplementation(async (message: JetStreamMessage) => {
        await message.ack();
      });

    await client.subscribe('subject', async (message: JetStreamMessage) => {
      message.ack = ack;
      await handler(message);
    });

    await client.emit({ commandId: 'cmd-1', status: 'acknowledged' });

    expect(handler).toHaveBeenCalled();
    expect(ack).toHaveBeenCalled();
  });

  it('ignores emitted payloads before a subscription exists', async () => {
    const client = new MockJetStreamClient();

    await expect(
      client.emit({ commandId: 'cmd-1', status: 'queued' }),
    ).resolves.toBeUndefined();
  });
});
