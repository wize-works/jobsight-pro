import Image from 'next/image';
export default function Loading() {
    return (
        <div className="flex flex-col justify-center items-center h-[calc(100svh-20rem)]">
            <div className="mb-8">
                {/* Your logo here */}
                <Image src="/logo-full.png" alt="Logo" width={200} height={200} />
            </div>

            <div className="w-64">
                {/* Your progress bar here */}
                <progress className="progress progress-neutral w-full" />
            </div>
        </div>
    );
}