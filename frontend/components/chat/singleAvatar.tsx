import Image from 'next/image';


const SingleAvatar = ({ src, alt }: { src: string; alt: string }) => (
  <Image
    src={src}
    alt={alt}
    width={100}
    height={100}
    className="rounded-full shrink-0 w-[60px] h-[60px] object-cover"
  />
);

export default SingleAvatar