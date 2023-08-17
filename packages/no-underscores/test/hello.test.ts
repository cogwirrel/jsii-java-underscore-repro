import { mynamespacewithnounderscores } from '../src';

test('hello', () => {
  expect(new mynamespacewithnounderscores.Hello().sayHello()).toBe('hello, world!');
});