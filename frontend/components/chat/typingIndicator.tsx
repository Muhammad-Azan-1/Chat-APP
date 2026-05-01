"use client";

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-[#1e2029]/60 border-t border-gray-600/20">
      <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-full border border-gray-600/30">
        <span className="text-sm text-gray-300">typing</span>
        <div className="flex gap-1 items-center">
          <span
            className="w-1.5 h-1.5 bg-[#6c75f5] rounded-full animate-bounce"
            style={{ animationDelay: "0ms", animationDuration: "1s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-[#6c75f5] rounded-full animate-bounce"
            style={{ animationDelay: "200ms", animationDuration: "1s" }}
          />
          <span
            className="w-1.5 h-1.5 bg-[#6c75f5] rounded-full animate-bounce"
            style={{ animationDelay: "400ms", animationDuration: "1s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
