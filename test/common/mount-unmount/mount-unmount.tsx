import React, { useEffect } from 'react';

export type MountUnmountProps = {
  mount?: () => void;
  unmount?: () => void;
};

const MountUnmount: React.FunctionComponent<MountUnmountProps> = ({
  mount,
  unmount,
}) => {
  useEffect(() => {
    mount?.();
    return () => unmount?.();
  });
  return <h1>Mount Unmount</h1>;
};

export type MountUnmountComp = typeof MountUnmount;

export default MountUnmount;
