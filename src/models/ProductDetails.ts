export interface ProductDetails {
    product_id: string;
    name: string;
    images: string[];
    description: string;
    materials: string[];
    stone_details: {
        type: string;
        carat: number;
        cut: string;
        clarity: string;
        color: string;
    };
    available_sizes: string[];
    customer_reviews: {
        user: string;rating: number;comment: string
    } [];
    care_instructions: string;
    price: number;
    currency: string;
    actions: string[];
}
