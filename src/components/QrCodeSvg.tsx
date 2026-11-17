import React, { useMemo } from 'react';
import { generateQrMatrix } from '../utils/qrCodeGenerator';

interface QrCodeSvgProps {
  value: string;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}

export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  className = 'w-20 h-20',
  fgColor = '#0f172a',
  bgColor = '#ffffff',
}) => {
  const matrix = useMemo(() => generateQrMatrix(value), [value]);
  const size = matrix.length;

  return (
    <svg
      viewBox={`-2 -2 ${size + 4} ${size + 4}`}
      className={className}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR Code ${value}`}
    >
      <rect x={-2} y={-2} width={size + 4} height={size + 4} fill={bgColor} />
      {matrix.map((row, r) =>
        row.map((col, c) =>
          col ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill={fgColor} /> : null
        )
      )}
    </svg>
  );
};
