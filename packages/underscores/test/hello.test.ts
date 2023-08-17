import { my_namespace_with_underscores } from '../src';

test('hello', () => {
  expect(new my_namespace_with_underscores.Hello().sayHello()).toBe('hello, world!');
});