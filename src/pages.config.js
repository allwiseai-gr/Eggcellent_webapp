import CustomerDetail from './pages/CustomerDetail.js';
import Customers from './pages/Customers.js';
import Dashboard from './pages/Dashboard.js';
import OrderDetail from './pages/OrderDetail.js';
import Orders from './pages/Orders.js';
import PackingList from './pages/PackingList.js';
import Products from './pages/Products.js';
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