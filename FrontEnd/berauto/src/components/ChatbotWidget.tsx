import {Affix, ActionIcon, Transition, rem} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {IconMessageCircle, IconX} from '@tabler/icons-react';
import ChatInterface from './ChatInterface';

const ChatbotWidget: React.FC = () => {
    const [opened, {toggle}] = useDisclosure(false);

    return (
        <Affix position={{bottom: rem(20), right: rem(20)}} zIndex={9999}>
            <Transition mounted={opened} transition="slide-up" duration={300} timingFunction="ease">
                {(styles) => (
                    <div style={{...styles, marginBottom: rem(15)}}>
                        <ChatInterface onClose={toggle}/>
                    </div>
                )}
            </Transition>

            <ActionIcon
                size="xl"
                radius="xl"
                color={opened ? 'red' : 'blue'}
                variant="filled"
                onClick={toggle}
                style={{
                    boxShadow: 'var(--mantine-shadow-md)',
                }}
            >
                {opened ? <IconX size={24}/> : <IconMessageCircle size={24}/>}
            </ActionIcon>
        </Affix>
    );
};

export default ChatbotWidget;