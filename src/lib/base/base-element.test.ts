import { getByRole, waitFor } from '@testing-library/dom';
import { property } from 'lit/decorators.js';
import * as React from 'react';
import BaseElement from './base-element';

type HelloWorldProps = {
  name: string;
};

const HelloWorld: React.FunctionComponent<HelloWorldProps> = ({ name }) => {
  return React.createElement('h1', null, [`Hello ${name}`]);
};

type HelloWorldComp = typeof HelloWorld;

class HelloWorldWebcomponent extends BaseElement<HelloWorldComp> {
  @property({ type: String })
  name: string | undefined;

  getComponent(): Promise<React.FunctionComponent<HelloWorldProps>> {
    return Promise.resolve(HelloWorld);
  }

  getProperties(): HelloWorldProps {
    return {
      name: this.name ?? '',
    };
  }
}

const asHtmlElement: (shadowRoot: ShadowRoot | null) => HTMLElement = (
  root
) => {
  return root as unknown as HTMLElement;
};

beforeAll(() => {
  customElements.define('hello-world', HelloWorldWebcomponent);
});
beforeEach(() => {
  document
    .querySelectorAll('hello-world')
    .forEach((child) => document.body.removeChild(child));
  jest.clearAllMocks();
});

describe('BaseElement', () => {
  it('should render Hello World', async () => {
    const test = new HelloWorldWebcomponent();
    test.setAttribute('name', 'World');

    document.body.appendChild(test);

    await waitFor(() =>
      expect(
        getByRole(asHtmlElement(test.shadowRoot), 'heading', {
          name: 'Hello World',
        })
      ).toBeInTheDocument()
    );
  });
  it('should reactively rerender component when attribute changes', async () => {
    const test = new HelloWorldWebcomponent();
    test.setAttribute('name', 'Foo');

    document.body.appendChild(test);

    await waitFor(() =>
      expect(
        getByRole(asHtmlElement(test.shadowRoot), 'heading', {
          name: 'Hello Foo',
        })
      ).toBeInTheDocument()
    );

    test.setAttribute('name', 'Bar');

    await waitFor(() =>
      expect(
        getByRole(asHtmlElement(test.shadowRoot), 'heading', {
          name: 'Hello Bar',
        })
      ).toBeInTheDocument()
    );
  });
});
