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
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-[#282828] rounded max-w-sm w-full p-4 sm:p-5 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222222] mb-4">
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Audio &amp; Video Devices
          </span>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-white p-1"
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
            <p className="text-[11px] text-[#888888] max-w-xs mx-auto">
              Camera and microphone streams are completely stopped and powered off at the operating system level.
            </p>
            <button
              onClick={onReacquirePermissions}
              className="w-full py-2 rounded bg-white hover:bg-[#e0e0e0] text-black font-mono font-semibold text-xs transition-colors"
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
                  <label className="text-[11px] font-mono text-[#aaaaaa] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <span>Camera Device</span>
                  </label>
                  <button
                    onClick={() => onSwitchCamera()}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f1f1f] border border-[#333333] hover:text-white text-[#cccccc] flex items-center gap-1"
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
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                  >
                    {videoDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] font-mono text-[#666666]">
                    Camera active ({facingMode === 'user' ? 'Front' : 'Rear'})
                  </p>
                )}
              </div>
            )}

            {/* Microphone Controls */}
            {mode !== 'chat' && (
              <div>
                <label className="block text-[11px] font-mono text-[#aaaaaa] mb-1.5 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-white" />
                  <span>Microphone Device</span>
                </label>

                {audioDevices.length > 0 ? (
                  <select
                    value={selectedAudioId}
                    onChange={(e) => onSwitchMic(e.target.value)}
                    className="w-full bg-[#161616] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                  >
                    {audioDevices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Microphone ${i + 1}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] font-mono text-[#666666]">
                    Default system microphone active
                  </p>
                )}
              </div>
            )}

            {/* Revoke Permission / Hardware Off Button */}
            <div className="pt-2 border-t border-[#222222]">
              <button
                type="button"
                onClick={onRevokePermissions}
                className="w-full py-2 px-3 rounded border border-red-900 bg-red-950/40 hover:bg-red-950 text-red-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <PowerOff className="w-3.5 h-3.5" />
                <span>Stop &amp; Revoke Hardware Access</span>
              </button>
              <p className="text-[10px] font-mono text-[#555555] text-center mt-1.5">
                Immediately turns off webcam LED and microphone lock
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
