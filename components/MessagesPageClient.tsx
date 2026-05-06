"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ChatApp from "@/components/ChatApp";

const MessagesPageClient = () => {
    const router = useRouter();

    return (
        <section id="messages-page" aria-label="Messages">
            <aside className="messages-sidebar">
                <div className="messages-brand">
                    <Image src="/icons/logo.png" alt="DevEvent logo" width={34} height={34} />
                    <span>DevEvent</span>
                    <div className="messages-avatar">B</div>
                </div>

                <button
                    type="button"
                    aria-label="Go back"
                    className="messages-back"
                    onClick={() => router.back()}
                >
                    <ArrowLeft aria-hidden="true" className="size-5" />
                    <span>Back</span>
                </button>
            </aside>

            <div className="messages-workspace">
                <ChatApp />
            </div>
        </section>
    );
};

export default MessagesPageClient;
