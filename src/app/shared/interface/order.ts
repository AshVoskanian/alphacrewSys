export interface OrderDetails {
  products: OrderDetailsProduct[];
  customer_details: CustomerDetails;
  billing_details: BillingDetails;
}

export interface OrderDetailsProduct {
  id: number;
  product_name: string;
  product_image: string;
  brand: string;
  color?: string;
  category?: string;
  price: number;
  discount_price?: number;
  quantity: number;
  total_quantity: number;
  sub_total: number;
  is_checked?: boolean;
}

export interface CustomerDetails {
  name: string;
  email: string;
  billing_address: string;
  shipping_address: string;
  delivery_slot: string;
  payment_method: string;
}

export interface BillingDetails {
  sub_total: number;
  shipping: string;
  coupon_discount: number;
  tax: number;
  total: number;
}
