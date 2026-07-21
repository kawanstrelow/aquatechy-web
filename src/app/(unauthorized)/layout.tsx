import Image from 'next/image';
import heroBackground from '/public/images/herobackground.jpeg';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen">
      <div className="fixed left-0 top-0 -z-50 h-screen w-screen">
        <Image
          className="h-screen w-screen object-cover"
          src={heroBackground}
          alt="Aquatechy background"
          quality="100"
        />
      </div>

      <div className="h flex h-[100%] max-h-[100vh] items-center justify-center">{children}</div>
    </div>
  );
}
