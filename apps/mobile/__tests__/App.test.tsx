/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders the login flow when no saved authentication state exists', async () => {
  let screen: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(async () => {
    screen = ReactTestRenderer.create(<App />);
    await Promise.resolve();
  });

  expect(JSON.stringify(screen!.toJSON())).toContain('欢迎回来');
});
