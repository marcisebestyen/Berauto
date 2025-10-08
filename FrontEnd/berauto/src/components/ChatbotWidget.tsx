// src/components/ChatbotWidget.tsx

import { Affix, ActionIcon, Transition, Paper, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconMessageCircle, IconX } from '@tabler/icons-react';
import ChatInterface from './ChatInterface';

const ChatbotWidget: React.FC = () => {
    const [opened, { toggle }] = useDisclosure(false);

    return (
        <Affix position={{ bottom: rem(20), right: rem(20) }} zIndex={9999}>
            {/* Chat Window */}
            <Transition mounted={opened} transition="slide-up" duration={200}>
                {(styles) => (
                    <Paper
                        style={{
                            ...styles,
                            marginBottom: rem(70), // Space for the button
                        }}
                        shadow="xl"
                        p="xs"
                        radius="md"
                        withBorder
                    >
                        <ChatInterface />
                    </Paper>
                )}
            </Transition>

            {/* Floating Button */}
            <ActionIcon
                size="xl"
                radius="xl"
                color={opened ? 'red' : 'blue'}
                variant="filled"
                onClick={toggle}
                style={{
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
            >
                {opened ? <IconX size={24} /> : <IconMessageCircle size={24} />}
            </ActionIcon>
        </Affix>
    );
};

export default ChatbotWidget;