import classNames from 'classnames';
import { ComponentChildren } from 'preact';

import style from './Button.module.scss';

export type ButtonProps = {
  selected?: boolean;
  type?: 'ghost' | 'secondary';
  size?: 'small' | 'medium';
  variant?: 'warning' | 'error';
  children?: ComponentChildren;
  onClick?: () => void;
};

const Button = ({
  children,
  selected,
  type,
  variant,
  size,
  onClick,
}: ButtonProps) => {
  return (
    <button
      className={classNames(style.button, {
        [style.buttonGhost]: type === 'ghost',
        [style.buttonSecondary]: type === 'secondary',
        [style.buttonSmall]: size === 'small',
        [style.buttonWarning]: variant === 'warning',
        [style.buttonSelected]: selected,
      })}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
