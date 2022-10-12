import { html, LitElement, TemplateResult } from 'lit';
import {
  Attributes,
  ComponentProps,
  ComponentType,
  ReactElement,
  ReactNode,
} from 'react';
import { Root, RootOptions } from 'react-dom/client';

type ReactAbstraction = {
  createElement<P extends Record<string, unknown>>(
    type: ComponentType<P> | string,
    props?: (Attributes & P) | null,
    ...children: ReactNode[]
  ): ReactElement<P>;
};

type ReactDomAbstraction = {
  createRoot: (
    container: Element | DocumentFragment,
    options?: RootOptions
  ) => Root;
};

abstract class BaseElement<
  T extends ComponentType<P>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  P extends {} = ComponentProps<T>
> extends LitElement {
  protected root: Root | undefined;
  protected component: T | undefined;
  protected react: ReactAbstraction | undefined;
  protected reactDom: ReactDomAbstraction | undefined;

  constructor() {
    super();
  }

  render(): TemplateResult {
    if (!this.root) {
      // Importing component and react dependencies upon first render, this way we can split the bundle into chunks, making the chunk
      // registering the custom elements small. Therefore having little impact on the page load if no custom element is used on certain pages.
      // When the custom elements are actually mounted, the chunks containing the dependencies are requested.
      Promise.all([
        this.getComponent(),
        import('react'),
        import('react-dom/client'),
      ])
        .then(([component, react, reactDom]) => {
          this.component = component;
          this.react = react;
          this.reactDom = reactDom;
        })
        .then(() => {
          if (!this.shadowRoot) {
            throw new Error(
              'Unexpected error while rendering component. ShadowRoot unavailable.'
            );
          } else if (!this.component || !this.react || !this.reactDom) {
            throw new Error(
              "Unexpected error while rendering component. Dependencies couldn't be loaded."
            );
          }
          this.root = this.reactDom.createRoot(this.shadowRoot);
          this.root.render(
            this.react.createElement(this.component, this.getProperties(), [])
          );
        })
        .catch(console.error);
    } else {
      // rerender
      if (!this.react || !this.component) {
        console.error(
          new Error('Unexpected error while rerendering component.')
        );
      } else {
        this.root.render(
          this.react.createElement(this.component, this.getProperties(), [])
        );
      }
    }

    return html``;
  }

  abstract getComponent(): Promise<T>;

  abstract getProperties(): P;
}

export default BaseElement;
