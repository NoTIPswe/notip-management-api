import { ThresholdsPersistenceService } from './thresholds.persistence.service';

describe('ThresholdsPersistenceService', () => {
  it('can be instantiated', () => {
    expect(new ThresholdsPersistenceService()).toBeInstanceOf(
      ThresholdsPersistenceService,
    );
  });
});
