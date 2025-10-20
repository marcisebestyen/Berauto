import {Center, Divider, Paper, Text} from "@mantine/core";

interface AuthContainerInterface {
    children: JSX.Element;
    title?: string;
}

const AuthContainer = ({children, title}: AuthContainerInterface) => {
    return (
        <div className="auth-container">
            <Center>
                <Paper radius="md" p="xl" withBorder maw={600} m={10}>
                    <Text size="lg" fw={500}>
                        {title || "Bérautó"}
                    </Text>
                    <Divider my="lg"/>
                    {children}
                </Paper>
            </Center>
        </div>
    );
};

export default AuthContainer;