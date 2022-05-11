import { generateJavascript } from '../src';

describe('index', () => {
  describe('myPackage', () => {
    it('should return a string containing the message', () => {
      const message = 'Hello';

      const result = generateJavascript(message as any);

      expect(result).toMatch(message);
    });
  });
});
