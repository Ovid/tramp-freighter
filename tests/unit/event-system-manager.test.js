import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EVENT_NAMES } from '@game/constants.js';
import { createTestGame } from '../test-utils.js';

describe('EventSystemManager', () => {
  let gsm;
  let esm;

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = createTestGame();
    esm = gsm.eventSystemManager;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls subscriber with emitted data', () => {
    const callback = vi.fn();
    esm.subscribe('creditsChanged', callback);

    esm.emit('creditsChanged', 500);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(500);
  });

  it('calls multiple subscribers on the same event', () => {
    const callbackA = vi.fn();
    const callbackB = vi.fn();
    esm.subscribe('creditsChanged', callbackA);
    esm.subscribe('creditsChanged', callbackB);

    esm.emit('creditsChanged', 1000);

    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackA).toHaveBeenCalledWith(1000);
    expect(callbackB).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledWith(1000);
  });

  it('does not call unsubscribed callback on emit', () => {
    const callback = vi.fn();
    esm.subscribe('fuelChanged', callback);
    esm.unsubscribe('fuelChanged', callback);

    esm.emit('fuelChanged', 75);

    expect(callback).not.toHaveBeenCalled();
  });

  it('keeps original subscriber when unsubscribing a different function', () => {
    const original = vi.fn();
    const different = vi.fn();
    esm.subscribe('fuelChanged', original);

    esm.unsubscribe('fuelChanged', different);
    esm.emit('fuelChanged', 50);

    expect(original).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledWith(50);
  });

  it('warns on subscribe to unknown event type', () => {
    const callback = vi.fn();

    esm.subscribe('totallyBogusEvent', callback);

    expect(console.warn).toHaveBeenCalledWith(
      'Unknown event type: totallyBogusEvent'
    );
  });

  it('warns on emit to unknown event type without crashing', () => {
    esm.emit('nonExistentEvent', { foo: 'bar' });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('nonExistentEvent')
    );
  });

  it('still calls remaining subscribers when one throws', () => {
    const thrower = vi.fn(() => {
      throw new Error('subscriber blew up');
    });
    const survivor = vi.fn();
    esm.subscribe('cargoChanged', thrower);
    esm.subscribe('cargoChanged', survivor);

    esm.emit('cargoChanged', []);

    expect(thrower).toHaveBeenCalledTimes(1);
    expect(survivor).toHaveBeenCalledTimes(1);
    expect(survivor).toHaveBeenCalledWith([]);
  });

  it('logs error when a subscriber throws', () => {
    const error = new Error('kaboom');
    esm.subscribe('cargoChanged', () => {
      throw error;
    });

    esm.emit('cargoChanged', []);

    expect(console.error).toHaveBeenCalledWith(
      'Error in cargoChanged subscriber:',
      error
    );
  });

  it('getSubscribers returns keys matching all EVENT_NAMES values', () => {
    const subscribers = esm.getSubscribers();
    const eventValues = Object.values(EVENT_NAMES);

    expect(Object.keys(subscribers).sort()).toEqual([...eventValues].sort());
  });

  it('emits with no subscribers without crashing or logging errors', () => {
    esm.emit('karmaChanged', 42);

    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('silently handles unsubscribe from unknown event type', () => {
    const callback = vi.fn();

    esm.unsubscribe('madeUpEvent', callback);

    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
});
