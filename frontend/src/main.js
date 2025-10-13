import './style.css'
import Alpine from 'alpinejs'

Alpine.data('product_list', () => ({
    products: 
    [
        {
            "product_title": "Ninja Luxe Café 3-in-1 Espresso, Drip Coffee and Cold Brew Machine | Integrated Grinder, Frother & Tamper | Stainless Steel | ES601",
            "product_price": "498.99",
            "product_original_price": "599.99"
        },
        {
            "product_title": "Breville Barista Express Impress Espresso Machine with Built‑In Conical Burr Grinder | Brushed Stainless Steel | BES876BSS",
            "product_price": "699.95",
            "product_original_price": "799.95"
        },
        {
            "product_title": "Keurig K‑Café SMART Single Serve Coffee Maker | Wi‑Fi Connected Brewer with Milk Frother | Black | K15",
            "product_price": "179.99",
            "product_original_price": "229.99"
        },
        {
            "product_title": "De'Longhi Magnifica Evo Fully Automatic Espresso Machine | LatteCrema System | Silver | ECAM29084SB",
            "product_price": "899.00",
            "product_original_price": "999.95"
        },
        {
            "product_title": "Cuisinart DGB‑2 Conical Burr Grind & Brew 12‑Cup Coffee Maker | Programmable | Stainless Steel",
            "product_price": "179.00",
            "product_original_price": "249.00"
        }
    ],
    errorMessage: '',
    add_product(product) 
    {
        if (this.products.some(p => p.product_title === product.product_title)) {
            this.errorMessage = "This product is already in the list."
            return
        }
        this.products.push(product)
        this.errorMessage = ''
    },
    remove_product(product) 
    {
        if (!this.products.some(p => p.product_title === product.product_title)){
            this.errorMessage = "This product is not in the list and cannot be removed."
            return
        }
        this.products = this.products.filter(
            p => p.product_title !== product.product_title
        )
        this.errorMessage = ''
    },
}))

Alpine.start()