import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: Record<string, jest.Mock>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
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

  it('handles HttpException with string response', () => {
    const error = new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    filter.catch(error, mockArgumentsHost);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Forbidden',
    });
  });

  it('handles HttpException with object message', () => {
    const error = new HttpException(
      { message: 'Validation Failed' },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(error, mockArgumentsHost);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation Failed',
    });
  });

  it('handles HttpException with array message', () => {
    const error = new HttpException(
      { message: ['error 1', 'error 2'] },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(error, mockArgumentsHost);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'error 1; error 2',
    });
  });

  it('handles generic error as 500', () => {
    const error = new Error('Random error');
    filter.catch(error, mockArgumentsHost);
    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  });
});
