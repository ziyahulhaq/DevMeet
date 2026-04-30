"use client";

import {FormEvent, useEffect, useMemo, useRef, useState} from "react";
import {Send} from "lucide-react";
import {io, type Socket} from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8001";

const ChatApp = () => {
    const socketRef = useRef<Socket | null>(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);
        const onReceiveMessage = (data: unknown) => {
            setMessages((prev) => [...prev, typeof data === "string" ? data : String(data)]);
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

    const canSend = useMemo(() => message.trim().length > 0, [message]);

    const sendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmed = message.trim();
        if (!trimmed) return;

        socketRef.current?.emit("send-message", trimmed);
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

            <div className="chat-messages" aria-live="polite">
                {messages.length === 0 ? (
                    <p className="chat-empty">No messages yet. Start the conversation.</p>
                ) : (
                    messages.map((msg, idx) => (
                        <div className="chat-bubble" key={`${idx}-${msg}`}>
                            {msg}
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
