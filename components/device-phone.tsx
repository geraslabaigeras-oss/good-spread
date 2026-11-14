import 'devices.css/dist/devices.min.css';

/** Realistic iPhone 14 Pro frame from devices.css (MIT), scaled to `width`. Children render on the screen. */
export function DevicePhone({ width = 300, children, className }: { width?: number; children: React.ReactNode; className?: string }) {
  const s = width / 428;
  return (
    <div className={className} style={{ width, height: 868 * s }}>
      <div style={{ transform: `scale(${s})`, transformOrigin: 'top left', width: 428, height: 868 }}>
        <div className="device device-iphone-14-pro">
          <div className="device-frame"><div className="device-screen overflow-hidden"><div className="screen-content h-full w-full">{children}</div></div></div>
          <div className="device-stripe" />
          <div className="device-header" />
          <div className="device-sensors" />
          <div className="device-btns" />
          <div className="device-power" />
          <div className="device-home" />
        </div>
      </div>
    </div>
  );
}
