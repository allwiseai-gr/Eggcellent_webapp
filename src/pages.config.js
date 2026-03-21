import CustomerDetail from './pages/CustomerDetail';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import OrderDetail from './pages/OrderDetail';
import Orders from './pages/Orders';
import PackingList from './pages/PackingList';
import Products from './pages/Products';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CustomerDetail": CustomerDetail,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "OrderDetail": OrderDetail,
    "Orders": Orders,
    "PackingList": PackingList,
    "Products": Products,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};