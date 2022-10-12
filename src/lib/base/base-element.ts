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
  protected component: Promise<T>;
  protected react: Promise<ReactAbstraction>;
  protected reactDom: Promise<ReactDomAbstraction>;

  constructor() {
    super();
    this.component = this.getComponent();
    this.react = import('react');
    this.reactDom = import('react-dom/client');
  }

  render(): TemplateResult {
    Promise.all([this.component, this.react, this.reactDom])
      .then(([component, react, reactDom]) => {
        if (!this.shadowRoot) {
          throw new Error("Couldn't render component. ShadowRoot unavailable.");
        }
        const root = reactDom.createRoot(this.shadowRoot);
        root.render(react.createElement(component, null, []));
      })
      .catch(console.error);
    return html``;
  }

  abstract getComponent(): Promise<T>;
}

export default BaseElement;
