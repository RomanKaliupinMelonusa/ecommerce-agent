export interface Product {
    product_id: string;
    name: string;
    image_url: string;
    short_description: string;
    price: number;
    currency: string;
    quick_actions: string[];
}
