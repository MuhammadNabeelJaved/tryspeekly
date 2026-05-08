import { sanitizeInput } from '../../../src/middleware/sanitize';

describe('Sanitize Middleware', () => {
  it('should export sanitize middleware', () => {
    expect(sanitizeInput).toBeDefined();
    expect(typeof sanitizeInput).toBe('function');
  });

  it('should sanitize mongo operators', () => {
    const req: any = {
      body: { email: { $gt: '' } },
      params: {},
      query: {},
      method: 'POST',
      path: '/test',
    };
    const res: any = {};
    const next = jest.fn();

    sanitizeInput(req, res, next);

    expect(req.body.email).toEqual({ _gt: '' });
    expect(next).toHaveBeenCalled();
  });
});
