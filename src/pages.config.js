import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Products from './pages/Products';
import PackingList from './pages/PackingList';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Orders": Orders,
    "OrderDetail": OrderDetail,
    "Customers": Customers,
    "CustomerDetail": CustomerDetail,
    "Products": Products,
    "PackingList": PackingList,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};