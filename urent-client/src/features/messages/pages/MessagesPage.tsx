import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { CHATS } from "../../shared/data";
import { ChatListItem } from "../components/ChatListItem";

export function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState(CHATS[0]?.id ?? 0);
  const selectedChat = CHATS.find((chat) => chat.id === selectedChatId) ?? CHATS[0];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 shadow-sm ring-1 ring-slate-900/[0.04]">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">Trung tâm tin nhắn</h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi hội thoại với người thuê và chủ thiết bị theo thời gian thực.</p>
      </div>

      <div className="flex h-[min(560px,calc(100vh-15rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
        <div className="flex w-full flex-col border-slate-200/90 md:w-[min(100%,20rem)] md:border-r">
          <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Tin nhắn</h2>
            <p className="text-xs text-slate-500">Chọn cuộc trò chuyện để xem chi tiết.</p>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {CHATS.map((chat) => (
              <ChatListItem key={chat.id} chat={chat} selected={selectedChatId === chat.id} onSelect={setSelectedChatId} />
            ))}
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 flex-col bg-gradient-to-b from-slate-50/80 to-white md:flex">
          <div className="flex h-16 items-center border-b border-slate-200/70 px-6">
            <p className="text-sm font-semibold text-slate-800">{selectedChat?.name}</p>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
              <MessageSquare size={26} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{selectedChat?.name}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
              Khu vực chat đang ở chế độ demo. Kết nối API tin nhắn để hiển thị nội dung thật.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
