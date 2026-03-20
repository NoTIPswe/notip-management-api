import { CommandPersistenceService } from './command.persistence.service';

describe('CommandPersistenceService', () => {
  it('can be instantiated', () => {
    expect(new CommandPersistenceService()).toBeInstanceOf(
      CommandPersistenceService,
    );
  });
});
