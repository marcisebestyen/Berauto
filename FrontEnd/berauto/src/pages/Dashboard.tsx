import {useEffect} from "react";

const Dashboard = () => {

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = () => {

    }

    return <>Dashboard Page</>
}

export default Dashboard;