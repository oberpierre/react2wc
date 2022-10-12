import { getByRole, waitFor } from '@testing-library/dom';
import * as React from 'react';
import BaseElement from './base-element';

const HelloWorld: React.FunctionComponent = () => {
  return React.createElement('h1', null, ['Hello World']);
};

type HelloWorldComp = typeof HelloWorld;

class HelloWorldWebcomponent extends BaseElement<HelloWorldComp> {
  getComponent(): Promise<React.FunctionComponent> {
    return Promise.resolve(HelloWorld);
  }
}

const asHtmlElement: (shadowRoot: ShadowRoot | null) => HTMLElement = (
  root
) => {
  return root as unknown as HTMLElement;
};

describe('BaseElement', () => {
  it('should render Hello World', async () => {
    customElements.define('hello-world', HelloWorldWebcomponent);

    const test = new HelloWorldWebcomponent();

    document.body.appendChild(test);

    await waitFor(() =>
      expect(
        getByRole(asHtmlElement(test.shadowRoot), 'heading', {
          name: 'Hello World',
        })
      ).toBeInTheDocument()
    );
  });
});
