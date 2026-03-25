import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { DatabaseExceptionFilter } from './database-exception.filter';

describe('DatabaseExceptionFilter', () => {
  let filter: DatabaseExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: Record<string, jest.Mock>;

  beforeEach(() => {
    filter = new DatabaseExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('handles unique violation error (23505)', () => {
    const error = new QueryFailedError('query', [], new Error('detail'));
    (error as unknown as Record<string, string>).code = '23505';
    (error as unknown as Record<string, string>).detail =
      'Key (email)=(test@example.com) already exists.';

    filter.catch(error, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Field email with value test@example.com already exists',
      }) as unknown,
    );
  });

  it('handles foreign key violation error (23503)', () => {
    const error = new QueryFailedError('query', [], new Error('detail'));
    (error as unknown as Record<string, string>).code = '23503';

    filter.catch(error, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Related resource not found',
      }) as unknown,
    );
  });

  it('handles generic database error as 500', () => {
    const error = new QueryFailedError('query', [], new Error('detail'));
    (error as unknown as Record<string, string>).code = '99999';

    filter.catch(error, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  });
});
