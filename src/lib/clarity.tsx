import Script from "next/script";

const Clarity = () => {
    return (
        <>
            <Script
                src={`https://www.clarity.ms/tag/${process.env.NEXT_PUBLIC_CLARITY_ID}`}
                strategy="afterInteractive"
            />
        </>
    );
}

export default Clarity;