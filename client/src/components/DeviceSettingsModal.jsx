import React from 'react';
import { X, Camera, Mic, RefreshCw, PowerOff, Check, ShieldAlert } from 'lucide-react';

export default function DeviceSettingsModal({
  isOpen,
  onClose,
  audioDevices,
  videoDevices,
  selectedAudioId,
  selectedVideoId,
  facingMode,
  isHardwareRevoked,
  onSwitchCamera,
  onSwitchMic,
  onRevokePermissions,
  onReacquirePermissions,
  mode
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg max-w-sm w-full p-4 sm:p-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#334155] mb-4">
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Audio &amp; Video Devices
          </span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isHardwareRevoked ? (
          <div className="text-center py-3 space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-950/70 border border-red-800 mx-auto flex items-center justify-center text-red-400">
              <PowerOff className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-mono font-semibold text-white">Hardware Released</h4>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Camera and microphone streams are completely stopped and powered off at the operating system level.
            </p>
            <button
              onClick={onReacquirePermissions}
              className="w-full py-2 rounded bg-white hover:bg-slate-200 text-slate-900 font-mono font-semibold text-xs transition-colors"
            >
              Re-Enable Camera &amp; Mic
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Camera Controls (If in video mode) */}
            {mode === 'video' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-400" />
                    <span>Camera Device</span>
                  </label>
                  <button
                    onClick={() => onSwitchCamera()}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0f172a] border border-[#334155] hover:text-white text-slate-300 flex items-center gap-1"
                    title="Flip between front and rear cameras"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Flip ({facingMode === 'user' ? 'Front' : 'Back'})</span>
                  </button>
                </div>

                {videoDevices.length > 0 ? (
                  <select
                    value={selectedVideoId}
                    onChange={(e) => onSwitchCamera(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-sky-400"
                  >
                    {videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] font-mono text-slate-400">
                    Camera active ({facingMode === 'user' ? 'Front' : 'Rear'})
                  </p>
                )}
              </div>
            )}

            {/* Microphone Controls */}
            {mode !== 'chat' && (
              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-sky-400" />
                  <span>Microphone Device</span>
                </label>

                {audioDevices.length > 0 ? (
                  <select
                    value={selectedAudioId}
                    onChange={(e) => onSwitchMic(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white outline-none font-mono focus:border-sky-400"
                  >
                    {audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] font-mono text-slate-400">
                    Default system microphone active
                  </p>
                )}
              </div>
            )}

            {/* Revoke Permission / Hardware Off Button */}
            <div className="pt-2 border-t border-[#334155]">
              <button
                type="button"
                onClick={onRevokePermissions}
                className="w-full py-2 px-3 rounded border border-red-600/50 bg-red-600/20 hover:bg-red-600/40 text-red-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Stop &amp; Revoke Hardware Access</span>
              </button>
              <p className="text-[10px] font-mono text-slate-400 text-center mt-1.5">
                Immediately turns off webcam LED and microphone lock
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
