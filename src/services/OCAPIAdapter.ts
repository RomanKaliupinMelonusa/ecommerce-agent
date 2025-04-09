import { Product } from '../models/Product';
import { ProductDetails } from '../models/ProductDetails';

export class OCAPIAdapter {
    // Transform raw search results to Product[]
    static transformProductSearchResponse(data: any): Product[] {
        return data.products.map((p: any) => ({
            product_id: p.id,
            name: p.name,
            image_url: p.image,
            short_description: p.description,
            price: p.price,
            currency: p.currency,
            quick_actions: ['view_details', 'add_to_bag']
        }));
    }

    // Transform raw details response to ProductDetails
    static transformProductDetailsResponse(data: any): ProductDetails {
        return {
            product_id: data.id,
            name: data.name,
            images: data.images,
            description: data.full_description,
            materials: data.materials,
            stone_details: data.stone_details,
            available_sizes: data.sizes,
            customer_reviews: data.reviews,
            care_instructions: data.care_instructions,
            price: data.price,
            currency: data.currency,
            actions: ['add_to_bag']
        };
    }
}
