import React from 'react';
import { QrcodeCanvas, QrcodeSVG, type QrcodeProps } from 'react-qrcode-pretty';

/**
 * Component wrapper for QR code generation
 */
export default class Component<T extends 'canvas' | 'SVG'> extends React.Component<{
  payload: string;
  qrcodeType: T;
  settings: Omit<QrcodeProps<T>, 'value'>;
  onLoad?: (payload: string) => void;
}> {
  
  componentDidMount() {
    // Call onLoad when component mounts, but make it optional to avoid loops
    if (this.props.onLoad) {
      // Use setTimeout to avoid blocking the render cycle
      setTimeout(() => {
        this.props.onLoad?.(this.props.payload);
      }, 0);
    }
  }

  render() {
    const { payload, qrcodeType, settings } = this.props;
    
    const QRComponent = qrcodeType === 'canvas' ? QrcodeCanvas : QrcodeSVG;
    
    return React.createElement(QRComponent, {
      ...settings,
      value: payload,
    } as QrcodeProps<T>);
  }
}