import { useState } from "react";
import { MapPin, X, Send, ChevronRight } from "lucide-react";

interface LocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

const DEMO_LOCATIONS = [
  {
    name: "Tao Đàn Park",
    latitude: 10.7769,
    longitude: 106.7009,
    address: "Tao Đàn Park, District 1, Ho Chi Minh City",
  },
  {
    name: "Ben Thanh Market",
    latitude: 10.7707,
    longitude: 106.6986,
    address: "Ben Thanh Market, District 1, Ho Chi Minh City",
  },
  {
    name: "Notre-Dame Cathedral",
    latitude: 10.7837,
    longitude: 106.6954,
    address: "Notre-Dame Cathedral, District 1, Ho Chi Minh City",
  },
  {
    name: "Central Post Office",
    latitude: 10.7823,
    longitude: 106.6973,
    address: "Central Post Office, District 1, Ho Chi Minh City",
  },
  {
    name: "Bitexco Financial Tower",
    latitude: 10.7656,
    longitude: 106.6981,
    address: "Bitexco Financial Tower, District 1, Ho Chi Minh City",
  },
  {
    name: "Reunification Palace",
    latitude: 10.7858,
    longitude: 106.6915,
    address: "Reunification Palace, District 1, Ho Chi Minh City",
  },
];

export function LocationPicker({
  isOpen,
  onClose,
  onSelectLocation,
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customLat, setCustomLat] = useState("10.7769");
  const [customLng, setCustomLng] = useState("106.7009");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <MapPin size={20} />
          Chia sẻ vị trí
        </h2>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-700"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!useCustom ? (
          <div>
            <p className="text-sm text-slate-600 mb-4">Chọn vị trí có sẵn:</p>
            <div className="space-y-2">
              {DEMO_LOCATIONS.map((location) => (
                <button
                  key={location.name}
                  onClick={() => setSelectedLocation(location)}
                  className={`w-full p-3 rounded-lg border-2 transition text-left ${
                    selectedLocation?.latitude === location.latitude &&
                    selectedLocation?.longitude === location.longitude
                      ? "border-teal-600 bg-teal-50"
                      : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        📍 {location.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {location.latitude.toFixed(4)},{" "}
                        {location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-400 flex-shrink-0"
                    />
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setUseCustom(true)}
              className="w-full mt-4 p-3 rounded-lg border-2 border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 text-sm font-medium transition"
            >
              Nhập tọa độ tùy chỉnh
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setUseCustom(false)}
              className="text-sm text-teal-600 hover:text-teal-700 mb-4 font-medium"
            >
              ← Quay lại danh sách
            </button>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-900 block mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  step="0.001"
                  placeholder="10.7769"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900 block mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  step="0.001"
                  placeholder="106.7009"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <button
                onClick={() => {
                  const location = {
                    latitude: parseFloat(customLat) || 10.7769,
                    longitude: parseFloat(customLng) || 106.7009,
                    address: `${customLat}, ${customLng}`,
                  };
                  setSelectedLocation(location);
                }}
                className="w-full mt-3 p-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
              >
                Lưu tọa độ
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4">
        {selectedLocation ? (
          <div>
            <p className="text-sm text-slate-600 mb-2">Vị trí đã chọn:</p>
            <p className="text-sm font-medium text-slate-900 mb-3">
              {selectedLocation.address}
            </p>
            <button
              onClick={() => {
                onSelectLocation(selectedLocation);
                onClose();
                setUseCustom(false);
                setSelectedLocation(null);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-white hover:bg-teal-700 transition"
            >
              <Send size={16} />
              Gửi vị trí
            </button>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-4">
            Chọn vị trí để tiếp tục
          </p>
        )}
      </div>
    </div>
  );
}
