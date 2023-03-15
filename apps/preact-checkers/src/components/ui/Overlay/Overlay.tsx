import { ComponentChildren } from 'preact';
import style from './Overlay.module.scss';

export interface OverlayProps {
  children: ComponentChildren;
  footerContent?: ComponentChildren;
}

function Overlay({ children, footerContent }: OverlayProps) {
  return (
    <div className={style.overlay}>
      <div className={style.overlayCard}>
        <div className={style.overlayCardContent}>{children}</div>
        {footerContent && (
          <div className={style.overlayCardFooter}>{footerContent}</div>
        )}
      </div>
    </div>
  );
}

export default Overlay;
