

import { MessageSquareDashed} from 'lucide-react'

const NoChatSelected = () => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400 select-none">
    <div className="w-20 h-20 rounded-full bg-gray-300/10 border-2 border-gray-500/40 flex items-center justify-center">
      <MessageSquareDashed size={38} className="text-gray-500" />
    </div>
    <div className="text-center">
      <h2 className="text-xl font-semibold text-gray-300">No chat selected</h2>
      <p className="text-sm text-gray-500 mt-1">
        Pick a conversation from the left to start chatting
      </p>
    </div>
  </div>
);

export default NoChatSelected
