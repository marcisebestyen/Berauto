import {AppShell} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import Header from "./Header.tsx";
import {NavbarMinimal} from "./NavbarMinimal.tsx";
import {Outlet} from "react-router-dom";

const BasicLayout = () => {
    const [opened, {toggle}] = useDisclosure();

    // Ez a sötét háttérszín tökéletes alap a dizájnhoz
    const appShellBg = '#0c0d21';

    return <>
        <AppShell
            header={{height: 80}}
            navbar={{
                width: 250,
                breakpoint: "sm",
                collapsed: {mobile: !opened},
            }}
            padding="md"
            style={{background: appShellBg}}
        >

            <AppShell.Header
                style={{
                    // Stílus átvéve a Paper komponensekről
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                    // Világos szegély a sötét háttéren
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderBottomWidth: '1px',
                    borderBottomStyle: 'solid',
                    // Eltávolítjuk a világos témájú árnyékot
                    boxShadow: 'none',
                }}
            >
                <Header opened={opened} toggle={toggle}></Header>
            </AppShell.Header>

            <AppShell.Navbar
                style={{
                    // A Navbar is megkapja a sötét stílust
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRightWidth: '1px',
                    borderRightStyle: 'solid',
                }}
            >
                <NavbarMinimal toggle={toggle}></NavbarMinimal>
            </AppShell.Navbar>

            <AppShell.Main style={{
                background: `url("/bg.png") no-repeat center center fixed`,
                backgroundSize: 'cover' // Biztosítjuk, hogy a háttér kitöltse a teret
            }}>
                <Outlet/>
            </AppShell.Main>
        </AppShell>
    </>
}

export default BasicLayout;