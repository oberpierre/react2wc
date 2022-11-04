import { jest } from '@jest/globals';
import {
  HelloWorld,
  HelloWorldComp,
  HelloWorldProps,
  MountUnmount,
  MountUnmountComp,
  MountUnmountProps,
} from '@react2wc-test';
import { getByRole, waitFor } from '@testing-library/dom';
import { property } from 'lit/decorators.js';
import BaseElement from './base-element.js';

class HelloWorldWebcomponent extends BaseElement<HelloWorldComp> {
  @property({ type: String })
  name: string | undefined;

  getComponent(): Promise<HelloWorldComp> {
    return Promise.resolve(
      (HelloWorld as unknown as { default: HelloWorldComp }).default
    );
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
afterEach(() => {
  document
    .querySelectorAll('hello-world')
    .forEach((child) => document.body.removeChild(child));
  jest.restoreAllMocks();
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

  it('should throw error if dependencies cannot be loaded', async () => {
    jest
      .spyOn(HelloWorldWebcomponent.prototype, 'getComponent')
      .mockRejectedValue('404: Not Found');
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementationOnce(jest.fn);
    const test = new HelloWorldWebcomponent();
    test.setAttribute('name', 'Foo');

    document.body.appendChild(test);

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenLastCalledWith('404: Not Found');
  });
  it('should throw error if shadow root is not available in render', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementationOnce(jest.fn);
    const test = new HelloWorldWebcomponent();
    jest.spyOn(test, 'shadowRoot', 'get').mockReturnValue(null);

    document.body.appendChild(test);

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenLastCalledWith(
      new Error(
        'Unexpected error while rendering component. ShadowRoot unavailable.'
      )
    );
  });
  it('should throw error if component is undefined after loading', async () => {
    jest
      .spyOn(HelloWorldWebcomponent.prototype, 'getComponent')
      .mockResolvedValue(undefined as unknown as HelloWorldComp);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementationOnce(jest.fn);
    const test = new HelloWorldWebcomponent();
    test.setAttribute('name', 'Foo');

    document.body.appendChild(test);

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenLastCalledWith(
      new Error(
        "Unexpected error while rendering component. Dependencies couldn't be loaded."
      )
    );
  });
  it('should throw error if component is undefined after loading', async () => {
    jest
      .spyOn(HelloWorldWebcomponent.prototype, 'getComponent')
      .mockResolvedValue(undefined as unknown as HelloWorldComp);
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementationOnce(jest.fn);
    const test = new HelloWorldWebcomponent();
    test.setAttribute('name', 'Foo');

    document.body.appendChild(test);

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenLastCalledWith(
      new Error(
        "Unexpected error while rendering component. Dependencies couldn't be loaded."
      )
    );
  });
  it('should throw error if component is undefined upon rerendering', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementationOnce(jest.fn);
    const test = new HelloWorldWebcomponent();
    const _setAttribute = test.setAttribute.bind(test);
    test.setAttribute('name', 'Foo');
    jest
      .spyOn(test, 'setAttribute')
      // .mockImplementationOnce(_setAttribute)
      .mockImplementationOnce((name, value) => {
        (test as unknown as { component: unknown }).component = undefined;
        _setAttribute(name, value);
      })
      .mockImplementation(_setAttribute);

    document.body.appendChild(test);

    await waitFor(() =>
      expect(
        getByRole(asHtmlElement(test.shadowRoot), 'heading', {
          name: 'Hello Foo',
        })
      ).toBeInTheDocument()
    );

    test.setAttribute('name', 'Bar');

    await waitFor(() => expect(errorSpy).toHaveBeenCalledTimes(1));
    expect(errorSpy).toHaveBeenLastCalledWith(
      new Error('Unexpected error while rerendering component.')
    );
  });

  it('should call the mount and unmount lifecycle of the component', async () => {
    const _mount = jest.fn();
    const _unmount = jest.fn();
    class MountUnmountWc extends BaseElement<MountUnmountComp> {
      getComponent(): Promise<MountUnmountComp> {
        return Promise.resolve(
          (MountUnmount as unknown as { default: MountUnmountComp }).default
        );
      }

      getProperties(): MountUnmountProps {
        return {
          mount: _mount,
          unmount: _unmount,
        };
      }
    }

    customElements.define('mount-unmount', MountUnmountWc);

    const test = new MountUnmountWc();

    expect(_mount).not.toHaveBeenCalled();
    expect(_unmount).not.toHaveBeenCalled();

    document.body.appendChild(test);

    await waitFor(() =>
      expect(
        getByRole(asHtmlElement(test.shadowRoot), 'heading', {
          name: 'Mount Unmount',
        })
      ).toBeInTheDocument()
    );

    expect(_mount).toHaveBeenCalledTimes(1);
    expect(_unmount).not.toHaveBeenCalled();

    document.body.removeChild(test);

    expect(_mount).toHaveBeenCalledTimes(1);
    expect(_unmount).toHaveBeenCalledTimes(1);
  });
});
