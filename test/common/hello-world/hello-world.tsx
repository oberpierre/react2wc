import React from 'react';

export type HelloWorldProps = {
  name: string;
};

const HelloWorld: React.FunctionComponent<HelloWorldProps> = ({ name }) => {
  return <h1>Hello {name}</h1>;
};

export type HelloWorldComp = typeof HelloWorld;

export default HelloWorld;
