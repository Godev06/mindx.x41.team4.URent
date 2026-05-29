import React, { useState, useEffect, useRef } from "react";
import { MapPin, Loader2, AlertCircle, Check, ChevronDown } from "lucide-react";

interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
}

interface District {
  code: number;
  name: string;
  codename: string;
  division_type: string;
}

interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
}

interface AddressSelectorProps {
  onSelect: (fullAddress: string) => void;
  lang?: "vi" | "en";
}

// Accent-insensitive and case-insensitive Vietnamese search helper
function removeVietnameseTones(str: string): string {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return str.toLowerCase();
}

interface SearchableSelectProps {
  options: Array<{ code: number; name: string }>;
  value: number | "";
  onChange: (value: number) => void;
  placeholder: string;
  disabled?: boolean;
  isLoading?: boolean;
  lang?: "vi" | "en";
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
  isLoading = false,
  lang = "vi",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.code === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    return removeVietnameseTones(opt.name).includes(removeVietnameseTones(searchQuery));
  });

  const handleSelect = (code: number) => {
    onChange(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleInputFocus = () => {
    if (!disabled && !isLoading) {
      setIsOpen(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Input */}
      <div
        className={`relative flex items-center rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/50 outline-none transition-all w-full h-[46px] px-3.5 ${disabled || isLoading
          ? "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950/20"
          : "cursor-pointer focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/5"
          }`}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-teal-500 mr-2 shrink-0" />
        ) : null}

        <input
          type="text"
          value={isOpen ? searchQuery : selectedOption ? selectedOption.name : ""}
          placeholder={selectedOption ? selectedOption.name : placeholder}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true);
            setSearchQuery(e.target.value);
          }}
          onFocus={handleInputFocus}
          disabled={disabled || isLoading}
          className="w-full h-full bg-transparent text-sm font-semibold text-slate-850 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none cursor-text pr-6"
        />

        <ChevronDown
          size={14}
          className={`absolute right-3.5 text-slate-400 transition-transform duration-300 pointer-events-none ${isOpen ? "transform rotate-180" : ""
            }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && !isLoading && (
        <div className="absolute z-50 left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white dark:bg-slate-850 shadow-2xl border border-slate-150 dark:border-slate-800/80 divide-y divide-slate-50 dark:divide-slate-800/50 animate-in fade-in zoom-in-95 duration-200 scrollbar-thin">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => {
              const isSelected = opt.code === value;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelect(opt.code)}
                  className={`w-full px-4 py-3 text-left text-xs font-semibold hover:bg-teal-500/10 dark:hover:bg-teal-500/20 transition-colors flex items-center justify-between ${isSelected
                    ? "text-teal-600 dark:text-teal-400 bg-teal-500/5"
                    : "text-slate-700 dark:text-slate-300"
                    }`}
                >
                  <span className="truncate pr-4">{opt.name}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-teal-500" />}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3.5 text-xs text-center font-bold text-slate-400 dark:text-slate-500">
              {lang === "vi" ? "Không tìm thấy kết quả" : "No results found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  onSelect,
  lang = "vi",
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<number | "">("");
  const [selectedDistrict, setSelectedDistrict] = useState<number | "">("");
  const [selectedWard, setSelectedWard] = useState<number | "">("");
  const [streetAddress, setStreetAddress] = useState<string>("");

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplied, setIsApplied] = useState(false);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      setError(null);
      try {
        const response = await fetch("https://provinces.open-api.vn/api/p/");
        if (!response.ok) {
          throw new Error("Không thể tải danh sách tỉnh/thành phố.");
        }
        const data = await response.json();
        if (Array.isArray(data)) {
          setProvinces(data);
        }
      } catch (err: any) {
        console.error("Lỗi tải tỉnh/thành:", err);
        setError(
          lang === "vi"
            ? "Không thể kết nối đến máy chủ địa chỉ. Vui lòng tự nhập thủ công ở ô trên!"
            : "Failed to connect to the address server. Please enter manually above!"
        );
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, [lang]);

  // Fetch districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      setSelectedDistrict("");
      setSelectedWard("");
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      setError(null);
      try {
        const response = await fetch(
          `https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`
        );
        if (!response.ok) {
          throw new Error("Không thể tải danh sách quận/huyện.");
        }
        const data = await response.json();
        if (data && Array.isArray(data.districts)) {
          setDistricts(data.districts);
        }
        setWards([]);
        setSelectedDistrict("");
        setSelectedWard("");
      } catch (err: any) {
        console.error("Lỗi tải quận/huyện:", err);
        setError(
          lang === "vi"
            ? "Không thể tải danh sách quận/huyện. Vui lòng thử lại!"
            : "Failed to load districts. Please try again!"
        );
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedProvince, lang]);

  // Fetch wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard("");
      return;
    }

    const fetchWards = async () => {
      setIsLoadingWards(true);
      setError(null);
      try {
        const response = await fetch(
          `https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`
        );
        if (!response.ok) {
          throw new Error("Không thể tải danh sách phường/xã.");
        }
        const data = await response.json();
        if (data && Array.isArray(data.wards)) {
          setWards(data.wards);
        }
        setSelectedWard("");
      } catch (err: any) {
        console.error("Lỗi tải phường/xã:", err);
        setError(
          lang === "vi"
            ? "Không thể tải danh sách phường/xã. Vui lòng thử lại!"
            : "Failed to load wards. Please try again!"
        );
      } finally {
        setIsLoadingWards(false);
      }
    };

    fetchWards();
  }, [selectedDistrict, lang]);

  // Compile full address string
  const getCompiledAddress = () => {
    const provinceObj = provinces.find((p) => p.code === selectedProvince);
    const districtObj = districts.find((d) => d.code === selectedDistrict);
    const wardObj = wards.find((w) => w.code === selectedWard);

    const parts: string[] = [];

    if (streetAddress.trim()) {
      parts.push(streetAddress.trim());
    }
    if (wardObj) {
      parts.push(wardObj.name);
    }
    if (districtObj) {
      parts.push(districtObj.name);
    }
    if (provinceObj) {
      parts.push(provinceObj.name);
    }

    return parts.join(", ");
  };

  const handleApplyAddress = () => {
    const fullAddress = getCompiledAddress();
    if (!fullAddress) return;

    onSelect(fullAddress);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
  };

  const isFormValid = selectedProvince && selectedDistrict && selectedWard;

  return (
    <div className="rounded-3xl border border-slate-100/80 bg-slate-50/50 p-5 dark:border-slate-800/40 dark:bg-slate-900/20 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-150 dark:border-slate-800/60 pb-3">
        <MapPin size={16} className="text-teal-500 animate-pulse" />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs font-bold text-amber-600 dark:text-amber-400">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {lang === "vi" ? "Tỉnh / Thành phố" : "Province / City"}
          </label>
          <SearchableSelect
            options={provinces}
            value={selectedProvince}
            onChange={setSelectedProvince}
            placeholder={lang === "vi" ? "Chọn Tỉnh/Thành phố..." : "Select Province..."}
            isLoading={isLoadingProvinces}
            lang={lang}
          />
        </div>

        {/* District Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {lang === "vi" ? "Quận / Huyện" : "District"}
          </label>
          <SearchableSelect
            options={districts}
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            placeholder={lang === "vi" ? "Chọn Quận/Huyện..." : "Select District..."}
            disabled={!selectedProvince}
            isLoading={isLoadingDistricts}
            lang={lang}
          />
        </div>

        {/* Ward Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {lang === "vi" ? "Phường / Xã" : "Ward / Commune"}
          </label>
          <SearchableSelect
            options={wards}
            value={selectedWard}
            onChange={setSelectedWard}
            placeholder={lang === "vi" ? "Chọn Phường/Xã..." : "Select Ward..."}
            disabled={!selectedDistrict}
            isLoading={isLoadingWards}
            lang={lang}
          />
        </div>
      </div>

      {/* Street Address Input */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          {lang === "vi" ? "Số nhà, tên đường, ngõ hẻm..." : "Street address, house number..."}
        </label>
        <input
          type="text"
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          placeholder={lang === "vi" ? "Ví dụ: 123 Lê Lợi hoặc Toà nhà A..." : "e.g. 123 Le Loi or Block A..."}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100"
        />
      </div>

      {/* Compile and Apply Address Preview */}
      {isFormValid && (
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-150 dark:border-slate-800 p-4 mt-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex-1 w-full text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {lang === "vi" ? "Địa chỉ sẽ được điền:" : "Compiled address to apply:"}
            </span>
            <p className="mt-1 text-sm font-bold text-slate-850 dark:text-slate-200 select-all leading-relaxed">
              {getCompiledAddress()}
            </p>
          </div>
          <button
            type="button"
            onClick={handleApplyAddress}
            className={`w-full md:w-auto shrink-0 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md active:scale-95 transition-all ${isApplied
              ? "bg-emerald-600 dark:bg-emerald-500 shadow-emerald-500/20"
              : "bg-slate-900 dark:bg-teal-600 hover:shadow-lg hover:scale-[1.02] hover:bg-slate-850 dark:hover:bg-teal-500 shadow-slate-900/10 dark:shadow-teal-900/20"
              }`}
          >
            {isApplied ? (
              <>
                <Check size={14} className="animate-bounce" />
                {lang === "vi" ? "Đã áp dụng!" : "Applied!"}
              </>
            ) : (
              <>
                <MapPin size={14} />
                {lang === "vi" ? "Xác nhận & Điền địa chỉ" : "Apply Address"}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
