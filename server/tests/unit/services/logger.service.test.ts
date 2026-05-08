import logger from '../../../src/services/logger.service';

describe('Logger Service', () => {
  it('should export a logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should log info messages without error', () => {
    expect(() => logger.info('Test info message')).not.toThrow();
  });

  it('should log error messages without error', () => {
    expect(() => logger.error('Test error message')).not.toThrow();
  });

  it('should log object messages', () => {
    expect(() => logger.info({ message: 'Test', data: { key: 'value' } })).not.toThrow();
  });
});
