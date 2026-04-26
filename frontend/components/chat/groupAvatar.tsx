
import Image from "next/image";

const GroupAvatar = ({ avatars }: { avatars: string[] }) => (
  <div className="relative shrink-0 w-[60px] h-[60px]">
    <Image
      src={avatars[0]}
      alt="Member 1"
      width={100}
      height={100}
      className="absolute top-0 right-0 rounded-full w-[42px] h-[42px] object-cover border-2 border-[#24262e]"
    />
    <Image
      src={avatars[1] ?? avatars[0]}
      alt="Member 2"
      width={100}
      height={100}
      className="absolute bottom-0 left-0 rounded-full w-[42px] h-[42px] object-cover border-2 border-[#24262e] z-10"
    />
  </div>
);


export default GroupAvatar