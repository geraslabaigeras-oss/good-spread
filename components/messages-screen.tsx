/* eslint-disable @next/next/no-img-element */
/**
 * The text a crew member receives after the producer approves a fix, as it looks in iOS Messages.
 * Same wording as lib/server/sms.ts (sent through Twilio).
 */
export function MessagesScreen({ name, before, after, place, url }: { name: string; before: string; after: string; place: string; url: string }) {
  return (
    <div className="flex size-full flex-col bg-white font-sans text-[13px] text-neutral-900">
      <div className="flex items-center justify-between px-7 pt-4 text-[12px] font-semibold"><span>9:41</span><span className="tracking-tight">▮▮▮ ◔</span></div>
      <div className="mt-3 flex flex-col items-center border-b border-neutral-200 pb-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-b from-neutral-300 to-neutral-400 text-[15px] font-semibold text-white">gs</div>
        <div className="mt-1 text-[11px] text-neutral-900">good spread ›</div>
      </div>
      <div className="flex-1 space-y-2 px-3 pt-4">
        <p className="text-center text-[10px] text-neutral-400">Text Message · Today 07:52</p>
        <div className="max-w-[82%] rounded-[18px] rounded-bl-[6px] bg-[#e9e9eb] px-3 py-2 leading-[17px]">
          good spread: {name}, your call moved {before} → {after}. Confirm: <span className="text-[#0a84ff] underline">{url}</span>
        </div>
        <div className="max-w-[82%] overflow-hidden rounded-[18px] bg-[#e9e9eb]">
          <div className="bg-neutral-900 px-3 py-4 text-white">
            <div className="text-[10px] opacity-70">Your day · updated</div>
            <div className="mt-1 flex items-baseline gap-2"><span className="text-[12px] line-through opacity-60">{before}</span><span className="text-[28px] font-light leading-none">{after}</span></div>
            <div className="mt-1 text-[10px] opacity-70">{place}</div>
          </div>
          <div className="px-3 py-2"><div className="text-[12px] font-semibold">Your call time</div><div className="text-[10px] text-neutral-500">good-spread.app</div></div>
        </div>
        <div className="ml-auto max-w-[60%] rounded-[18px] rounded-br-[6px] bg-[#34c759] px-3 py-2 text-white">Got it 👍</div>
        <p className="text-right text-[10px] text-neutral-400">Delivered</p>
      </div>
      <div className="mx-3 mb-6 flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-[12px] text-neutral-400">Text Message</div>
    </div>
  );
}
