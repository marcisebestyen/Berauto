import React, {useState, useEffect, useRef} from 'react';
import {
    Stack,
    TextInput,
    ActionIcon,
    Paper,
    Text,
    Loader,
    rem,
    Group,
    Title,
    ScrollArea,
    ThemeIcon,
    useMantineTheme,
} from '@mantine/core';
import {IconSend, IconMessageChatbot, IconX} from '@tabler/icons-react';
import dayjs from 'dayjs';

import {getFaqAnswer} from '../api/faqApi';
import {ChatMessage} from '../interfaces/chat';

const INITIAL_MESSAGES: ChatMessage[] = [
    {
        id: 1,
        text: 'Üdvözöllek! Miben segíthetek ma?',
        sender: 'bot',
        timestamp: new Date(),
    },
];

interface ChatInterfaceProps {
    onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({onClose}) => {
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState('');
    const [isBotTyping, setIsBotTyping] = useState(false);
    const viewport = useRef<HTMLDivElement>(null);

    useEffect(() => {
        viewport.current?.scrollTo({top: viewport.current.scrollHeight, behavior: 'smooth'});
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

        setMessages((prev) => [...prev, newUserMessage]);
        setInputValue('');
        setIsBotTyping(true);

        try {
            const botAnswer = await getFaqAnswer(userQuestion);
            const botMessage: ChatMessage = {
                id: Date.now() + 1,
                text: botAnswer,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot API hiba:", error);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                text: "Sajnálom, de hiba történt a válaszadás során. Kérlek, próbáld újra később.",
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
        <Paper
            withBorder
            shadow="md"
            radius="md"
            p="sm"
            style={{width: rem(350), height: rem(500), display: 'flex', flexDirection: 'column'}}
        >
            <Group justify="space-between" pb="xs" mb="xs"
                   style={{borderBottom: `1px solid var(--mantine-color-gray-2)`}}>
                <Group gap="xs">
                    <IconMessageChatbot size={20}/>
                    <Title order={5}>Online Segítség</Title>
                </Group>
                {onClose && (
                    <ActionIcon variant="subtle" color="gray" onClick={onClose} aria-label="Chat bezárása">
                        <IconX size={18}/>
                    </ActionIcon>
                )}
            </Group>

            <ScrollArea viewportRef={viewport} style={{flex: 1}} type="auto">
                <Stack gap="md" p="xs">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg}/>
                    ))}
                    {isBotTyping && <TypingIndicator/>}
                </Stack>
            </ScrollArea>

            <TextInput
                mt="sm"
                placeholder="Kérdezz valamit..."
                value={inputValue}
                onChange={(e) => setInputValue(e.currentTarget.value)}
                onKeyDown={handleKeyPress}
                disabled={isBotTyping}
                rightSection={
                    <ActionIcon onClick={handleSendMessage} disabled={inputValue.trim() === '' || isBotTyping}
                                variant="filled" size="lg" radius="xl">
                        <IconSend size={16}/>
                    </ActionIcon>
                }
                radius="xl"
            />
        </Paper>
    );
};

const MessageBubble: React.FC<{ message: ChatMessage }> = ({message}) => {
    const isBot = message.sender === 'bot';
    const theme = useMantineTheme();
    return (
        <Group gap="sm" wrap="nowrap" style={{alignSelf: isBot ? 'flex-start' : 'flex-end'}}>
            {isBot && (
                <ThemeIcon size="sm" radius="xl" variant="light">
                    <IconMessageChatbot size={14}/>
                </ThemeIcon>
            )}
            <Paper p="xs" radius="md" bg={isBot ? 'gray.1' : theme.primaryColor} style={{maxWidth: '85%'}}>
                <Text size="sm" c={isBot ? 'dark' : 'white'}>{message.text}</Text>
                <Text size="xs" c={isBot ? 'dimmed' : theme.colors.blue[1]} ta="right" mt={4}>
                    {dayjs(message.timestamp).format('HH:mm')}
                </Text>
            </Paper>
        </Group>
    );
};

const TypingIndicator = () => (
    <Group gap="sm" wrap="nowrap" style={{alignSelf: 'flex-start'}}>
        <ThemeIcon size="sm" radius="xl" variant="light">
            <IconMessageChatbot size={14}/>
        </ThemeIcon>
        <Paper p="xs" radius="md" bg={'gray.1'}>
            <Loader size="xs" type="dots"/>
        </Paper>
    </Group>
);

export default ChatInterface;