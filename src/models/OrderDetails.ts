export interface OrderDetails {
    order_number: string;
    status: string;
    shipping_carrier: string;
    tracking_number: string;
    estimated_delivery: string;
    items: {
        name: string;quantity: number
    } [];
    shipping_address: {
        name: string;
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}
