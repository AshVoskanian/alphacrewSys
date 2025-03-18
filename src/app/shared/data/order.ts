import { OrderDetails } from "../interface/order";

export const orderDetails: OrderDetails = {
  products: [
    {
      id: 1,
      product_name: 'Lightweight Headphones',
      product_image: 'assets/images/dashboard-8/shop-categories/headphone.png',
      brand: 'Boat Rockerz',
      color: 'Gray',
      discount_price: 85.00,
      price: 100.00,
      quantity: 1,
      total_quantity: 15,
      sub_total: 85.00
    },
    {
      id: 2,
      product_name: 'Smart Watch',
      product_image: 'assets/images/dashboard-2/order/sub-product/24.png',
      brand: 'Fastrack',
      color: 'Brown',
      discount_price: 140.00,
      price: 200.00,
      quantity: 1,
      total_quantity: 10,
      sub_total: 140.00
    },
    {
      id: 3,
      product_name: 'Leather Handbag',
      product_image: 'assets/images/dashboard-2/order/sub-product/16.png',
      brand: 'Fendi',
      color: 'Pink',
      discount_price: 250.00,
      price: 300.00,
      quantity: 1,
      total_quantity: 30,
      sub_total: 250.00
    },
    {
      id: 4,
      product_name: 'Men\'s Shoes',
      product_image: 'assets/images/dashboard-2/order/sub-product/14.png',
      brand: 'Sneaker',
      color: 'Yellow',
      discount_price: 150.00,
      price: 180.00,
      quantity: 2,
      total_quantity: 5,
      sub_total: 300.00
    }
  ],
  customer_details: {
    name: 'Lucy Fisher',
    email: 'lucy.fisher@example.com',
    billing_address: '12B, Pine Valley Road, Seattle, Washington, United States 98101',
    shipping_address: '12B, Pine Valley Road, Seattle, Washington, United States 98101',
    delivery_slot: 'Standard Delivery|Approx 5 to 7 Days',
    payment_method: 'COD'
  },
  billing_details: {
    sub_total: 775.00,
    shipping: 'Free',
    coupon_discount: 30.00,
    tax: 18.00,
    total: 763.00
  }
}
