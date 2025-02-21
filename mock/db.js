const { faker } = require('@faker-js/faker/locale/zh_CN');

function generateUsers(count = 10) {
    return Array.from({ length: count }, () => ({
        id: faker.string.uuid(),
        username: faker.internet.userName(),
        email: faker.internet.email(),
        avatar: faker.image.avatar(),
        nickname: faker.person.firstName(),
        department: faker.helpers.arrayElement(['技术部', '产品部', '运营部', '市场部']),
        status: faker.helpers.arrayElement(['active', 'inactive']),
        preferences: {
            theme: faker.helpers.arrayElement(['dark', 'light']),
            notifications: faker.datatype.boolean()
        },
        created_at: faker.date.past()
    }));
}

function generateOrders(count = 20) {
    return Array.from({ length: count }, () => ({
        id: `ORD${faker.string.alphanumeric(6).toUpperCase()}`,
        user_id: faker.string.uuid(),
        items: Array.from(
            { length: faker.number.int({ min: 1, max: 5 }) },
            () => ({
                product_id: `PROD${faker.string.alphanumeric(3).toUpperCase()}`,
                quantity: faker.number.int({ min: 1, max: 10 }),
                price: faker.number.float({ min: 10, max: 1000, precision: 0.01 })
            })
        ),
        total_amount: faker.number.float({ min: 100, max: 10000, precision: 0.01 }),
        shipping_address: {
            country: '中国',
            province: faker.location.state(),
            city: faker.location.city(),
            street: faker.location.street(),
            zip_code: faker.location.zipCode()
        },
        status: faker.helpers.arrayElement(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
        payment_method: faker.helpers.arrayElement(['alipay', 'wechat', 'creditcard']),
        created_at: faker.date.past(),
        updated_at: faker.date.recent()
    }));
}

function generateStatistics() {
    const today = new Date();
    const dailySales = Array.from({ length: 30 }, (_, index) => {
        const date = new Date();
        date.setDate(today.getDate() - index);
        return {
            date: date.toISOString().split('T')[0],
            amount: faker.number.float({ min: 1000, max: 50000, precision: 0.01 }),
            orders: faker.number.int({ min: 10, max: 100 })
        };
    });

    return {
        total_amount: faker.number.float({ min: 100000, max: 1000000, precision: 0.01 }),
        total_orders: faker.number.int({ min: 1000, max: 5000 }),
        daily_sales: dailySales
    };
}

module.exports = () => {
    return {
        users: generateUsers(),
        orders: generateOrders(),
        statistics: generateStatistics()
    };
}; 