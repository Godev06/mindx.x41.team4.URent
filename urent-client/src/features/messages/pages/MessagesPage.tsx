import { useState } from "react";
import { CHATS } from "../../shared/data";

export function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState(CHATS[0]?.id ?? 0);
  const selectedChat = CHATS.find((chat) => chat.id === selectedChatId) ?? CHATS[0];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="w-full md:w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-50">
          <h3 className="font-bold">Tin nhan</h3>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {CHATS.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={`p-5 flex items-start gap-3 cursor-pointer border-l-4 transition-all ${selectedChatId === chat.id ? "bg-blue-50/50 border-blue-600" : "border-transparent hover:bg-gray-50"}`}
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">{chat.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className="font-bold text-sm truncate">{chat.name}</h4>
                  <span className="text-[10px] text-gray-400 font-bold">{chat.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{chat.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:flex flex-1 flex-col bg-gray-50/30 p-8">
        <h4 className="font-bold text-lg mb-2">{selectedChat?.name}</h4>
        <p className="text-sm text-gray-500">Hoi thoai dang duoc demo theo feature messages.</p>
      </div>
    </div>
  );
}
