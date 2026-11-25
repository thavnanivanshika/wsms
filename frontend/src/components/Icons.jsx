// Feather-style SVG icon components, 24×24 viewBox, stroke-based
function Ico({ paths, size = 16, style, className }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
      className={className}
    >
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export const IcoHome       = p => <Ico {...p} paths={['m3 9 9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', 'M9 22V12h6v10']} />;
export const IcoPackage    = p => <Ico {...p} paths={['M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', 'M3.27 6.96 12 12.01 20.73 6.96', 'M12 22.08V12']} />;
export const IcoCreditCard = p => <Ico {...p} paths={['M2 5h20v14H2z', 'M2 9h20']} />;
export const IcoFilePlus   = p => <Ico {...p} paths={['M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z', 'M14 2v6h6', 'M12 18v-6', 'M9 15h6']} />;
export const IcoList       = p => <Ico {...p} paths={['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01']} />;
export const IcoCheckCircle = p => <Ico {...p} paths={['M22 11.08V12a10 10 0 11-5.93-9.14', 'M22 4 12 14.01l-3-3']} />;
export const IcoBarChart   = p => <Ico {...p} paths={['M18 20V10', 'M12 20V4', 'M6 20v-6']} />;
export const IcoHelp       = p => <Ico {...p} paths={['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3', 'M12 17h.01']} />;
export const IcoLock       = p => <Ico {...p} paths={['M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z', 'M17 11V7a5 5 0 00-10 0v4']} />;
export const IcoLogOut     = p => <Ico {...p} paths={['M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4', 'M16 17l5-5-5-5', 'M21 12H9']} />;
export const IcoArrowRight = p => <Ico {...p} paths={['M5 12h14', 'M12 5l7 7-7 7']} />;
export const IcoUser       = p => <Ico {...p} paths={['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8']} />;
export const IcoShield     = p => <Ico {...p} paths={['M12 2 3 7v7c0 5.25 3.75 10.15 9 11.25C17.25 21.15 21 16.25 21 14V7z']} />;
export const IcoTrendingUp = p => <Ico {...p} paths={['M23 6l-9.5 9.5-5-5L1 18', 'M17 6h6v6']} />;
export const IcoAlertCircle = p => <Ico {...p} paths={['M12 2a10 10 0 100 20A10 10 0 0012 2z', 'M12 8v4', 'M12 16h.01']} />;
export const IcoStar       = p => <Ico {...p} paths={['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z']} />;
export const IcoSettings   = p => <Ico {...p} paths={['M12 15a3 3 0 100-6 3 3 0 000 6z', 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z']} />;
