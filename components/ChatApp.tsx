"use client";

import {FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Send} from "lucide-react";
import {io, type Socket} from "socket.io-client";
import {USER_EMAIL_STORAGE_KEY} from "@/lib/constants";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8001";

type ChatAppProps = {
    userEmail?: string;
};

type StoredMessage = {
    id?: number;
    user_email?: string;
    message?: string;
};

const ChatApp = ({userEmail}: ChatAppProps) => {
    const socketRef = useRef<Socket | null>(null);
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState(() => {
        const normalizedUserEmail = userEmail?.trim().toLowerCase();
        if (normalizedUserEmail) return normalizedUserEmail;
        return "";
    });
    const [messages, setMessages] = useState<StoredMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [hasLoadedEmail, setHasLoadedEmail] = useState(Boolean(userEmail?.trim()));

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            if (userEmail) {
                const normalizedUserEmail = userEmail.trim().toLowerCase();
                localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedUserEmail);
                setEmail(normalizedUserEmail);
                setHasLoadedEmail(true);
                return;
            }

            const storedEmail = localStorage.getItem(USER_EMAIL_STORAGE_KEY);
            if (storedEmail) setEmail(storedEmail);
            setHasLoadedEmail(true);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [userEmail]);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        const onReceiveMessage = (data: StoredMessage | string) => {
            const nextMessage = typeof data === "string" ? {message: data} : data;
            setMessages((prev) => [...prev, nextMessage]);
        };

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("receive-message", onReceiveMessage);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("receive-message", onReceiveMessage);
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
    const canSend = useMemo(
        () => message.trim().length > 0 && normalizedEmail.length > 0,
        [message, normalizedEmail]
    );

    const sendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (!trimmed || !normalizedEmail) return;

        localStorage.setItem(USER_EMAIL_STORAGE_KEY, normalizedEmail);

        socketRef.current?.emit("send-message", {
            email: normalizedEmail,
            message: trimmed,
        });
        setMessage("");
    };

    return (
        <section className="chat-card" aria-label="Live chat">
            <header className="chat-header">
                <div>
                    <h1>Live Chat</h1>
                    <span>
                        {messages.length} message{messages.length === 1 ? "" : "s"}
                    </span>
                </div>

                <div className={isConnected ? "chat-status connected" : "chat-status"}>
                    {isConnected ? "Connected" : "Offline"}
                </div>
            </header>

            {normalizedEmail ? (
                <div className="chat-identity" aria-label={`Messaging as ${normalizedEmail}`}>
                    Messaging as <strong>{normalizedEmail}</strong>
                </div>
            ) : null}

            <div className="chat-messages" aria-live="polite">
                {!hasLoadedEmail ? (
                    <p className="chat-empty">Loading your chat...</p>
                ) : !normalizedEmail ? (
                    <p className="chat-empty">Please submit your email on an event page before opening chat.</p>
                ) : messages.length === 0 ? (
                    <p className="chat-empty">No messages yet. Start the conversation.</p>
                ) : (
                    messages.map((msg, idx) => (
                        <div className="chat-bubble" key={msg.id ?? `${idx}-${msg.message}`}>
                            {msg.user_email ? <strong>{msg.user_email}: </strong> : null}
                            {msg.message}
                        </div>
                    ))
                )}
            </div>

            <form className="chat-input-row" onSubmit={sendMessage}>
                <input
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Type a message..."
                    className="chat-input"
                    disabled={!normalizedEmail}
                />
                <button type="submit" disabled={!canSend} className="chat-send-btn">
                    <Send aria-hidden="true" className="size-5" />
                    <span>Send</span>
                </button>
            </form>
        </section>
    );
};

export default ChatApp;
