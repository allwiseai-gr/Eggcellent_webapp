import CustomerDetail from './pages/CustomerDetail.jsx';
import Customers from './pages/Customers.jsx';
import Dashboard from './pages/Dashboard.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Orders from './pages/Orders.jsx';
import PackingList from './pages/PackingList.jsx';
import Products from './pages/Products.jsx';
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