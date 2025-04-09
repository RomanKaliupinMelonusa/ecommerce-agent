export interface BagConfirmation {
    message: string;
    item: {
        product_id: string;
        name: string;
        thumbnail_url: string;
    };
    actions: string[];
}
