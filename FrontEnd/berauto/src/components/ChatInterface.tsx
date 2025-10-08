// src/components/ChatInterface.tsx

import { useState, useEffect, useRef } from 'react';
import { Stack, TextInput, ActionIcon, Paper, Text, Box, Loader, rem } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { getFaqAnswer } from '../api/faqApi';
import { ChatMessage } from '../interfaces/chat';

// Initial welcome messages
const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: 1,
        text: 'Üdvözöllek! Miben segíthetek ma?',
        sender: 'bot',
        timestamp: new Date(),
    },
];

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isBotTyping]);

    const handleSendMessage = async () => {
        const userQuestion = inputValue.trim();
        if (userQuestion === '' || isBotTyping) return;

        const newUserMessage: ChatMessage = {
            id: Date.now(),
            text: userQuestion,
            sender: 'user',
            timestamp: new Date(),
        };

        // Add user message and clear input
        setMessages((prev) => [...prev, newUserMessage]);
        setInputValue('');

        // Start typing indicator
        setIsBotTyping(true);

        try {
            // Call the backend RAG service
            const botAnswer = await getFaqAnswer(userQuestion);

            const botMessage: ChatMessage = {
                id: Date.now() + 1,
                text: botAnswer,
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, botMessage]);

        } catch (error) {
            console.error("Chatbot API failed:", error);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                text: "Kritikus hiba: Nem sikerült a válasz lekérése a központi rendszertől.",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsBotTyping(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <Stack gap="xs" style={{ width: rem(320), height: rem(450) }}>
            {/* Chat Header */}
            <Paper withBorder p="xs" radius="md" bg="blue.6">
                <Text size="sm" fw={700} c="white">
                    Ügyfélszolgálat
                </Text>
            </Paper>

            {/* Messages Container */}
            <Paper
                withBorder
                p="xs"
                radius="md"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: rem(8),
                }}
            >
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Typing Indicator */}
                {isBotTyping && (
                    <Box style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <Loader size="xs" />
                        <Text size="sm" c="dimmed">
                            Gépelés...
                        </Text>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Paper>

            {/* Input Area */}
            <TextInput
                placeholder="Írj egy üzenetet..."
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyPress={handleKeyPress}
                disabled={isBotTyping}
                rightSection={
                    <ActionIcon
                        onClick={handleSendMessage}
                        disabled={inputValue.trim() === '' || isBotTyping}
                        color="blue"
                        variant="filled"
                        size="sm"
                    >
                        <IconSend size={16} />
                    </ActionIcon>
                }
            />
        </Stack>
    );
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isBot = message.sender === 'bot';

    return (
        <Box
            style={{
                display: 'flex',
                justifyContent: isBot ? 'flex-start' : 'flex-end',
                width: '100%',
            }}
        >
            <Paper
                p="xs"
                radius="md"
                bg={isBot ? 'gray.1' : 'blue.6'}
                style={{
                    maxWidth: '80%',
                }}
            >
                <Text size="sm" c={isBot ? 'dark' : 'white'}>
                    {message.text}
                </Text>
            </Paper>
        </Box>
    );
};

export default ChatInterface;