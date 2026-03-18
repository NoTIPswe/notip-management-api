import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('App', () => {
  it('AppService returns the hello message', () => {
    const service = new AppService();

    expect(service.getHello()).toBe('Hello World!');
  });

  it('AppController delegates to AppService', () => {
    const getHelloMock = jest.fn().mockReturnValue('Hello World!');
    const appService = {
      getHello: getHelloMock,
    } as unknown as AppService;
    const controller = new AppController(appService);

    expect(controller.getHello()).toBe('Hello World!');
    expect(getHelloMock).toHaveBeenCalledTimes(1);
  });
});
